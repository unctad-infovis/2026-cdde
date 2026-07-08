import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import DumbbellChart from '../shared/DumbbellChart';

import './ThresholdCrossers.css';

const C_YELLOW = '#fbaf17';
const C_BLUE   = '#009edb';

export default function ThresholdCrossers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_threshold_crossers.json')
      .then(r => r?.json())
      .then(d => { if (d) setData(d); });
  }, []);

  return (
    <div className="tc_container">
      <ChartHeader
        title={`Countries that changed commodity dependence status (${data?.length ?? 13})`}
        subtitle="Crossed the 60% threshold · 2012/14 vs 2022/24"
      />

      <p className="tc_insight">
        Several countries have shifted their commodity-dependence status – some, like{' '}
        <strong className="tc_insight_bold">Guatemala or Panama</strong>, moved above the 60% threshold; others, such as{' '}
        <strong className="tc_insight_bold">Indonesia or South Africa</strong>, fell below it.
      </p>

      <div className="tc_legend">
        <span className="tc_legend_item">
          <span className="tc_legend_dot" style={{ background: C_BLUE }} />
          No longer commodity-dependent
        </span>
        <span className="tc_legend_item">
          <span className="tc_legend_dot" style={{ background: C_YELLOW }} />
          Now commodity-dependent
        </span>
      </div>

      <div className="tc_chart_wrap">
        {data
          ? (
            <DumbbellChart
              data={data}
              xMin={10}
              xMax={90}
              nameW={148}
              badgeW={56}
              svgW={520}
              referencePct={60}
              referenceLabel="60% threshold"
              xTickValues={[10, 90]}
            />
          )
          : <div className="tc_loading" />
        }
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). Values are 3-year averages.</ChartSource>
    </div>
  );
}
