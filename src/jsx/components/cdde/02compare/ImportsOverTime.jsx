import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import LineChartTime from '../shared/LineChartTime';

export default function ImportsOverTime({ iso3, title, subtitle, description }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_imports_over_time.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const series = allData?.[iso3] ?? [];

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />
      <LineChartTime series={series} ariaLabel="Line chart of commodity imports over time" />
      <ChartMeta source="UN Trade and Development (UNCTAD) calculations, based on UNCTADstat (2025)." />
    </div>
  );
}
