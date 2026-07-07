export default function HorizBar({ label, pct, color, nameWidth = 140 }) {
  return (
    <div className="cdde_hbar_row" style={{ gridTemplateColumns: `${nameWidth}px 1fr 52px` }}>
      <span className="cdde_hbar_label">{label}</span>
      <div className="cdde_hbar_track">
        <div className="cdde_hbar_fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="cdde_hbar_pct">{pct}%</span>
    </div>
  );
}
