import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import DumbbellChart from '../shared/DumbbellChart';

import './ThresholdCrossers.css';

const C_YELLOW = '#fbaf17';
const C_BLUE = '#009edb';

export default function ThresholdCrossers() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_threshold_crossers.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setData(d);
      });
  }, []);

  return (
    <div className="tc_container cdde_reveal">
      <ChartHeader title="Countries that changed commodity dependence status" subtitle="Crossed the 60% threshold · 2012/14 vs 2022/24" />

      <p className="cdde_insight">
        <strong className="cdde_insight_bold">13 countries</strong> have shifted their commodity-dependence status – some, like <strong className="cdde_insight_bold">Panama or Ukraine</strong>, moved above the 60% threshold; others, such as <strong className="cdde_insight_bold">Indonesia or Myanmar</strong>, fell below it.
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

      <div className="tc_chart_wrap">{data ? <DumbbellChart data={data} xMin={0} xMax={100} nameW={172} badgeW={56} svgW={544} referencePct={60} referenceLabel="60% threshold" xTickValues={[0, 50, 100]} /> : <div className="tc_loading" />}</div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). Values are 3-year averages.</ChartSource>
    </div>
  );
}
