import './ChartTooltip.css';

export default function ChartTooltip({ left, top, flip = false, children }) {
  return (
    <div className={`cdde_tooltip${flip ? ' cdde_tooltip--flip' : ''}`} style={{ left, top }}>
      {children}
    </div>
  );
}
