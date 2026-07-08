export default function StackedBar({ segments, height = 28, showLegend = true }) {
  return (
    <>
      <div className="cdde_stacked_bar" style={{ height }}>
        {segments.map(
          s =>
            s.pct > 0 && (
              <div key={s.key} className="cdde_stacked_seg" style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label}: ${s.pct}%`}>
                {s.pct >= 8 && <span className="cdde_stacked_seg_lbl">{s.pct}%</span>}
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
