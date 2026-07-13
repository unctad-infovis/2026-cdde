import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as topojson from 'topojson-client';
import { SMALL_ISLAND_DOTS } from '../../../data/sids';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import CircleFlag from '../../general/CircleFlag';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ChartTooltip from '../shared/ChartTooltip';
import CountrySearch from '../shared/CountrySearch';

import { DEP_COLOR_SCALE, GROUP_COLORS, NO_DATA_FILL } from '../shared/cdde-constants';
import './DependenceMap.css';

const MAX_H = 480;

// HKG, MAC, TWN share China's data and highlight together
const CHINA_GROUP = new Set(['CHN', 'HKG', 'TWN', 'MAC']);
const CHINA_DELEGATE = new Set(['HKG', 'TWN', 'MAC']);

const EXP_LEGEND_ITEMS = [
  { label: '0–20%', color: DEP_COLOR_SCALE[0].color },
  { label: '20–40%', color: DEP_COLOR_SCALE[1].color },
  { label: '40–60%', color: DEP_COLOR_SCALE[2].color },
  { label: '60–80%', color: 'var(--un-color-blue-dark)', note: '≥ 60% commodity-dependent' },
  { label: '80–100%', color: 'var(--un-color-blue-darkest)' },
];

const GROUP_LABELS = {
  agri: 'Agriculture',
  energy: 'Energy',
  mining: 'Mining',
  'non-dependent': 'Non-commodity-dependent'
};

const GROUP_NOTES = {
  agri: 'Food and agricultural raw materials',
  energy: 'Oil, gas, coal',
  mining: 'Minerals, ores and metals',
  'non-dependent': 'Below 60% threshold'
};

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getExpColor(pct) {
  if (pct === null || pct === undefined) return NO_DATA_FILL;
  let color = DEP_COLOR_SCALE[0].color;
  for (const step of DEP_COLOR_SCALE) {
    if (pct >= step.threshold) color = step.color;
  }
  return color;
}

function getGroupColor(group) {
  return GROUP_COLORS[group] || NO_DATA_FILL;
}

export default function DependenceMap({ insight, note, source, subtitle, title }) {
  const [geoData, setGeoData] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [view, setView] = useState('export');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [zt, setZt] = useState({ x: 0, y: 0, k: 1 });
  const [svgW, setSvgW] = useState(960);
  const H = svgW > 0 ? Math.min(MAX_H, Math.round(svgW * 0.65)) : MAX_H;
  const panelRef = useRef(null);
  const mapAreaRef = useRef(null);
  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const [visRef, isVisible] = useIsVisible(0.1);
  const animated = isVisible || REDUCED_MOTION;

  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (zoomRef.current) {
      zoomRef.current.translateExtent([
        [0, 0],
        [svgW, H]
      ]);
    }
  }, [H, svgW]);

  useEffect(() => {
    Promise.all([loadFile('assets/data/world_countries.json').then(r => r?.json()), loadFile('assets/data/world_borders.json').then(r => r?.json())]).then(([topo, borders]) => {
      if (topo && borders) {
        // The UNCTAD border TopoJSON encodes coordinates ~11.314° west of their true
        // WGS84 positions. Correct the transform once at load time so features decode
        // to the correct longitudes and align with the country polygons.
        if (borders.transform) borders.transform.translate[0] += 11.314;
        setGeoData({ topo, borders });
      }
    });

    loadFile('assets/data/cdde_dependence_map.csv')
      .then(r => r?.text())
      .then(text => {
        if (text) {
          const data = CSVtoJSON(text);
          const byIso3 = {};
          for (const row of data) {
            if (!row.iso3) continue;
            byIso3[row.iso3] = {
              ...row,
              export_dependence: row.export_dependence ? +row.export_dependence : null,
              agri_pct: row.agri_pct ? +row.agri_pct : null,
              energy_pct: row.energy_pct ? +row.energy_pct : null,
              mining_pct: row.mining_pct ? +row.mining_pct : null
            };
          }
          setMapData(byIso3);
        }
      });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom()
      .scaleExtent([1, 3])
      .translateExtent([
        [0, 0],
        [svgW, H]
      ])
      .filter(e => e.type !== 'wheel') // wheel disabled; touch pinch still works
      .on('zoom', e => {
        const { x, y, k } = e.transform;
        setZt({ x, y, k });
      });
    svg.call(zoom);
    zoomRef.current = zoom;
    return () => {
      svg.on('.zoom', null);
    };
  }, [H, svgW]);

  const ZOOM_STEP = Math.sqrt(3); // two presses → full 3× range

  function zoomIn() {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, ZOOM_STEP);
  }

  function zoomOut() {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1 / ZOOM_STEP);
  }

  const computed = useMemo(() => {
    if (!geoData) return null;
    const { topo, borders } = geoData;

    // rotate([-11.314, 0]) shifts the antimeridian to ~191°E, keeping Russia whole,
    // and pairs with the translate[0] += 11.314 correction applied to the border TopoJSON.
    const projection = d3.geoNaturalEarth1().rotate([-11.314, 0]).fitSize([svgW, H], { type: 'Sphere' });
    const pathGen = d3.geoPath(projection);
    const allFeats = topojson.feature(topo, topo.objects.BNDA).features;

    const countryPaths = allFeats
      .filter(f => f.properties?.stscod !== 0)
      .map(f => {
        const d = pathGen(f);
        return d ? { id: f.id, d } : null;
      })
      .filter(Boolean);

    // Use pre-classified border objects from the verified UNCTAD TopoJSON
    const borderPath = key => {
      const obj = borders.objects[key];
      if (!obj) return null;
      const fc = topojson.feature(borders, obj);
      return fc.features.length ? pathGen(fc) : null;
    };
    const solidBorderPath = borderPath('plain-borders');
    const dashedBorderPath = borderPath('dashed-borders');
    const dottedBorderPath = borderPath('dotted-borders');
    const dashDotBorderPath = borderPath('dash-dotted-borders');

    const islandDots = SMALL_ISLAND_DOTS.map(s => {
      const xy = projection([s.lon, s.lat]);
      return xy ? { ...s, x: xy[0], y: xy[1] } : null;
    }).filter(Boolean);

    return { countryPaths, solidBorderPath, dashedBorderPath, dottedBorderPath, dashDotBorderPath, islandDots };
  }, [geoData, H, svgW]);

  const smallIslandSet = useMemo(() => new Set(SMALL_ISLAND_DOTS.map(s => s.iso3)), []);

  // Single reveal state: false = hidden (opacity 0, washed-out), true = visible
  const [revealed, setRevealed] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!animated || !computed || !mapData || revealed) return;
    if (REDUCED_MOTION) {
      setRevealed(true);
      return;
    }
    let cancelled = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!cancelled) setRevealed(true);
      })
    );
    return () => {
      cancelled = true;
    };
  }, [animated, computed, mapData, revealed]);

  function handleViewChange(newView) {
    if (newView === view || REDUCED_MOTION) {
      setView(newView);
      return;
    }
    setSwitching(true);
    setTimeout(() => {
      setView(newView);
      requestAnimationFrame(() => requestAnimationFrame(() => setSwitching(false)));
    }, 80);
  }

  function getFill(iso3) {
    const lookup = CHINA_DELEGATE.has(iso3) ? 'CHN' : iso3;
    const row = mapData?.[lookup];
    if (!row) return NO_DATA_FILL;
    return view === 'export' ? getExpColor(row.export_dependence) : getGroupColor(row.dominant_group);
  }

  function handleCountryClick(iso3) {
    if (!mapData) return;
    const lookup = CHINA_DELEGATE.has(iso3) ? 'CHN' : iso3;
    const row = mapData[lookup];
    if (row) {
      setSelectedCountry(row);
      setPanelCollapsed(false);
    }
  }

  const mapCountryList = useMemo(
    () =>
      mapData
        ? Object.values(mapData)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [mapData]
  );

  function closePanel() {
    setSelectedCountry(null);
  }

  function handleSvgHover(e) {
    const iso3 = e.target.dataset.iso;
    if (!iso3 || !mapAreaRef.current) {
      setHoverTooltip(null);
      return;
    }
    const lookup = CHINA_DELEGATE.has(iso3) ? 'CHN' : iso3;
    if (!mapData?.[lookup]) {
      setHoverTooltip(null);
      return;
    }
    const r = mapAreaRef.current.getBoundingClientRect();
    setHoverTooltip({ iso3, lookup, left: e.clientX - r.left, top: e.clientY - r.top });
  }

  function handleSvgLeave() {
    setHoverTooltip(null);
  }

  return (
    <section className="cmap_section width_wide cdde_reveal" ref={visRef}>
      <div className="cmap_inner">
        <ChartHeader title={title} subtitle={subtitle} large />

        {insight && <p className="cdde_insight">{insight}</p>}

        <div className="cmap_controls">
          <div className="cmap_search">
            <CountrySearch
              countries={mapCountryList}
              value={selectedCountry?.iso3 ?? null}
              onChange={iso3 => {
                const r = iso3 ? mapData?.[iso3] : null;
                setSelectedCountry(r);
                if (r) setPanelCollapsed(false);
              }}
              placeholder="Search country…"
            />
          </div>

          <div className="cmap_toggle">
            <button type="button" className={`cmap_toggle_btn${view === 'export' ? ' active' : ''}`} onClick={() => handleViewChange('export')}>
              Export dependence
            </button>
            <button type="button" className={`cmap_toggle_btn${view === 'group' ? ' active' : ''}`} onClick={() => handleViewChange('group')}>
              Dominant product group
            </button>
          </div>
        </div>

        <div className="cmap_groups_top">
          {view === 'export' ? (
            <>
              {EXP_LEGEND_ITEMS.map(item => (
                <div className="cmap_gt_item" key={item.label}>
                  <span className="cmap_gt_dot" style={{ background: item.color }} />
                  <span className="cmap_gt_text">
                    <span className="cmap_gt_label">{item.label}</span>
                    {item.note && <span className="cmap_gt_note">{item.note}</span>}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              {Object.entries(GROUP_LABELS).map(([key, label]) => (
                <div className="cmap_gt_item" key={key}>
                  <span className="cmap_gt_dot" style={{ background: GROUP_COLORS[key] }} />
                  <span className="cmap_gt_text">
                    <span className="cmap_gt_label">{label}</span>
                    <span className="cmap_gt_note">{GROUP_NOTES[key]}</span>
                  </span>
                </div>
              ))}
            </>
          )}
          <div className="cmap_gt_item cmap_gt_item--nodata">
            <span className="cmap_gt_dot" style={{ background: NO_DATA_FILL }} />
            <span className="cmap_gt_text">
              <span className="cmap_gt_label">No data</span>
            </span>
          </div>
        </div>

        <div className="cmap_map_area" ref={mapAreaRef}>
          <svg ref={svgRef} viewBox={`0 0 ${svgW} ${H}`} className="cmap_svg" aria-label="World choropleth map of commodity dependence" onMouseMove={handleSvgHover} onMouseLeave={handleSvgLeave}>
            {/* Aksai Chin stripe pattern — alternates India and China fill colors, updates with view */}
            <defs>
              <pattern id="cmap_aksai_stripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <rect width="4" height="8" fill={getFill('IND')} />
                <rect x="4" width="4" height="8" fill={getFill('CHN')} />
              </pattern>
            </defs>

            {/* Ocean — fixed, always fills SVG */}
            <rect x={0} y={0} width={svgW} height={H} className="cmap_ocean" />

            {/* Zoomable content */}
            <g transform={`translate(${zt.x},${zt.y}) scale(${zt.k})`}>
              {/* Country fills */}
              <g className={`cmap_countries${switching ? ' cmap_countries--switching' : ''}`} style={{ opacity: revealed ? (switching ? 0.85 : 1) : 0, transition: REDUCED_MOTION ? 'none' : switching ? 'opacity 0.2s ease' : 'opacity 0.7s ease' }}>
                {computed?.countryPaths?.map(({ id, d }) => {
                  if (smallIslandSet.has(id)) return null;
                  if (id === 'xac') {
                    // Aksai Chin — disputed between India and China; show as diagonal stripes
                    return mapData ? <path key="xac" d={d} fill="url(#cmap_aksai_stripe)" style={{ pointerEvents: 'none' }} /> : null;
                  }
                  const inActiveGroup = hoverTooltip?.iso3 && CHINA_GROUP.has(hoverTooltip.iso3) && CHINA_GROUP.has(id);
                  return <path key={`${id}_${d}`} d={d} className={`cmap_country${inActiveGroup ? ' cmap_country--active' : ''}`} style={{ fill: getFill(id) }} onClick={() => handleCountryClick(id)} data-iso={id} />;
                })}
              </g>

              {/* Solid borders — recognized/defined international boundaries */}
              {computed?.solidBorderPath && <path d={computed.solidBorderPath} className="cmap_border_solid" />}

              {/* Dashed borders — indefinite/unsurveyed boundaries */}
              {computed?.dashedBorderPath && <path d={computed.dashedBorderPath} className="cmap_border_dashed" />}

              {/* Dotted borders — lines of control / armistice lines (e.g. Jammu-Kashmir) */}
              {computed?.dottedBorderPath && <path d={computed.dottedBorderPath} className="cmap_border_dotted" />}

              {/* Dash-dotted borders — ceasefire lines */}
              {computed?.dashDotBorderPath && <path d={computed.dashDotBorderPath} className="cmap_border_dashdot" />}

              {/* Small island dots */}
              <g className="cmap_islands" style={{ opacity: revealed ? (switching ? 0.85 : 1) : 0, transition: REDUCED_MOTION ? 'none' : switching ? 'opacity 0.2s ease' : 'opacity 0.7s ease' }}>
                {computed?.islandDots?.map(s => (
                  <circle key={s.iso3} cx={s.x} cy={s.y} r={4 / zt.k} style={{ fill: getFill(s.iso3) }} stroke="#fff" strokeWidth={0.8 / zt.k} className="cmap_island_dot" data-iso={s.iso3} onClick={() => handleCountryClick(s.iso3)} />
                ))}
              </g>
            </g>
          </svg>


          {/* Country info panel — overlaid on right side of map */}
          {selectedCountry && (
            <div className={`cmap_panel${panelCollapsed ? ' cmap_panel--collapsed' : ''}`} ref={panelRef}>
              <div className="cmap_panel_header">
                <CircleFlag countryCode={selectedCountry.iso2} height={32} />
                <div className="cmap_panel_header_text">
                  <div className="cmap_panel_name">{selectedCountry.name}</div>
                  <div className="cmap_panel_region">{selectedCountry.region}</div>
                </div>
                <button type="button" className="cmap_panel_toggle" onClick={() => setPanelCollapsed(c => !c)} aria-label={panelCollapsed ? 'Expand panel' : 'Collapse panel'}>
                  {panelCollapsed ? '▼' : '▲'}
                </button>
                <button type="button" className="cmap_panel_close" onClick={closePanel} aria-label="Close panel">
                  ×
                </button>
              </div>
              {!panelCollapsed && (
                <>
                  {/* Hero — export share + dominant group combined */}
                  <div className="cmap_panel_hero">
                    <span className="cmap_panel_hero_label">Commodity dependence share</span>
                    <span className="cmap_panel_hero_value">{selectedCountry.export_dependence != null ? `${selectedCountry.export_dependence}%` : 'Data not available'}</span>
                    {selectedCountry.dominant_group && selectedCountry.dominant_group !== 'non-dependent' && (
                      <span className="cmap_panel_stat_group" style={{ background: GROUP_COLORS[selectedCountry.dominant_group] }}>
                        {GROUP_LABELS[selectedCountry.dominant_group] || selectedCountry.dominant_group}
                      </span>
                    )}
                    {selectedCountry.export_dependence != null && (
                      <div className="cmap_tt_categories">
                        {[
                          { key: 'agri', label: 'Agriculture', val: selectedCountry.agri_pct },
                          { key: 'energy', label: 'Energy', val: selectedCountry.energy_pct },
                          { key: 'mining', label: 'Mining', val: selectedCountry.mining_pct }
                        ].map(cat => (
                          <div key={cat.key} className={`cmap_tt_cat_row${selectedCountry.dominant_group === cat.key ? ' cmap_tt_cat_row--dominant' : ''}`}>
                            <span className="cmap_tt_group_dot" style={{ background: GROUP_COLORS[cat.key] }} />
                            <span className="cmap_tt_label">{cat.label}</span>
                            <span className="cmap_tt_val">{cat.val != null ? cat.val : 0}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <a className="cmap_panel_profile_link" href={`./compare.html?country=${selectedCountry.iso3}`}>
                    Open full country profile →
                  </a>
                </>
              )}
            </div>
          )}

          {/* Zoom controls */}
          <div className="cmap_zoom_btns">
            <button type="button" className="cmap_zoom_btn" onClick={zoomIn} disabled={zt.k >= 2.99} aria-label="Zoom in">
              +
            </button>
            <button type="button" className="cmap_zoom_btn" onClick={zoomOut} disabled={zt.k <= 1.01} aria-label="Zoom out">
              −
            </button>
          </div>

          {/* Hover tooltip */}
          {hoverTooltip &&
            mapData?.[hoverTooltip.lookup] &&
            (() => {
              const row = mapData[hoverTooltip.lookup];
              const flip = mapAreaRef.current ? hoverTooltip.left > mapAreaRef.current.clientWidth * 0.6 : false;
              return (
                <ChartTooltip left={hoverTooltip.left} top={hoverTooltip.top} flip={flip}>
                  <div className="cmap_tt_name">{row.name}</div>
                  {row.export_dependence != null && (
                    <div className="cmap_tt_row">
                      <span className="cmap_tt_label">Export dependence</span>
                      <span className="cmap_tt_val">{row.export_dependence}%</span>
                    </div>
                  )}
                  {row.export_dependence != null && (
                    <div className="cmap_tt_categories">
                      {[
                        { key: 'agri', label: 'Agriculture', val: row.agri_pct },
                        { key: 'energy', label: 'Energy', val: row.energy_pct },
                        { key: 'mining', label: 'Mining', val: row.mining_pct }
                      ].map(cat => (
                        <div key={cat.key} className={`cmap_tt_cat_row${row.dominant_group === cat.key ? ' cmap_tt_cat_row--dominant' : ''}`}>
                          <span className="cmap_tt_group_dot" style={{ background: GROUP_COLORS[cat.key] }} />
                          <span className="cmap_tt_label">{cat.label}</span>
                          <span className="cmap_tt_val">{cat.val != null ? cat.val : 0}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ChartTooltip>
              );
            })()}
        </div>

        <div className="cmap_footer">
          <ChartMeta source={source} note={note} sourceKey="Commodity Dependence, 2022–2024" />
        </div>
      </div>
    </section>
  );
}
