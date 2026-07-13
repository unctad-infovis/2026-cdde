import { useEffect, useRef, useState } from 'react';

export default function StackedBar({ segments, height = 28, showLegend = true }) {
  const wrapRef = useRef(null);
  const [progress, setProgress] = useState(0);

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

  const labelOpacity = Math.max(0, (progress - 0.75) / 0.25);

  return (
    <>
      <div className="cdde_stacked_bar" ref={wrapRef} style={{ height }}>
        {segments.map(
          s =>
            s.pct > 0 && (
              <div
                key={s.key}
                className="cdde_stacked_seg"
                style={{ width: `${s.pct * progress}%`, background: s.color }}
                title={`${s.label}: ${s.pct}%`}
              >
                {s.pct >= 8 && (
                  <span className="cdde_stacked_seg_lbl" style={{ opacity: labelOpacity }}>
                    {s.pct}%
                  </span>
                )}
              </div>
            )
        )}
      </div>
      {showLegend && (
        <div className="cdde_legend_row">
          {segments.map(s => (
            <div key={s.key} className="cdde_legend_item">
              <span className="cdde_legend_dot" style={{ background: s.color }} />
              <span className="cdde_legend_label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
