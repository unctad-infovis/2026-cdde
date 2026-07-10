import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';

import './ExportsOverTime.css';

const H = 260;
const M = { top: 20, right: 24, bottom: 32, left: 52 };
const CHART_H = H - M.top - M.bottom;

function fmtY(v) {
  if (v === 0) return '0';
  if (v >= 100) return `${Math.round(v)}`;
  if (v >= 10) return `${v.toFixed(0)}`;
  if (v >= 1) return `${v.toFixed(1)}`;
  return `${v.toFixed(2)}`;
}

function niceMax(v) {
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}

export default function ExportsOverTime({ iso3, dominantGroup, title, subtitle, description }) {
  const [allData, setAllData] = useState(null);
  const lineColor = '#009edb';

  const wrapRef = useRef(null);
  const [svgW, setSvgW] = useState(560);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_exports_over_time.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = allData?.[iso3] ?? [];

  const CHART_W = svgW - M.left - M.right;

  const xMin = series.length ? series[0].year : 1995;
  const xMax = series.length ? series[series.length - 1].year : 2024;

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, CHART_W]);

  const rawMax = series.length ? Math.max(...series.map(d => d.val)) : 1;
  const yMax = niceMax(rawMax * 1.12);
  const yScale = d3.scaleLinear().domain([0, yMax]).range([CHART_H, 0]);

  const step = niceMax(yMax / 4);
  const yTicks = [];
  for (let v = 0; v <= yMax; v += step) yTicks.push(+v.toFixed(10));

  const linePath = series.length
    ? d3.line().x(d => xScale(d.year)).y(d => yScale(d.val))(series)
    : '';

  const xTicks = [xMin, 2000, 2005, 2010, 2015, 2020, xMax].filter((y, i, a) => y >= xMin && y <= xMax && a.indexOf(y) === i);

  const lastPt = series.length ? series[series.length - 1] : null;
  const lastX = lastPt ? xScale(lastPt.year) : 0;
  const lastY = lastPt ? yScale(lastPt.val) : 0;
  const calloutText = lastPt ? fmtY(lastPt.val) : '';
  const calloutW = Math.max(36, calloutText.length * 7 + 12);

  function handleMouseMove(e) {
    if (!series.length) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartX = (mouseX / rect.width) * svgW - M.left;
    if (chartX < -4 || chartX > CHART_W + 4) { setTooltip(null); return; }
    const year = Math.max(xMin, Math.min(xMax, Math.round(xScale.invert(Math.max(0, Math.min(CHART_W, chartX))))));
    const pt = series.find(d => d.year === year);
    if (!pt) return;
    const domY = ((M.top + yScale(pt.val)) / H) * rect.height;
    setTooltip({ x: mouseX, cursorX: xScale(pt.year), domY, year: pt.year, val: pt.val, flip: mouseX > rect.width * 0.65 });
  }

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      <div className="exv_chart_wrap" ref={wrapRef} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <svg viewBox={`0 0 ${svgW} ${H}`} className="exv_svg" aria-label="Line chart of commodity exports over time">
          <g transform={`translate(${M.left},${M.top})`}>
            {yTicks.map(v => (
              <g key={v} transform={`translate(0,${yScale(v)})`}>
                <line x1={0} x2={CHART_W} className="exv_grid" />
                <text x={-6} y={4} textAnchor="end" className="exv_tick_label">
                  {fmtY(v)}
                </text>
              </g>
            ))}

            {linePath && (
              <path d={linePath} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            )}

            {lastPt && (
              <>
                <circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
                <rect x={lastX - calloutW / 2} y={lastY - 22} width={calloutW} height={18} rx={4} fill={lineColor} />
                <text x={lastX} y={lastY - 9} textAnchor="middle" className="exv_callout_label">
                  {calloutText}
                </text>
              </>
            )}

            {tooltip && (
              <line x1={tooltip.cursorX} y1={0} x2={tooltip.cursorX} y2={CHART_H} className="exv_cursor" />
            )}

            <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="exv_axis" />
            {xTicks.map(t => (
              <g key={t} transform={`translate(${xScale(t)},${CHART_H})`}>
                <line y2={4} className="exv_tick" />
                <text y={16} textAnchor={t === xMin ? 'start' : t === xMax ? 'end' : 'middle'} className="exv_tick_label">
                  {t}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {tooltip && (
          <div className={`exv_tooltip${tooltip.flip ? ' exv_tooltip--flip' : ''}`} style={{ left: tooltip.x, top: tooltip.domY }}>
            <div className="exv_tt_year">{tooltip.year}</div>
            <div className="exv_tt_val">{fmtY(tooltip.val)} bn USD</div>
          </div>
        )}
      </div>

      <ChartMeta source="UN Trade and Development (UNCTAD) calculations, based on UNCTADstat (2025)." />
    </div>
  );
}
