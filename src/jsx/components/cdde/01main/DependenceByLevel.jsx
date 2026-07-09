import { useEffect, useState } from 'react';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './DependenceByLevel.css';

const THRESHOLD = 60;
const MAX_PCT = 100;
const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DependenceByLevel() {
  const [data, setData] = useState(null);
  const [visRef, isVisible] = useIsVisible(0.2);

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_by_level.csv')
      .then(r => r?.text())
      .then(text => {
        if (!text) return;
        const rows = CSVtoJSON(text).filter(r => r.group);
        setData(
          rows.map(r => ({
            group: r.group,
            economies: +r.economies,
            avg_pct: +r.avg_pct,
            color: r.group === 'Developed' ? 'green' : 'blue'
          }))
        );
      });
  }, []);

  const animated = isVisible || REDUCED_MOTION;

  if (!data) {
    return (
      <div className="alc_container cdde_reveal" ref={visRef}>
        <div className="alc_loading" />
      </div>
    );
  }

  const thresholdPct = (THRESHOLD / MAX_PCT) * 100;

  return (
    <div className="alc_container cdde_reveal" ref={visRef}>
      <ChartHeader title="Average dependence by development level" subtitle="Mean commodity export share across economies, 2022–2024" large />

      <p className="cdde_insight">
        Across all country groups, the highest levels of commodity dependence are concentrated in the <strong className="cdde_insight_bold">most vulnerable economies</strong>.
      </p>

      <div className="alc_chart">
        <div className="alc_threshold_wrap">
          <div className="alc_threshold_label" style={{ left: `${thresholdPct}%` }}>
            60% threshold
          </div>
        </div>

        <div className="alc_bars">
          {data.map((row, idx) => {
            const barPct = (row.avg_pct / MAX_PCT) * 100;
            const isBlue = row.color !== 'green';
            const delay = `${500 + idx * 80}ms`;
            return (
              <div key={row.group} className="alc_row">
                <div className="alc_row_meta">
                  <span className="alc_row_group">{row.group}</span>
                  <span className="alc_row_economies">{row.economies} economies</span>
                </div>
                <div className="alc_bar_track">
                  <div
                    className={`alc_bar${isBlue ? '' : ' alc_bar--green'}`}
                    style={{ width: animated ? `${barPct}%` : '0%', transitionDelay: delay }}
                  />
                  <div className="alc_threshold_line" style={{ left: `${thresholdPct}%` }} />
                </div>
                <span
                  className="alc_row_value"
                  style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.3s ease', transitionDelay: `${500 + idx * 80 + 480}ms` }}
                >
                  {row.avg_pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025).</ChartSource>
    </div>
  );
}
