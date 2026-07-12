import { useEffect, useState } from 'react';
import loadFile from '../../../../helpers/LoadFile';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import LineChartTime from '../../shared/LineChartTime';

export default function TimeSeriesChart({ iso3, dataFile, lineColor, ariaLabel, title, subtitle, description, source, note, useMillions = false }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile(`assets/data/${dataFile}`)
      .then(r => r?.json())
      .then(d => {
        if (d) setAllData(d);
      });
  }, [dataFile]);

  const raw = allData?.[iso3] ?? [];
  const series = useMillions ? raw.map(d => ({ ...d, val: d.val * 1000 })) : raw;
  const effectiveSubtitle = useMillions ? subtitle?.replace('Billions', 'Millions') : subtitle;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={effectiveSubtitle} description={description} />
      <LineChartTime series={series} lineColor={lineColor} ariaLabel={ariaLabel} tooltipUnit={useMillions ? 'mn USD' : 'bn USD'} />
      <ChartMeta source={source} note={note} />
    </div>
  );
}
