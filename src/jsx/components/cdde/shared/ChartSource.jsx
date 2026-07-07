import './ChartSource.css';

export default function ChartSource({ children }) {
  return (
    <p className="cdde_source">
      <em>Source:</em> {children}
    </p>
  );
}
