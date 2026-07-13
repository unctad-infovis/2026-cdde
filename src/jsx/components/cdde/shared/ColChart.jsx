import { useEffect, useRef, useState } from 'react';

const H = 200;
const M = { top: 24, right: 16, bottom: 4, left: 44 };
const CHART_H = H - M.top - M.bottom;

function niceStep(raw) {
  if (raw <= 0) return 10;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const frac = raw / mag;
  if (frac <= 1) return mag;
  if (frac <= 2) return 2 * mag;
  if (frac <= 5) return 5 * mag;
  return 10 * mag;
}

export default function ColChart({ items, color = 'var(--un-color-blue)' }) {
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

  if (!items?.length) {
    return (
      <div className="cdde_col_wrap" ref={wrapRef}>
        <p className="cdde_no_data">Data not available</p>
      </div>
    );
  }

  const CHART_W = svgW - M.left - M.right;
  const n = items.length;
  const slotW = CHART_W / n;
  const barW = Math.min(slotW * 0.55, 64);

  const dataMax = Math.max(...items.map(d => d.pct));
  const step = niceStep((dataMax * 1.15) / 4);
  const yMax = Math.ceil((dataMax * 1.15) / step) * step;

  const yTicks = [];
  for (let v = 0; v <= yMax + step * 0.01; v += step) yTicks.push(+v.toFixed(10));

  const ys = v => CHART_H - (v / yMax) * CHART_H;

  return (
    <div className="cdde_col_wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${svgW} ${H}`} className="cdde_col_svg" aria-label="Column chart">
        <g transform={`translate(${M.left},${M.top})`}>
          {yTicks.map(v => (
            <g key={v} transform={`translate(0,${ys(v)})`}>
              <line x1={0} x2={CHART_W} className="cdde_col_grid" />
              <text x={-4} y={4} textAnchor="end" className="cdde_col_tick">
                {Math.round(v)}
              </text>
            </g>
          ))}

          <line x1={0} y1={CHART_H} x2={CHART_W} y2={CHART_H} className="cdde_col_axis" />

          {items.map((item, i) => {
            const cx = (i + 0.5) * slotW;
            const fullBh = CHART_H - ys(item.pct);
            const bh = fullBh * progress;
            const by = CHART_H - bh;
            const labelOpacity = Math.max(0, (progress - 0.75) / 0.25);
            return (
              <g key={item.label}>
                <rect x={cx - barW / 2} y={by} width={barW} height={bh} fill={color} rx={3} />
                <text x={cx} y={by - 5} textAnchor="middle" className="cdde_col_val" style={{ opacity: labelOpacity }}>
                  {parseFloat(item.pct.toFixed(1))}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="cdde_col_labels" style={{ paddingLeft: M.left, paddingRight: M.right }}>
        {items.map(item => (
          <div key={item.label} className="cdde_col_label" title={item.label}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
