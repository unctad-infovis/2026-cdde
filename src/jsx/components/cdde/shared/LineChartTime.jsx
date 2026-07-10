import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

import './LineChartTime.css';

const H = 260;
const M = { top: 20, right: 24, bottom: 32, left: 52 };
const CHART_H = H - M.top - M.bottom;

function fmtBillions(v) {
  if (v === 0) return '0';
  if (v >= 100) return `${Math.round(v)}`;
  if (v >= 10) return `${v.toFixed(0)}`;
  if (v >= 1) return `${parseFloat(v.toFixed(1))}`;
  return `${parseFloat(v.toFixed(2))}`;
}

function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const frac = raw / mag;
  if (frac <= 1) return mag;
  if (frac <= 2) return 2 * mag;
  if (frac <= 5) return 5 * mag;
  return 10 * mag;
}

function axisFmt(v, step) {
  if (v === 0) return '0';
  if (step >= 1) return `${Math.round(v)}`;
  if (step >= 0.1) return v.toFixed(1);
  return v.toFixed(2);
}

export default function LineChartTime({ series, lineColor = '#009edb', yFmt = fmtBillions, tooltipUnit = 'bn USD', ariaLabel = 'Line chart over time' }) {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const [svgW, setSvgW] = useState(560);
  const [tooltip, setTooltip] = useState(null);
  const [pathLen, setPathLen] = useState(null);
  const [revealed, setRevealed] = useState(false);

  // ResizeObserver for responsive width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Viewport detection — fires once, triggers draw animation
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); io.disconnect(); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const CHART_W = svgW - M.left - M.right;

  const xMin = series.length ? series[0].year : 1995;
  const xMax = series.length ? series[series.length - 1].year : 2024;

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, CHART_W]);

  const rawMax = series.length ? Math.max(...series.map(d => d.val)) : 1;
  const step = niceStep((rawMax * 1.12) / 4);
  const yMax = Math.ceil((rawMax * 1.12) / step) * step;
  const yScale = d3.scaleLinear().domain([0, yMax]).range([CHART_H, 0]);

  const yTicks = [];
  for (let v = 0; v <= yMax + step * 0.01; v += step) yTicks.push(+v.toFixed(10));

  const linePath = series.length
    ? d3
        .line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.val))(series)
    : '';

  // Measure path length after render so we can set stroke-dasharray
  useEffect(() => {
    if (pathRef.current && linePath) {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, [linePath, svgW]);

  const xTicks = [xMin, 2000, 2005, 2010, 2015, 2020, xMax].filter((y, i, a) => y >= xMin && y <= xMax && a.indexOf(y) === i);

  const lastPt = series.length ? series[series.length - 1] : null;
  const lastX = lastPt ? xScale(lastPt.year) : 0;
  const lastY = lastPt ? yScale(lastPt.val) : 0;
  const calloutText = lastPt ? yFmt(lastPt.val) : '';
  const calloutW = Math.max(36, calloutText.length * 7 + 12);

  // Dash animation: invisible until pathLen known, then draw in on reveal
  const pathStyle = pathLen != null
    ? {
        strokeDasharray: pathLen,
        strokeDashoffset: revealed ? 0 : pathLen,
        transition: revealed ? 'stroke-dashoffset 1.4s ease 0.2s' : 'none',
      }
    : { visibility: 'hidden' };

  const endpointStyle = {
    opacity: revealed ? 1 : 0,
    transition: revealed ? 'opacity 0.3s ease 1.4s' : 'none',
  };

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
    const domY = ((M.top + yScale(pt.val)) / H) * rect.height;
    setTooltip({ x: mouseX, cursorX: xScale(pt.year), domY, year: pt.year, val: pt.val, flip: mouseX > rect.width * 0.65 });
  }

  return (
    <div className="lct_wrap" ref={wrapRef} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
      <svg viewBox={`0 0 ${svgW} ${H}`} className="lct_svg" aria-label={ariaLabel}>
        <g transform={`translate(${M.left},${M.top})`}>
          {yTicks.map(v => (
            <g key={v} transform={`translate(0,${yScale(v)})`}>
              <line x1={0} x2={CHART_W} className="lct_grid" />
              <text x={-6} y={4} textAnchor="end" className="lct_tick_label">
                {axisFmt(v, step)}
              </text>
            </g>
          ))}

          {linePath && (
            <path
              ref={pathRef}
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={pathStyle}
            />
          )}

          {lastPt && (
            <g style={endpointStyle}>
              <circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
              <rect x={lastX - calloutW / 2} y={lastY - 26} width={calloutW} height={20} rx={6} fill={lineColor} />
              <text x={lastX} y={lastY - 11} textAnchor="middle" className="lct_callout_label">
                {calloutText}
              </text>
            </g>
          )}

          {tooltip && <line x1={tooltip.cursorX} y1={0} x2={tooltip.cursorX} y2={CHART_H} className="lct_cursor" />}

          <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="lct_axis" />
          {xTicks.map(t => (
            <g key={t} transform={`translate(${xScale(t)},${CHART_H})`}>
              <line y2={4} className="lct_tick" />
              <text y={16} textAnchor={t === xMin ? 'start' : t === xMax ? 'end' : 'middle'} className="lct_tick_label">
                {t}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {tooltip && (
        <div className={`lct_tooltip${tooltip.flip ? ' lct_tooltip--flip' : ''}`} style={{ left: tooltip.x, top: tooltip.domY }}>
          <div className="lct_tt_year">{tooltip.year}</div>
          <div className="lct_tt_val" style={{ color: lineColor }}>
            {yFmt(tooltip.val)} {tooltipUnit}
          </div>
        </div>
      )}
    </div>
  );
}
