import useSources, { fmtExtractedDate } from '../../../helpers/useSources';
import './ChartMeta.css';

function linkifySource(text, link) {
  if (!link || typeof text !== 'string' || !text.includes('UNCTADstat')) return text;
  const parts = text.split('UNCTADstat');
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <a key={i} href={link} target="_blank" rel="noopener">UNCTADstat</a>]
      : [part]
  );
}

export default function ChartMeta({ note, source, sourceKey }) {
  const sources = useSources();

  let dateText = null;
  let sourceLink = null;
  if (sourceKey && sources) {
    const keys = Array.isArray(sourceKey) ? sourceKey : [sourceKey];
    const entries = keys.map(k => sources.find(s => s.title.startsWith(k))).filter(Boolean);
    const dates = [...new Set(entries.map(e => e.date ? fmtExtractedDate(e.date) : null).filter(Boolean))];
    if (dates.length) dateText = `Data extracted ${dates.join(', ')}.`;
    const links = [...new Set(entries.map(e => e.link).filter(Boolean))];
    sourceLink = links.find(l => l.includes('unctadstat.unctad.org')) || links[0] || null;
  }

  const linkedSource = linkifySource(source, sourceLink);
  const fullSource = linkedSource && dateText ? <>{linkedSource} {dateText}</> : linkedSource;
  if (!fullSource && !note) return null;
  return (
    <div className="cdde_meta">
      {fullSource && (
        <div className="cdde_meta_row">
          <em>Source:</em> {fullSource}
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
