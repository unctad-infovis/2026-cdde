import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import ChartTooltip from '../shared/ChartTooltip';

import './ExportsByRegion.css';

const COLOR_MAP = {
  blue: 'var(--un-color-blue)',
  yellow: 'var(--un-color-yellow)',
  green: 'var(--un-color-green)',
  red: 'var(--un-color-red)',
  purple: 'var(--un-color-purple)'
};

const COLOR_DARK = {
  blue: '#007ab0',
  yellow: '#c98d00',
  green: '#5a9c33',
  red: '#bb0e35',
  purple: '#7d4a8d'
};

const REGION_COLOR = {
  Europe: 'blue',
  Asia: 'yellow',
  Americas: 'green',
  Africa: 'purple',
  Oceania: 'red'
};

const MIN_SHARE = 0.013;
const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function csvToHierarchy(rows) {
  const regionMap = new Map();
  const subregionTotals = new Map();
  for (const row of rows) {
    if (!row.region || !row.subregion) continue;
    if (!row.country) {
      // Subregion total row (empty country = marker written by conversion script)
      subregionTotals.set(`${row.region}|${row.subregion}`, +row.value);
      continue;
    }
    if (!regionMap.has(row.region)) {
      regionMap.set(row.region, { name: row.region, color_key: REGION_COLOR[row.region] || 'blue', subregions: new Map() });
    }
    const subs = regionMap.get(row.region).subregions;
    if (!subs.has(row.subregion)) subs.set(row.subregion, { name: row.subregion, countries: [] });
    subs.get(row.subregion).countries.push({ name: row.country, value: +row.value || 0 });
  }
  return [...regionMap.values()].map(r => ({
    name: r.name,
    color_key: r.color_key,
    children: [...r.subregions.values()].map(s => ({
      name: s.name,
      value: s.countries.reduce((sum, c) => sum + c.value, 0),
      displayValue: subregionTotals.get(`${r.name}|${s.name}`) ?? null,
      countries: s.countries
    }))
  }));
}

const W = 960;
const H = 500;

function fmt(v) {
  return `${d3.format(',.0f')(Math.round(v)).replace(/,/g, ' ')}`;
}

export default function ExportsByRegion() {
  const [regions, setRegions] = useState(null);
  const [drill, setDrill] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const wrapRef = useRef(null);
  const [visRef, isVisible] = useIsVisible(0.15);
  const animated = isVisible || REDUCED_MOTION;

  useEffect(() => {
    loadFile('assets/data/cdde_exports_by_region.csv')
      .then(r => r?.text())
      .then(text => {
        if (text) setRegions(csvToHierarchy(CSVtoJSON(text).filter(r => r.region)));
      });
  }, []);

  // Overview treemap — subregions as leaves
  const overview = useMemo(() => {
    if (!regions) return { leaves: [], regionNodes: [] };
    const root = d3
      .hierarchy({ name: 'World', children: regions })
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);
    d3.treemap().size([W, H]).paddingInner(2).paddingOuter(2).round(true)(root);
    return { leaves: root.leaves(), regionNodes: root.children || [] };
  }, [regions]);

  // Drilldown treemap — countries as leaves, with minimum floor
  const drillView = useMemo(() => {
    if (!drill || !regions) return null;
    const region = regions.find(r => r.name === drill.regionName);
    if (!region) return null;
    const sub = region.children.find(s => s.name === drill.subregionName);
    if (!sub) return null;

    const total = sub.value;
    const minVal = total * MIN_SHARE;
    const drillData = {
      name: sub.name,
      children: sub.countries.map(c => ({ ...c, displayValue: Math.max(c.value, minVal) }))
    };
    const root = d3
      .hierarchy(drillData)
      .sum(d => d.displayValue || 0)
      .sort((a, b) => b.data.value - a.data.value);
    d3.treemap().size([W, H]).paddingInner(2).paddingOuter(0).round(true)(root);

    return {
      nodes: root.leaves(),
      subName: sub.name,
      regionName: drill.regionName,
      countryCount: sub.countries.length,
      colorKey: region.color_key,
      total
    };
  }, [drill, regions]);

  function handleCellClick(node) {
    setDrill({ regionName: node.parent?.data?.name, subregionName: node.data.name });
    setTooltip(null);
  }

  function handleMouseMove(e, data) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTooltip({ left: e.clientX - r.left, top: e.clientY - r.top, data });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  const title = drill ? `${drill.subregionName} – Member States` : 'Where commodity exports concentrate';
  const subtitle = drill ? `${drill.regionName} › ${drill.subregionName} (${drillView?.countryCount ?? '–'} countries)` : 'Commodity exports by sub-region, 2022–2024 average, millions of dollars';

  return (
    <div className="exc_container cdde_reveal" ref={visRef}>
      <ChartHeader title={title} subtitle={subtitle} large />

      {!drill && (
        <p className="cdde_insight">
          Global commodity exports are heavily concentrated in a few regions, with <strong className="cdde_insight_bold">Asia and Europe dominating the landscape</strong>.
        </p>
      )}

      <div className="exc_chart_wrap" ref={wrapRef}>
        {drill && (
          <button type="button" className="exc_back_btn" onClick={() => setDrill(null)}>
            ◄ Back to overview
          </button>
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className="exc_svg" aria-label={drill ? `Treemap of ${drill.subregionName} countries` : 'Treemap of commodity exports by sub-region'} onMouseLeave={handleMouseLeave}>
          {drill && drillView && (
            <defs>
              {drillView.nodes.map((node, i) => (
                <clipPath key={i} id={`exc_cp_${i}`}>
                  <rect x={node.x0 + 2} y={node.y0 + 2} width={node.x1 - node.x0 - 4} height={node.y1 - node.y0 - 4} />
                </clipPath>
              ))}
            </defs>
          )}
          {!drill && (
            <>
              {overview.leaves.map((node, i) => {
                const colorKey = node.parent?.data?.color_key;
                const fill = COLOR_MAP[colorKey] || '#ccc';
                const w = node.x1 - node.x0;
                const h = node.y1 - node.y0;
                const textStyle = { opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: `${500 + Math.min(i * 20, 300)}ms` };
                return (
                  <g key={node.data.name} onClick={() => handleCellClick(node)} onMouseMove={e => handleMouseMove(e, { name: node.data.name, value: node.data.value, region: node.parent?.data?.name })} className="exc_cell">
                    <rect x={node.x0} y={node.y0} width={w} height={h} fill={fill} />
                    {w > 90 && h > 46 && (
                      <text x={node.x0 + w / 2} y={node.y0 + h / 2 - (w > 60 && h > 26 ? 9 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_name" style={textStyle}>
                        {node.data.name}
                      </text>
                    )}
                    {w > 60 && h > 26 && (
                      <text x={node.x0 + w / 2} y={node.y0 + h / 2 + (w > 90 && h > 46 ? 11 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_value" style={textStyle}>
                        {fmt(node.data.displayValue ?? node.data.value)}
                      </text>
                    )}
                  </g>
                );
              })}
              {overview.regionNodes.map((rNode, j) => (
                <text key={rNode.data.name} x={rNode.x0 + 10} y={rNode.y0 + 22} className="exc_region_label" style={{ pointerEvents: 'none', opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: `${500 + j * 60}ms` }}>
                  {rNode.data.name}
                </text>
              ))}
            </>
          )}

          {drill &&
            drillView?.nodes.map((node, i) => {
              const w = node.x1 - node.x0;
              const h = node.y1 - node.y0;
              const hasValue = node.data.value > 0;
              const fill = hasValue ? COLOR_MAP[drillView.colorKey] : COLOR_DARK[drillView.colorKey];
              const showName = w > 48 && h > 22;
              const showValue = w > 52 && h > 38;
              const clip = `url(#exc_cp_${i})`;
              return (
                <g key={node.data.name} className="exc_cell exc_cell--country" onMouseMove={e => handleMouseMove(e, { name: node.data.name, value: hasValue ? node.data.value : null, region: drill.subregionName })}>
                  <rect x={node.x0} y={node.y0} width={w} height={h} fill={fill} />
                  {showName && (
                    <text x={node.x0 + w / 2} y={node.y0 + h / 2 - (showValue ? 9 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_name" clipPath={clip}>
                      {node.data.name}
                      {!hasValue ? '*' : ''}
                    </text>
                  )}
                  {showValue && (
                    <text x={node.x0 + w / 2} y={node.y0 + h / 2 + (showName ? 11 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_value" clipPath={clip}>
                      {fmt(node.data.value)}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {tooltip && (
          <ChartTooltip left={tooltip.left} top={tooltip.top} flip={!!(wrapRef.current && tooltip.left > wrapRef.current.clientWidth * 0.6)}>
            <div className="exc_tt_name">{tooltip.data.name}</div>
            <div className="exc_tt_region">{tooltip.data.region}</div>
            <div className="exc_tt_val">{tooltip.data.value != null ? fmt(tooltip.data.value) : 'No data'}</div>
          </ChartTooltip>
        )}
      </div>

      {drill && <p className="exc_drill_note">Tile size uses a minimum share of the sub-region total so every member economy is visible; dollar amounts are actual commodity exports (2022–2024 average $M). * indicates no reported value in the source data for this period.</p>}

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). Values in current millions of dollars, 2022–2024 average.</ChartSource>
    </div>
  );
}
