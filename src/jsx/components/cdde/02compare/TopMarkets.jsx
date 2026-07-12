import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ColChart from '../shared/ColChart';

export default function TopMarkets({ iso3, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_top_markets.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setAllData(d);
      });
  }, []);

  const markets = allData?.[iso3] ?? null;

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      {!allData && <div className="cdde_loading" style={{ height: 120 }} />}
      {allData && !markets && <p className="cdde_no_data">Destination market data not available for this country.</p>}
      {markets && <ColChart items={markets} />}

      <ChartMeta source={source} note={note} />
    </div>
  );
}
