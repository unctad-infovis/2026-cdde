import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ChartTooltip from '../shared/ChartTooltip';

import './CommodityPrices.css';

const ANNOTATIONS = [
  { date: '2008-09', label: 'Global financial crisis' },
  { date: '2014-07', label: 'Oil price collapse' },
  { date: '2020-03', label: 'COVID-19 pandemic' },
  { date: '2022-02', label: "Russia's full-scale invasion in Ukraine" },
  { date: '2026-02', label: '2026 Iran war' }
];

const POST_CORRECTION_START = '2022-06';

const SERIES = [
  { key: 'total', label: 'Total Index', color: '#4f4740' },
  { key: 'energy', label: 'Energy', color: '#009edb' },
  { key: 'agri', label: 'Agricultural', color: '#72bf44' },
  { key: 'mining', label: 'Mining', color: '#fbaf17' },
  { key: 'precious', label: 'Precious metals', color: '#a05fb4' }
];

const H = 396;
const M = { top: 30, right: 20, bottom: 52, left: 50 };
const CHART_H = H - M.top - M.bottom;

const parseDate = d3.timeParse('%Y-%m');
const formatYear = d3.timeFormat('%Y');
const fmtMonth = d3.timeFormat('%b %Y');

const C_ANNO = '#b06e2a';
const bisect = d3.bisector(d => d.date).left;

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function CommodityPrices({ insight, note, source, subtitle, title }) {
  const [rawData, setRawData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [tooltip, setTooltip] = useState(null);
  const [svgW, setSvgW] = useState(960);
  const [hasAnimated, setHasAnimated] = useState(REDUCED_MOTION);

  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [visRef, isVisible] = useIsVisible(0.15);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    loadFile('assets/data/cdde_commodity_prices.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setRawData(d.map(row => ({ ...row, date: parseDate(row.date) })));
      });
  }, []);

  // After all lines finish drawing, remove staggered delays so filter changes are instant
  useEffect(() => {
    if (!isVisible || hasAnimated) return;
    const t = setTimeout(() => setHasAnimated(true), 3200);
    return () => clearTimeout(t);
  }, [isVisible, hasAnimated]);

  const CHART_W = svgW - M.left - M.right;

  const chart = useMemo(() => {
    if (!rawData?.length) return null;

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(rawData, d => d.date))
      .range([0, CHART_W]);

    const yScale = d3.scaleLinear().domain([0, 420]).range([CHART_H, 0]);

    const lineFn = key =>
      d3
        .line()
        .x(d => xScale(d.date))
        .y(d => yScale(d[key]))
        .defined(d => d[key] != null)
        .curve(d3.curveMonotoneX)(rawData);

    const xTicks = xScale.ticks(d3.timeYear.every(5));
    const yTicks = [0, 100, 200, 300, 400];

    const annoPositions = ANNOTATIONS.map((a, i) => ({
      ...a,
      num: i + 1,
      x: xScale(parseDate(a.date))
    }));

    const correctionX = xScale(parseDate(POST_CORRECTION_START));

    return {
      paths: Object.fromEntries(SERIES.map(s => [s.key, lineFn(s.key)])),
      xScale,
      yScale,
      xTicks,
      yTicks,
      annoPositions,
      correctionX
    };
  }, [CHART_W, rawData]);

  function lineOpacity(label) {
    if (activeFilter === 'All') return 1;
    return activeFilter === label ? 1 : 0.08;
  }

  function toggleFilter(label) {
    setActiveFilter(prev => (prev === label ? 'All' : label));
  }

  // ── Tooltip handlers ──────────────────────────────────────────
  function handleMouseMove(e) {
    if (!chart || !rawData || !svgRef.current || !wrapRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();

    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * svgW - M.left;
    if (svgX < 0 || svgX > CHART_W) {
      setTooltip(null);
      return;
    }

    const date = chart.xScale.invert(svgX);
    let idx = bisect(rawData, date);
    idx = Math.min(Math.max(idx, 0), rawData.length - 1);
    if (idx > 0 && date - rawData[idx - 1].date < rawData[idx].date - date) idx--;

    setTooltip({
      type: 'cross',
      svgX,
      left: e.clientX - wrapRect.left,
      top: e.clientY - wrapRect.top,
      d: rawData[idx]
    });
  }

  function handleMouseLeave() {
    setTooltip(t => (t?.type === 'anno' ? t : null));
  }

  function handleAnnoEnter(e, a) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTooltip({ type: 'anno', label: a.label, left: e.clientX - r.left, top: e.clientY - r.top });
  }

  function handleAnnoLeave() {
    setTooltip(t => (t?.type === 'anno' ? null : t));
  }

  const flipTT = tooltip && wrapRef.current ? tooltip.left > wrapRef.current.clientWidth * 0.6 : false;

  const animated = isVisible || REDUCED_MOTION;
  const hasFilter = activeFilter !== 'All';

  return (
    <div className="cprices_container cdde_reveal" ref={visRef}>
      <ChartHeader title={title} subtitle={subtitle} large />

      {insight && <p className="cdde_insight cprices_insight">{insight}</p>}

      {/* ── Interactive legend – clicking a series filters to it; clicking again clears ── */}
      <div className="cdde_legend_row">
        {SERIES.map(s => {
          const isActive = activeFilter === s.label;
          return (
            <button key={s.key} type="button" className={`cdde_legend_item cprices_legend_btn${isActive ? ' cprices_legend_btn--active' : ''}${hasFilter && !isActive ? ' cprices_legend_btn--faded' : ''}`} onClick={() => toggleFilter(s.label)}>
              <span className="cdde_legend_line" style={{ background: s.color }} />
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="cprices_anno_key">
        {ANNOTATIONS.map((a, i) => (
          <span key={a.label} className="cprices_anno_key_item">
            <span className="cprices_anno_key_num">{i + 1}</span>
            {a.label}
          </span>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="cprices_chart_wrap" ref={wrapRef}>
        {!chart ? (
          <div className="cprices_loading" />
        ) : (
          <>
            <svg ref={svgRef} viewBox={`0 0 ${svgW} ${H}`} className={`cprices_svg${animated ? ' cprices_svg--animated' : ''}`} aria-label="Line chart of commodity price indices 1995–2026" onMouseLeave={handleMouseLeave}>
              <g transform={`translate(${M.left},${M.top})`}>
                {/* Post-2022 shaded band */}
                <rect x={chart.correctionX} y={0} width={CHART_W - chart.correctionX} height={CHART_H} className="cprices_correction_band" />

                {/* Y grid */}
                {chart.yTicks.map(v => (
                  <g key={v} transform={`translate(0,${chart.yScale(v)})`}>
                    <line x1={0} x2={CHART_W} className="cprices_grid_h" />
                    <text x={-8} y={4} textAnchor="end" className="cprices_y_label">
                      {v}
                    </text>
                  </g>
                ))}

                {/* Annotation dashed lines */}
                {chart.annoPositions.map(a => (
                  <line key={a.num} x1={a.x} y1={0} x2={a.x} y2={CHART_H} className="cprices_anno_line" />
                ))}

                {/* Series paths — transitionDelay removed after first draw so filter changes are instant */}
                {SERIES.map((s, i) => (
                  <path
                    key={s.key}
                    d={chart.paths[s.key]}
                    pathLength="1"
                    fill="none"
                    stroke={s.color}
                    strokeWidth={activeFilter === 'All' ? 3 : activeFilter === s.label ? 4 : 3}
                    opacity={lineOpacity(s.label)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="cprices_line"
                    style={{ pointerEvents: 'none', transitionDelay: hasAnimated ? '0ms' : `${500 + i * 80}ms` }}
                  />
                ))}

                {/* Transparent overlay — captures mouse for crosshair */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG chart interaction overlay */}
                <rect x={0} y={0} width={CHART_W} height={CHART_H} fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={handleMouseMove} />

                {/* Annotation circles — rendered after overlay so they capture mouse */}
                {chart.annoPositions.map(a => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: SVG annotation hover target
                  <g key={a.num} transform={`translate(${a.x}, 0)`} style={{ cursor: 'help' }} onMouseEnter={e => handleAnnoEnter(e, a)} onMouseLeave={handleAnnoLeave}>
                    <circle cx={0} cy={-4} r={12} fill="transparent" />
                    <circle cx={0} cy={-4} r={10} fill="#fff" stroke={C_ANNO} strokeWidth={1.5} />
                    <text x={0} y={-3} textAnchor="middle" dominantBaseline="central" className="cprices_anno_num">
                      {a.num}
                    </text>
                  </g>
                ))}

                {/* Crosshair line */}
                {tooltip?.type === 'cross' && <line x1={tooltip.svgX} y1={0} x2={tooltip.svgX} y2={CHART_H} stroke="#bbb" strokeWidth={1} strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />}

                {/* Crosshair dots */}
                {tooltip?.type === 'cross' &&
                  SERIES.map(s => {
                    if (tooltip.d[s.key] == null) return null;
                    if (activeFilter !== 'All' && activeFilter !== s.label) return null;
                    return <circle key={s.key} cx={tooltip.svgX} cy={chart.yScale(tooltip.d[s.key])} r={4} fill={s.color} stroke="#fff" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />;
                  })}

                {/* X axis */}
                <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="cprices_axis_line" />
                {chart.xTicks.map(t => (
                  <g key={t} transform={`translate(${chart.xScale(t)},${CHART_H})`}>
                    <line y2={5} className="cprices_tick" />
                    <text y={18} textAnchor="middle" className="cprices_x_label">
                      {formatYear(t)}
                    </text>
                  </g>
                ))}

                {/* Post-2022 label */}
                <text x={chart.correctionX + (CHART_W - chart.correctionX) / 2} y={CHART_H + 38} textAnchor="middle" className="cprices_correction_label">
                  post-2022 correction
                </text>
              </g>
            </svg>

            {/* HTML tooltip */}
            {tooltip && (
              <ChartTooltip left={tooltip.left} top={tooltip.top} flip={flipTT}>
                {tooltip.type === 'cross' && (
                  <>
                    <div className="cprices_tt_date">{fmtMonth(tooltip.d.date)}</div>
                    {SERIES.map(
                      s =>
                        tooltip.d[s.key] != null && (
                          <div key={s.key} className="cprices_tt_row">
                            <span className="cprices_tt_dot" style={{ background: s.color }} />
                            <span className="cprices_tt_label">{s.label}</span>
                            <span className="cprices_tt_val">{tooltip.d[s.key].toFixed(1)}</span>
                          </div>
                        )
                    )}
                  </>
                )}
                {tooltip.type === 'anno' && <div className="cprices_tt_anno">{tooltip.label}</div>}
              </ChartTooltip>
            )}
          </>
        )}
      </div>

      <ChartMeta source={source} note={note} sourceKey="Commodity Price Indices" />
    </div>
  );
}
