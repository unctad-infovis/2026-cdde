import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import CSVtoJSON from '../../../helpers/CsvToJson';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './DependenceByLevel.css';

const THRESHOLD = 60;
const MAX_PCT = 100;

export default function DependenceByLevel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_by_level.csv')
      .then(r => r?.text())
      .then(text => {
        if (!text) return;
        const rows = CSVtoJSON(text).filter(r => r.group);
        setData(rows.map(r => ({
          group:     r.group,
          economies: +r.economies,
          avg_pct:   +r.avg_pct,
          color:     r.group === 'Developed' ? 'green' : 'blue',
        })));
      });
  }, []);

  if (!data) return <div className="alc_loading" />;

  const thresholdPct = (THRESHOLD / MAX_PCT) * 100;

  return (
    <div className="alc_container">
      <ChartHeader
        title="Average dependence by development level"
        subtitle="Mean commodity export share across economies, 2022–2024"
      />

      <p className="alc_insight">
        Across all country groups, the highest levels of commodity dependence are concentrated in the{' '}
        <strong className="alc_insight_bold">most vulnerable economies</strong>.
      </p>

      <div className="alc_chart">
        <div className="alc_threshold_label" style={{ left: `${thresholdPct}%` }}>
          60% threshold
        </div>

        <div className="alc_bars">
          {data.map(row => {
            const barPct = (row.avg_pct / MAX_PCT) * 100;
            const isBlue = row.color !== 'green';
            return (
              <div key={row.group} className="alc_row">
                <div className="alc_row_meta">
                  <span className="alc_row_group">{row.group}</span>
                  <span className="alc_row_economies">{row.economies} economies</span>
                </div>
                <div className="alc_bar_track">
                  <div
                    className={`alc_bar${isBlue ? '' : ' alc_bar--green'}`}
                    style={{ width: `${barPct}%` }}
                  />
                  {/* Threshold line overlay */}
                  <div className="alc_threshold_line" style={{ left: `${thresholdPct}%` }} />
                </div>
                <span className="alc_row_value">{row.avg_pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). LDC: least developed countries. LLDC: landlocked developing countries. SIDS: small island developing States.</ChartSource>
    </div>
  );
}
