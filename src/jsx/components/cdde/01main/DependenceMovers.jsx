import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import DumbbellChart from '../shared/DumbbellChart';

import './DependenceMovers.css';

export default function DependenceMovers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_movers.json')
      .then(r => r?.json())
      .then(d => { if (d) setData(d); });
  }, []);

  return (
    <div className="dm_container">
      <ChartHeader
        title="Where did commodity dependence increase or decrease?"
        subtitle="Top movers · selected economies · 2012/14 vs 2022/24"
      />

      <p className="dm_insight">
        Global shifts reveal a split picture — with rises in countries such as{' '}
        <strong className="dm_insight_bold">Ghana or Tanzania</strong>, while major exporters like{' '}
        <strong className="dm_insight_bold">Angola or Kazakhstan</strong> have moved in the opposite direction.
      </p>

      <div className="dm_chart_wrap">
        {data
          ? (
            <DumbbellChart
              data={data}
              xMin={0}
              xMax={100}
              nameW={120}
              badgeW={56}
              svgW={520}
              referencePct={60}
              xTickValues={[0, 50, 100]}
            />
          )
          : <div className="dm_loading" />
        }
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025).</ChartSource>
    </div>
  );
}
