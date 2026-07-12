import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import PeriodColumns from '../shared/PeriodColumns';

function energyInsight(name, early, recent) {
  if (early == null || recent == null) return null;
  const fmt = v => `${Math.abs(v).toFixed(1)} per cent`;
  const wasImporter = early > 0;
  const isImporter  = recent > 0;

  if (wasImporter && isImporter) {
    return recent > early
      ? <><strong>{name}</strong> was a <strong>net energy importer</strong> in both periods, with its reliance increasing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, revealing how the economy's exposure to global energy markets has grown over the decade.</>
      : <><strong>{name}</strong> was a <strong>net energy importer</strong> in both periods, with its reliance declining from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a modest easing of its exposure to global energy markets.</>;
  }
  if (!wasImporter && !isImporter) {
    return Math.abs(recent) > Math.abs(early)
      ? <><strong>{name}</strong> was a <strong>net energy exporter</strong> in both periods, with its surplus widening from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a strengthening position in global energy trade.</>
      : <><strong>{name}</strong> was a <strong>net energy exporter</strong> in both periods, with its surplus narrowing from <strong>{fmt(early)}</strong> to <strong>{fmt(recent)}</strong> of merchandise trade, reflecting a weakening position in global energy trade.</>;
  }
  if (wasImporter && !isImporter) {
    return <><strong>{name}</strong> was a <strong>net energy importer</strong> in 2012–2014 but became a <strong>net energy exporter</strong> by 2022–2024, marking a significant shift in how the economy's position in global energy trade has evolved over the decade.</>;
  }
  return <><strong>{name}</strong> was a <strong>net energy exporter</strong> in 2012–2014 but became a <strong>net energy importer</strong> by 2022–2024, marking a significant shift in how the economy's position in global energy trade has evolved over the decade.</>;
}

export default function EnergyNetImports({ iso3, countryName, title, subtitle, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_net_imports.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;
  const insight = d && countryName ? energyInsight(countryName, d.energy_early, d.energy_recent) : null;
  const extraNote = iso3 === 'GNB'
    ? 'Oil export data are not available in the source (no value reported or collected).'
    : note;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle}>
        {insight}
      </ChartHeader>
      <PeriodColumns val1={d?.energy_early ?? null} val2={d?.energy_recent ?? null} />
      <ChartMeta source={source} note={extraNote} />
    </div>
  );
}
