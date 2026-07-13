import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import loadFile from '../../../../helpers/LoadFile';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import ChartTooltip from '../../shared/ChartTooltip';
import { C_BLUE } from '../../shared/cdde-constants';

import './DependenceOverTime.css';

const H = 260;
const M = { top: 20, right: 24, bottom: 32, left: 44 };
const CHART_H = H - M.top - M.bottom;

const PILL_W = 100;
const PILL_H = 20;
const PILL_R = 3;
const PILL_ARROW = 4;

export default function DependenceOverTime({ iso3, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);
  const lineColor = C_BLUE;

  const wrapRef = useRef(null);
  const [svgW, setSvgW] = useState(560);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_over_time.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setAllData(d);
      });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = allData?.[iso3] ?? [];
  const hasData = series.length > 0 && series.some(d => d.pct);

  const CHART_W = svgW - M.left - M.right;

  const xMin = series.length ? series[0].year : 1995;
  const xMax = series.length ? series[series.length - 1].year : 2024;

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, CHART_W]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([CHART_H, 0]);

  const linePath = series.length
    ? d3
        .line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.pct))(series)
    : '';

  const threshold60Y = yScale(60);
  const lastPt = series.length ? series[series.length - 1] : null;
  const lastX = lastPt ? xScale(lastPt.year) : 0;
  const lastY = lastPt ? yScale(lastPt.pct) : 0;

  const yTicks = [0, 20, 40, 60, 80, 100];
  const xTicks = [xMin, 2000, 2005, 2010, 2015, 2020, xMax].filter((y, i, a) => y >= xMin && y <= xMax && a.indexOf(y) === i);

  const pillCX = PILL_W / 2 + 4;

  function handleMouseMove(e) {
    if (!series.length) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartX = (mouseX / rect.width) * svgW - M.left;
    if (chartX < -4 || chartX > CHART_W + 4) {
      setTooltip(null);
      return;
    }
    const year = Math.max(xMin, Math.min(xMax, Math.round(xScale.invert(Math.max(0, Math.min(CHART_W, chartX))))));
    const pt = series.find(d => d.year === year);
    if (!pt) return;
    const domY = ((M.top + yScale(pt.pct)) / H) * rect.height;
    setTooltip({ x: mouseX, cursorX: xScale(pt.year), domY, year: pt.year, pct: pt.pct, flip: mouseX > rect.width * 0.65 });
  }

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      <button type="button" className="dot_chart_wrap" ref={wrapRef} onMouseMove={hasData ? handleMouseMove : undefined} onMouseLeave={() => setTooltip(null)}>
        {!hasData && <p className="cdde_no_data">Data not available</p>}
        {hasData && <svg viewBox={`0 0 ${svgW} ${H}`} className="dot_svg" aria-label="Line chart of commodity export dependence over time">
          <g transform={`translate(${M.left},${M.top})`}>
            {yTicks.map((v, i) => (
              <g key={v} transform={`translate(0,${yScale(v)})`}>
                <line x1={0} x2={CHART_W} className="dot_grid" />
                <text x={-6} y={4} textAnchor="end" className="dot_tick_label">
                  {i === yTicks.length - 1 ? `${v}%` : v}
                </text>
              </g>
            ))}

            <line x1={0} x2={CHART_W} y1={threshold60Y} y2={threshold60Y} className="dot_threshold" />

            {linePath && <path d={linePath} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />}
            <g transform={`translate(4, ${threshold60Y - PILL_H - PILL_ARROW})`}>
              <rect x={0} y={0} width={PILL_W} height={PILL_H} rx={PILL_R} fill="var(--un-color-yellow)" />
              <text x={PILL_W / 2} y={PILL_H - 5} textAnchor="middle" className="dot_pill_label">
                60% threshold
              </text>
              <polygon points={`${pillCX - PILL_ARROW},${PILL_H} ${pillCX + PILL_ARROW},${PILL_H} ${pillCX},${PILL_H + PILL_ARROW}`} fill="var(--un-color-yellow)" />
            </g>

            {lastPt && (
              <>
                <circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
                <rect x={lastX - 24} y={lastY - 30} width={48} height={22} rx={4} fill={lineColor} />
                <text x={lastX} y={lastY - 13} textAnchor="middle" className="dot_callout_label">
                  {lastPt.pct.toFixed(1)}
                </text>
              </>
            )}

            {tooltip && <line x1={tooltip.cursorX} y1={0} x2={tooltip.cursorX} y2={CHART_H} className="dot_cursor" />}

            <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="dot_axis" />
            {xTicks.map(t => (
              <g key={t} transform={`translate(${xScale(t)},${CHART_H})`}>
                <line y2={4} className="dot_tick" />
                <text y={16} textAnchor={t === xMin ? 'start' : t === xMax ? 'end' : 'middle'} className="dot_tick_label">
                  {t}
                </text>
              </g>
            ))}
          </g>
        </svg>}

        {tooltip && (
          <ChartTooltip left={tooltip.x} top={tooltip.domY} flip={tooltip.flip}>
            <div className="dot_tt_year">{tooltip.year}</div>
            <div className="dot_tt_val">{tooltip.pct.toFixed(1)}%</div>
          </ChartTooltip>
        )}
      </button>

      <ChartMeta source={source} note={note} />
    </div>
  );
}
