import './ChartHeader.css';

export default function ChartHeader({ title, subtitle, large = false }) {
  return (
    <div className="cdde_header">
      <h3 className={`cdde_header_title${large ? ' cdde_header_title--lg' : ''}`}>{title}</h3>
      {subtitle && <p className="cdde_header_subtitle">{subtitle}</p>}
    </div>
  );
}
