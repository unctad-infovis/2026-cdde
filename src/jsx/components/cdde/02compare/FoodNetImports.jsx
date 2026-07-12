import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import PeriodColumns from '../shared/PeriodColumns';

function foodInsight(name, early, recent) {
  if (early == null || recent == null) return null;
  const fmt = v => `${Math.abs(v).toFixed(1)} per cent`;
  const wasImporter = early > 0;
  const isImporter  = recent > 0;

  if (wasImporter && isImporter) {
    return recent > early
      ? <><strong>{name}</strong> was a <strong>net food importer</strong> in both periods, with its reliance increasing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, highlighting how the economy's exposure to global agricultural markets has grown over the decade.</>
      : <><strong>{name}</strong> was a <strong>net food importer</strong> in both periods, with its reliance declining from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, suggesting a modest reduction in its exposure to global agricultural markets.</>;
  }
  if (!wasImporter && !isImporter) {
    return Math.abs(recent) > Math.abs(early)
      ? <><strong>{name}</strong> was a <strong>net food exporter</strong> in both periods, with its surplus widening from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a strengthening position in global agricultural trade.</>
      : <><strong>{name}</strong> was a <strong>net food exporter</strong> in both periods, with its surplus narrowing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a weakening position in global agricultural trade.</>;
  }
  if (wasImporter && !isImporter) {
    return <><strong>{name}</strong> was a <strong>net food importer</strong> in 2012–2014 but became a <strong>net food exporter</strong> by 2022–2024, marking a significant shift in its position in global agricultural trade.</>;
  }
  return <><strong>{name}</strong> was a <strong>net food exporter</strong> in 2012–2014 but became a <strong>net food importer</strong> by 2022–2024, marking a significant shift in its exposure to global agricultural markets.</>;
}

export default function FoodNetImports({ iso3, countryName, title, subtitle, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_net_imports.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;
  const insight = d && countryName ? foodInsight(countryName, d.food_early, d.food_recent) : null;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle}>
        {insight}
      </ChartHeader>
      <PeriodColumns val1={d?.food_early ?? null} val2={d?.food_recent ?? null} />
      <ChartMeta source={source} note={note} />
    </div>
  );
}
