import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { axisFmt, C_BLUE, C_YELLOW } from './cdde-constants';

import './PeriodColumns.css';

const H = 220;
const M = { top: 28, right: 16, bottom: 44, left: 44 };
const CHART_H = H - M.top - M.bottom;

const COLOR1 = C_YELLOW;
const COLOR2 = C_BLUE;
const LABEL1 = '2012–2014';
const LABEL2 = '2022–2024';

function niceStep(raw) {
  if (raw <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const frac = raw / mag;
  if (frac <= 1) return mag;
  if (frac <= 2) return 2 * mag;
  if (frac <= 5) return 5 * mag;
  return 10 * mag;
}

function fmtPct(v) {
  return `${v.toFixed(1)}%`;
}

export default function PeriodColumns({ val1, val2 }) {
  const wrapRef = useRef(null);
  const [svgW, setSvgW] = useState(300);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Viewport detection → grow animation
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 700;
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - (1 - p) ** 3;
          setProgress(eased);
          if (p < 1) requestAnimationFrame(tick);
          else setProgress(1);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const CHART_W = svgW - M.left - M.right;

  const hasData = val1 != null || val2 != null;

  const allVals = [val1 ?? 0, val2 ?? 0];
  const dataMin = Math.min(...allVals, 0);
  const dataMax = Math.max(...allVals, 0);
  const range = Math.max(dataMax, -dataMin, 0.1);
  const step = niceStep((range * 1.2) / 4);
  const yMin = dataMin < 0 ? Math.floor((dataMin * 1.15) / step) * step : 0;
  const yMax = dataMax > 0 ? Math.ceil((dataMax * 1.15) / step) * step : step;

  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([CHART_H, 0]);
  const zeroY = yScale(0);

  const yTicks = [];
  for (let v = yMin; v <= yMax + step * 0.01; v += step) yTicks.push(+v.toFixed(10));

  const barW = Math.min(CHART_W * 0.38, 80);
  const spacing = (CHART_W - barW * 2) / 3;
  const x1 = spacing;
  const x2 = spacing * 2 + barW;

  // Animated bar props: grow from zero line outward
  function animBarProps(val) {
    if (val == null) return null;
    const fullTop = Math.min(yScale(val), zeroY);
    const fullHeight = Math.max(Math.abs(yScale(val) - zeroY), 1);
    const animHeight = fullHeight * progress;
    const top = val >= 0 ? zeroY - animHeight : zeroY;
    return { y: top, height: animHeight };
  }

  function valLabelY(val) {
    if (val == null) return 0;
    if (val >= 0) return Math.max(yScale(val) - 6, 4);
    return Math.min(yScale(val) + 14, CHART_H + 12);
  }

  const labelOpacity = Math.max(0, (progress - 0.75) / 0.25);

  return (
    <div className="pcc_wrap" ref={wrapRef}>
      {!hasData && <p className="cdde_no_data">Data not available</p>}
      {hasData && <svg viewBox={`0 0 ${svgW} ${H}`} className="pcc_svg" aria-label="Column chart comparing two time periods">
        <g transform={`translate(${M.left},${M.top})`}>
          {yTicks.map(v => (
            <g key={v} transform={`translate(0,${yScale(v)})`}>
              <line x1={0} x2={CHART_W} className="pcc_grid" />
              <text x={-4} y={4} textAnchor="end" className="pcc_tick_label">
                {axisFmt(v, step)}
              </text>
            </g>
          ))}

          {/* Zero baseline serves as x-axis */}
          <line x1={0} y1={zeroY} x2={CHART_W} y2={zeroY} className="pcc_zero" />

          {val1 != null &&
            (() => {
              const b = animBarProps(val1);
              return (
                <>
                  <rect x={x1} y={b.y} width={barW} height={b.height} fill={COLOR1} rx={3} />
                  <text x={x1 + barW / 2} y={valLabelY(val1)} textAnchor="middle" className="pcc_val_label" style={{ opacity: labelOpacity }}>
                    {fmtPct(val1)}
                  </text>
                </>
              );
            })()}

          {val2 != null &&
            (() => {
              const b = animBarProps(val2);
              return (
                <>
                  <rect x={x2} y={b.y} width={barW} height={b.height} fill={COLOR2} rx={3} />
                  <text x={x2 + barW / 2} y={valLabelY(val2)} textAnchor="middle" className="pcc_val_label" style={{ opacity: labelOpacity }}>
                    {fmtPct(val2)}
                  </text>
                </>
              );
            })()}

          <text x={x1 + barW / 2} y={CHART_H + 16} textAnchor="middle" className="pcc_tick_label">
            {LABEL1}
          </text>
          <text x={x2 + barW / 2} y={CHART_H + 16} textAnchor="middle" className="pcc_tick_label">
            {LABEL2}
          </text>
        </g>
      </svg>}
    </div>
  );
}
