import useSources, { fmtExtractedDate } from '../../../helpers/useSources';
import './ChartMeta.css';

const SOURCE_LINKS = [
  ['UNCTADstat', 'https://unctadstat.unctad.org/datacentre/'],
  ['World Bank', 'https://databank.worldbank.org/source/world-development-indicators'],
  ['UNDP', 'https://hdr.undp.org/data-center/human-development-index#/indicies/HDI'],
];

function linkifySource(text, unctadLink) {
  if (typeof text !== 'string') return text;
  const pairs = SOURCE_LINKS.map(([label, href]) =>
    [label, label === 'UNCTADstat' && unctadLink?.includes('unctadstat') ? unctadLink : href]
  ).filter(([label]) => text.includes(label));
  if (!pairs.length) return text;
  const pattern = new RegExp(`(${pairs.map(([l]) => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  const linkMap = Object.fromEntries(pairs);
  return text.split(pattern).map((part, i) =>
    linkMap[part]
      ? <a key={i} href={linkMap[part]} target="_blank" rel="noopener">{part}</a>
      : part
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
