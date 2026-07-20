import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import { useEffect, useState } from 'react';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import LineChartTime from '../../shared/LineChartTime';

const SOURCE_KEYS = {
  'cdde_exports_over_time.json': 'Commodity Exports, 2022–2024',
  'cdde_imports_over_time.json': 'Historical Commodity Imports',
  'cdde_food_imports.json': 'Historical Food Imports',
  'cdde_energy_imports.json': 'Historical Energy Imports'
};

export default function TimeSeriesChart({ iso3, dataFile, lineColor, ariaLabel, title, subtitle, description, source, note, useMillions = false }) {
  const [allData, setAllData] = useState(null);
  const sourceKey = SOURCE_KEYS[dataFile] ?? null;

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
      <ChartMeta source={source} note={note} sourceKey={sourceKey} />
    </div>
  );
}
