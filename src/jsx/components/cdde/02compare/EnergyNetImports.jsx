import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import PeriodColumns from '../shared/PeriodColumns';

export default function EnergyNetImports({ iso3, title, subtitle, description }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_net_imports.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />
      <PeriodColumns val1={d?.energy_early ?? null} val2={d?.energy_recent ?? null} />
      <ChartMeta source="UN Trade and Development (UNCTAD) calculations, based on UNCTADstat (2025)." />
    </div>
  );
}
