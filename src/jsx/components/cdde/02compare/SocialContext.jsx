import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import StackedBar from '../shared/StackedBar';

import './SocialContext.css';

const EMP_SEGS = [
  { key: 'agri',     label: 'Agriculture', color: 'var(--un-color-green)' },
  { key: 'industry', label: 'Industry',    color: 'var(--un-color-yellow)' },
  { key: 'services', label: 'Services',    color: 'var(--un-color-blue)' },
];

function hdiCategory(hdi) {
  if (hdi >= 0.800) return 'Very high';
  if (hdi >= 0.700) return 'High';
  if (hdi >= 0.550) return 'Medium';
  return 'Low';
}

function hdiMarkerPct(hdi) {
  return Math.max(0, Math.min(100, (hdi - 0.200) / 0.800 * 100));
}

export default function SocialContext({ iso3 }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_social.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;

  return (
    <div className="cdde_card">
      <ChartHeader
        title="Social context"
        subtitle="Human development and labour market indicators"
      />

      <div className="soc_body">
        {!allData && <div className="cdde_loading" style={{ height: 200 }} />}

        {allData && !d && (
          <p className="cdde_no_data">Social data not available for this country.</p>
        )}

        {d && (
          <>
            {/* HDI */}
            <div className="soc_section">
              <div className="soc_hdi_header">
                <span className="cdde_section_label">HUMAN DEVELOPMENT INDEX</span>
                <div className="soc_hdi_vals">
                  <span className="soc_hdi_num">{d.hdi.toFixed(3)}</span>
                  <span className="soc_hdi_cat">{hdiCategory(d.hdi)}</span>
                  <span className="soc_hdi_rank">Rank {d.hdi_rank}</span>
                </div>
              </div>
              <div className="soc_hdi_track">
                <div className="soc_hdi_gradient" style={{ background: 'linear-gradient(to right, #d73027, #fc8d59, #fee08b, #91cf60, #1a9850)' }} />
                <div className="soc_hdi_marker" style={{ left: `${hdiMarkerPct(d.hdi)}%` }} />
              </div>
              <div className="soc_hdi_axis">
                <span>Low</span><span>Medium</span><span>High</span><span>Very high</span>
              </div>
            </div>

            {/* Employment by sector */}
            <div className="soc_section">
              <span className="cdde_section_label">EMPLOYMENT BY SECTOR</span>
              <StackedBar
                segments={EMP_SEGS.map(s => ({ ...s, pct: d.emp_sector[s.key] }))}
              />
            </div>

            {/* Small bars */}
            <div className="cdde_small_bars">
              <div className="cdde_small_row">
                <span className="cdde_small_label">POVERTY &lt;$2.15/DAY</span>
                <div className="cdde_small_track">
                  <div className="cdde_small_fill" style={{ width: `${Math.min(d.poverty_pct, 100)}%`, background: 'var(--un-color-red-dark)' }} />
                </div>
                <span className="cdde_small_pct">{d.poverty_pct}%</span>
              </div>
              <div className="cdde_small_row">
                <span className="cdde_small_label">GINI INDEX</span>
                <div className="cdde_small_track">
                  <div className="cdde_small_fill" style={{ width: `${d.gini}%`, background: 'var(--un-color-yellow)' }} />
                </div>
                <span className="cdde_small_pct">{d.gini}</span>
              </div>
              <div className="cdde_small_row">
                <span className="cdde_small_label">EMPLOYMENT-TO-POPULATION RATIO</span>
                <div className="cdde_small_track">
                  <div className="cdde_small_fill" style={{ width: `${d.emp_pop_ratio}%`, background: 'var(--un-color-blue)' }} />
                </div>
                <span className="cdde_small_pct">{d.emp_pop_ratio}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      <ChartSource>UNDP HDR (2024) · World Bank WDI (2025) · UNDESA SDG indicators.</ChartSource>
    </div>
  );
}
