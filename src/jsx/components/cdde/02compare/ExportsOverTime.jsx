import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import LineChartTime from '../shared/LineChartTime';

export default function ExportsOverTime({ iso3, dominantGroup, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_exports_over_time.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const series = allData?.[iso3] ?? [];

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />
      <LineChartTime series={series} ariaLabel="Line chart of commodity exports over time" />
      <ChartMeta source={source} note={note} />
    </div>
  );
}
