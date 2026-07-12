import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import { C_BLUE, C_YELLOW } from '../shared/cdde-constants';
import DumbbellChart from '../shared/DumbbellChart';

import './StatusChangers.css';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function StatusChangers({ insight, note, source, subtitle, title }) {
  const [data, setData] = useState(null);
  const [visRef, isVisible] = useIsVisible(0.15);
  const animated = isVisible || REDUCED_MOTION;

  useEffect(() => {
    loadFile('assets/data/cdde_threshold_crossers.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setData(d);
      });
  }, []);

  return (
    <div className="sc_container cdde_reveal" ref={visRef}>
      <ChartHeader title={title} subtitle={subtitle} />

      {insight && <p className="cdde_insight">{insight}</p>}

      <div className="cdde_legend_row">
        <span className="cdde_legend_item">
          <span className="cdde_legend_dot" style={{ background: C_BLUE }} />
          No longer commodity-dependent
        </span>
        <span className="cdde_legend_item">
          <span className="cdde_legend_dot" style={{ background: C_YELLOW }} />
          Now commodity-dependent
        </span>
      </div>

      <div className="sc_chart_wrap">{data ? <DumbbellChart data={data} xMin={0} xMax={100} nameW={172} badgeW={56} svgW={544} referencePct={60} referenceLabel="60% threshold" xTickValues={[0, 50, 100]} animated={animated} /> : <div className="sc_loading" />}</div>

      <ChartMeta source={source} note={note} />
    </div>
  );
}
