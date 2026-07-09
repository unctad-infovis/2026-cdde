import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
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
  { key: 'precious', label: 'Precious metals', color: '#9b59b6' }
];

const FILTERS = ['All', ...SERIES.map(s => s.label)];

const W = 960;
const H = 396; // extra height for bottom label
const M = { top: 30, right: 20, bottom: 52, left: 50 };
const CHART_W = W - M.left - M.right;
const CHART_H = H - M.top - M.bottom; // 314 — same chart area as before

const parseDate = d3.timeParse('%Y-%m');
const formatYear = d3.timeFormat('%Y');
const fmtMonth = d3.timeFormat('%b %Y');

const C_ANNO = '#b06e2a';
const bisect = d3.bisector(d => d.date).left;

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function CommodityPrices() {
  const [rawData, setRawData] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [tooltip, setTooltip] = useState(null);

  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [visRef, isVisible] = useIsVisible(0.15);

  useEffect(() => {
    loadFile('assets/data/cdde_commodity_prices.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setRawData(d.map(row => ({ ...row, date: parseDate(row.date) })));
      });
  }, []);

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
  }, [rawData]);

  function lineOpacity(label) {
    if (activeFilter === 'All') return 1;
    return activeFilter === label ? 1 : 0.08;
  }

  // ── Tooltip handlers ──────────────────────────────────────────
  function handleMouseMove(e) {
    if (!chart || !rawData || !svgRef.current || !wrapRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();

    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * W - M.left;
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

  // Flip tooltip to left when near right edge
  const flipTT = tooltip && wrapRef.current ? tooltip.left > wrapRef.current.clientWidth * 0.6 : false;

  const animated = isVisible || REDUCED_MOTION;

  return (
    <div className="pic_container cdde_reveal" ref={visRef}>
      <div className="pic_header_row">
        <ChartHeader title="Commodity Price Indices · 1995 to 2026" subtitle="Monthly, nominal dollars, 2010 = 100" large />
        <div className="pic_filters">
          {FILTERS.map(f => (
            <button type="button" key={f} className={`pic_filter_btn${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="cdde_insight pic_insight">
        Commodity prices have remained <strong className="cdde_insight_bold">highly volatile</strong> in recent years – the post-2022 correction followed one of the sharpest surges in decades, a reminder of how quickly external shocks can reshape commodity export dependence.
      </p>

      {/* ── Legend — now above the chart ── */}
      <div className="pic_legend">
        {SERIES.map(s => (
          <span key={s.key} className="pic_legend_item">
            <span className="pic_legend_line" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="pic_chart_wrap" ref={wrapRef}>
        {!chart ? (
          <div className="pic_loading" />
        ) : (
          <>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={`pic_svg${animated ? ' pic_svg--animated' : ''}`} aria-label="Line chart of commodity price indices 1995–2026" onMouseLeave={handleMouseLeave}>
              <g transform={`translate(${M.left},${M.top})`}>
                {/* Post-2022 shaded band */}
                <rect x={chart.correctionX} y={0} width={CHART_W - chart.correctionX} height={CHART_H} className="pic_correction_band" />

                {/* Y grid */}
                {chart.yTicks.map(v => (
                  <g key={v} transform={`translate(0,${chart.yScale(v)})`}>
                    <line x1={0} x2={CHART_W} className="pic_grid_h" />
                    <text x={-8} y={4} textAnchor="end" className="pic_y_label">
                      {v}
                    </text>
                  </g>
                ))}

                {/* Annotation dashed lines */}
                {chart.annoPositions.map(a => (
                  <line key={a.num} x1={a.x} y1={0} x2={a.x} y2={CHART_H} className="pic_anno_line" />
                ))}

                {/* Series paths — pointer-events:none so overlay captures */}
                {SERIES.map((s, i) => (
                  <path key={s.key} d={chart.paths[s.key]} pathLength="1" fill="none" stroke={s.color} strokeWidth={activeFilter === 'All' ? 1.8 : activeFilter === s.label ? 2.2 : 1.8} opacity={lineOpacity(s.label)} strokeLinecap="round" strokeLinejoin="round" className="pic_line" style={{ pointerEvents: 'none', transitionDelay: `${i * 80}ms` }} />
                ))}

                {/* Transparent overlay — captures mouse for crosshair */}
                <rect x={0} y={0} width={CHART_W} height={CHART_H} fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={handleMouseMove} />

                {/* Annotation circles — rendered after overlay so they capture mouse */}
                {chart.annoPositions.map(a => (
                  <g key={a.num} transform={`translate(${a.x}, 0)`} style={{ cursor: 'help' }} onMouseEnter={e => handleAnnoEnter(e, a)} onMouseLeave={handleAnnoLeave}>
                    <circle cx={0} cy={-4} r={12} fill="transparent" />
                    <circle cx={0} cy={-4} r={10} fill="#fff" stroke={C_ANNO} strokeWidth={1.5} />
                    <text x={0} y={-3} textAnchor="middle" dominantBaseline="central" className="pic_anno_num">
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
                <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="pic_axis_line" />
                {chart.xTicks.map(t => (
                  <g key={t} transform={`translate(${chart.xScale(t)},${CHART_H})`}>
                    <line y2={5} className="pic_tick" />
                    <text y={18} textAnchor="middle" className="pic_x_label">
                      {formatYear(t)}
                    </text>
                  </g>
                ))}

                {/* Post-2022 label — moved to bottom */}
                <text x={chart.correctionX + (CHART_W - chart.correctionX) / 2} y={CHART_H + 38} textAnchor="middle" className="pic_correction_label">
                  post-2022 correction
                </text>
              </g>
            </svg>

            {/* HTML tooltip */}
            {tooltip && (
              <ChartTooltip left={tooltip.left} top={tooltip.top} flip={flipTT}>
                {tooltip.type === 'cross' && (
                  <>
                    <div className="pic_tt_date">{fmtMonth(tooltip.d.date)}</div>
                    {SERIES.map(
                      s =>
                        tooltip.d[s.key] != null && (
                          <div key={s.key} className="pic_tt_row">
                            <span className="pic_tt_dot" style={{ background: s.color }} />
                            <span className="pic_tt_label">{s.label}</span>
                            <span className="pic_tt_val">{tooltip.d[s.key].toFixed(1)}</span>
                          </div>
                        )
                    )}
                  </>
                )}
                {tooltip.type === 'anno' && <div className="pic_tt_anno">{tooltip.label}</div>}
              </ChartTooltip>
            )}
          </>
        )}
      </div>

      {/* ── Annotation key — stays at bottom ── */}
      <div className="pic_anno_key">
        {ANNOTATIONS.map((a, i) => (
          <span key={a.label} className="pic_anno_key_item">
            <span className="pic_anno_key_num">{i + 1}</span>
            {a.label}
          </span>
        ))}
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) based on World Bank</ChartSource>
    </div>
  );
}
