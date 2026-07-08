import * as d3 from 'd3';
import { useMemo } from 'react';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './DependenceOverTime.css';

const W = 560;
const H = 260;
const M = { top: 16, right: 96, bottom: 32, left: 44 };
const CHART_W = W - M.left - M.right;
const CHART_H = H - M.top - M.bottom;

const GROUP_COLORS = {
  agri: '#72bf44',
  energy: '#009edb',
  mining: '#fbaf17',
  'non-dependent': '#9e9e9e'
};

// Deterministic pseudo-random trend from iso3 + current value
function buildSeries(iso3, currentPct) {
  const seed = iso3.split('').reduce((s, c, i) => s + c.charCodeAt(0) * (i + 1) * 31, 0);
  const rn = n => ((seed * (n + 1) * 1664525 + 1013904223) >>> 0) / 4294967295;

  const n = 15;
  const startDelta = (rn(1) - 0.5) * 22;
  const startPct = Math.max(8, Math.min(97, currentPct + startDelta));

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const trend = startPct + (currentPct - startPct) * t;
    const noise = (rn(i + 5) - 0.5) * 12 * (1 - t * 0.55);
    return { year: 2010 + i, pct: +Math.max(5, Math.min(99, trend + noise)).toFixed(1) };
  });
}

export default function DependenceOverTime({ iso3, currentPct, dominantGroup }) {
  const series = useMemo(() => buildSeries(iso3, currentPct), [iso3, currentPct]);
  const lineColor = GROUP_COLORS[dominantGroup] || '#009edb';

  const xScale = d3.scaleLinear().domain([2010, 2024]).range([0, CHART_W]);

  const allPcts = series.map(d => d.pct);
  const yMin = Math.max(0, Math.floor((Math.min(...allPcts, 55) - 8) / 10) * 10);
  const yMax = Math.min(100, Math.ceil((Math.max(...allPcts, 65) + 8) / 10) * 10);

  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([CHART_H, 0]);

  const linePath = d3
    .line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.pct))(series);

  const areaPath = d3
    .area()
    .x(d => xScale(d.year))
    .y0(CHART_H)
    .y1(d => yScale(d.pct))(series);

  const threshold60 = yScale(60);
  const lastPt = series[series.length - 1];
  const lastX = xScale(lastPt.year);
  const lastY = yScale(lastPt.pct);

  const yTicks = [];
  for (let v = yMin; v <= yMax; v += 10) yTicks.push(v);
  const xTicks = [2010, 2015, 2020, 2024];

  return (
    <div className="cdde_card">
      <ChartHeader title="Commodity export dependence over time" subtitle={`Annual share, % · 2010–2024`} />

      <div className="dot_chart_wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="dot_svg" aria-label="Line chart of commodity export dependence over time">
          <defs>
            <linearGradient id={`dot_grad_${iso3}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
            <clipPath id={`dot_clip_${iso3}`}>
              <rect x={0} y={0} width={CHART_W} height={CHART_H} />
            </clipPath>
          </defs>

          <g transform={`translate(${M.left},${M.top})`}>
            {/* Y grid */}
            {yTicks.map(v => (
              <g key={v} transform={`translate(0,${yScale(v)})`}>
                <line x1={0} x2={CHART_W} className="dot_grid" />
                <text x={-6} y={4} textAnchor="end" className="dot_tick_label">
                  {v}%
                </text>
              </g>
            ))}

            {/* 60% threshold */}
            {threshold60 >= 0 && threshold60 <= CHART_H && (
              <>
                <line x1={0} x2={CHART_W} y1={threshold60} y2={threshold60} className="dot_threshold" />
                <text x={CHART_W + 4} y={threshold60 + 4} className="dot_threshold_label">
                  60% threshold
                </text>
              </>
            )}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#dot_grad_${iso3})`} clipPath={`url(#dot_clip_${iso3})`} />

            {/* Line */}
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Last point callout */}
            <circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
            <rect x={lastX - 22} y={lastY - 22} width={44} height={18} rx={4} fill={lineColor} />
            <text x={lastX} y={lastY - 9} textAnchor="middle" className="dot_callout_label">
              {lastPt.pct}%
            </text>

            {/* X axis */}
            <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="dot_axis" />
            {xTicks.map(t => (
              <g key={t} transform={`translate(${xScale(t)},${CHART_H})`}>
                <line y2={4} className="dot_tick" />
                <text y={16} textAnchor={t === 2010 ? 'start' : t === 2024 ? 'end' : 'middle'} className="dot_tick_label">
                  {t}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025).</ChartSource>
    </div>
  );
}
