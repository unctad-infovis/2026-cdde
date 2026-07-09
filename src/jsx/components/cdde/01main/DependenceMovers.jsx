import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import DumbbellChart from '../shared/DumbbellChart';

import './DependenceMovers.css';

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DependenceMovers() {
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
      <ChartHeader title="Where did commodity dependence increase or decrease?" subtitle="Top movers · selected economies · 2012/14 vs 2022/24" />

      <p className="cdde_insight">
        Global shifts reveal a split picture – with rises in countries such as <strong className="cdde_insight_bold">Niger or Argentina</strong>, while major exporters like <strong className="cdde_insight_bold">Maldives or Brunei Darussalam</strong> have moved in the opposite direction.
      </p>

      <div className="dm_chart_wrap">{data ? <DumbbellChart data={data} xMin={0} xMax={100} nameW={144} badgeW={56} svgW={544} referencePct={60} referenceLabel="60% threshold" xTickValues={[0, 50, 100]} animated={animated} /> : <div className="dm_loading" />}</div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025).</ChartSource>
    </div>
  );
}
