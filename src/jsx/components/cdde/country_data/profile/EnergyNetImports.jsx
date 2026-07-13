import { useEffect, useState } from 'react';
import loadFile from '../../../../helpers/LoadFile';
import { netImportInsight } from '../../../../helpers/NetImportInsight';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import PeriodColumns from '../../shared/PeriodColumns';

export default function EnergyNetImports({ iso3, countryName, title, subtitle, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_net_imports.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;
  const insight = d && countryName ? netImportInsight(countryName, d.energy_early, d.energy_recent, 'energy') : null;
  const extraNote = iso3 === 'GNB'
    ? 'Oil export data are not available in the source (no value reported or collected).'
    : note;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle}>
        {insight}
      </ChartHeader>
      <PeriodColumns val1={d?.energy_early ?? null} val2={d?.energy_recent ?? null} />
      <ChartMeta source={source} note={extraNote} sourceKey="Net Energy Imports" />
    </div>
  );
}
