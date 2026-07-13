import './ChartMeta.css';

export default function ChartMeta({ note, source }) {
  if (!source && !note) return null;
  return (
    <div className="cdde_meta">
      {source && (
        <div className="cdde_meta_row">
          <em>Source:</em> {source}
        </div>
      )}
      {note && (
        <div className="cdde_meta_row">
          <em>Note:</em> {note}
        </div>
      )}
    </div>
  );
}
