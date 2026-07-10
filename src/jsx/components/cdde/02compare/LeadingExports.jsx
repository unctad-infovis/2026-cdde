import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ColChart from '../shared/ColChart';

export default function LeadingExports({ iso3, dominantGroup, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_leading_exports.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const exports = allData?.[iso3] ?? null;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      {!allData && <div className="cdde_loading" style={{ height: 120 }} />}
      {allData && !exports && <p className="cdde_no_data">Export breakdown data not available for this country.</p>}
      {exports && <ColChart items={exports} />}

      <ChartMeta source={source} note={note} />
    </div>
  );
}
