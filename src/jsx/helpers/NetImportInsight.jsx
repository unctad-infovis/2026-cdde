export function netImportInsight(name, early, recent, type) {
  if (early == null || recent == null) return null;
  const fmt = v => `${Math.abs(v).toFixed(1)} per cent`;
  const commodity = type === 'food' ? 'food' : 'energy';
  const market = type === 'food' ? 'agricultural' : 'energy';
  const wasImporter = early > 0;
  const isImporter = recent > 0;

  if (wasImporter && isImporter) {
    return recent > early
      ? <><strong>{name}</strong> was a <strong>net {commodity} importer</strong> in both periods, with its reliance increasing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, {type === 'food' ? `highlighting how the economy's exposure to global ${market} markets has grown over the decade` : `revealing how the economy's exposure to global ${market} markets has grown over the decade`}.</>
      : <><strong>{name}</strong> was a <strong>net {commodity} importer</strong> in both periods, with its reliance declining from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, {type === 'food' ? `suggesting a modest reduction in its exposure to global ${market} markets` : `reflecting a modest easing of its exposure to global ${market} markets`}.</>;
  }
  if (!wasImporter && !isImporter) {
    return Math.abs(recent) > Math.abs(early)
      ? <><strong>{name}</strong> was a <strong>net {commodity} exporter</strong> in both periods, with its surplus widening from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a strengthening position in global {market} trade.</>
      : <><strong>{name}</strong> was a <strong>net {commodity} exporter</strong> in both periods, with its surplus narrowing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a weakening position in global {market} trade.</>;
  }
  if (wasImporter && !isImporter) {
    return type === 'food'
      ? <><strong>{name}</strong> was a <strong>net food importer</strong> in 2012–2014 but became a <strong>net food exporter</strong> by 2022–2024, marking a significant shift in its position in global agricultural trade.</>
      : <><strong>{name}</strong> was a <strong>net energy importer</strong> in 2012–2014 but became a <strong>net energy exporter</strong> by 2022–2024, marking a significant shift in how the economy's position in global energy trade has evolved over the decade.</>;
  }
  return type === 'food'
    ? <><strong>{name}</strong> was a <strong>net food exporter</strong> in 2012–2014 but became a <strong>net food importer</strong> by 2022–2024, marking a significant shift in its exposure to global agricultural markets.</>
    : <><strong>{name}</strong> was a <strong>net energy exporter</strong> in 2012–2014 but became a <strong>net energy importer</strong> by 2022–2024, marking a significant shift in how the economy's position in global energy trade has evolved over the decade.</>;
}
