import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import DumbbellChart from '../shared/DumbbellChart';

import './DependenceMovers.css';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DependenceMovers({ insight, note, source, subtitle, title }) {
  const [data, setData] = useState(null);
  const [visRef, isVisible] = useIsVisible(0.1);
  const animated = isVisible || REDUCED_MOTION;

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_movers.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setData(d);
      });
  }, []);

  return (
    <div className="dm_container cdde_reveal" ref={visRef}>
      <ChartHeader title={title} subtitle={subtitle} />

      {insight && <p className="cdde_insight">{insight}</p>}

      <div className="dm_chart_wrap">{data ? <DumbbellChart data={data} xMin={0} xMax={100} nameW={144} badgeW={56} svgW={544} referencePct={60} referenceLabel="60% threshold" xTickValues={[0, 50, 100]} animated={animated} /> : <div className="dm_loading" />}</div>

      <ChartMeta source={source} note={note} />
    </div>
  );
}
