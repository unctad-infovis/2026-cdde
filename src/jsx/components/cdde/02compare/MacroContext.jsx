import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import StackedBar from '../shared/StackedBar';

import './MacroContext.css';

const VA_SEGS = key => ({
  agri:     { key: 'agri',     label: 'Agriculture', color: 'var(--un-color-green)' },
  industry: { key: 'industry', label: 'Industry',    color: 'var(--un-color-yellow)' },
  services: { key: 'services', label: 'Services',    color: 'var(--un-color-blue)' },
}[key]);

export default function MacroContext({ iso3, hhi }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_macro.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;

  return (
    <div className="cdde_card">
      <ChartHeader
        title="Macro context"
        subtitle="Economic structure and resource dependence"
      />

      <div className="mac_body">
        {!allData && <div className="cdde_loading" style={{ height: 160 }} />}

        {allData && !d && (
          <p className="cdde_no_data">Macro data not available for this country.</p>
        )}

        {d && (
          <>
            {/* GDP growth */}
            <div className="mac_gdp_row">
              <div className="mac_gdp_block">
                <span className="cdde_section_label">AVG GDP GROWTH</span>
                <div className="mac_gdp_val_row">
                  <span className={`mac_triangle mac_triangle--${d.gdp_growth >= 0 ? 'up' : 'down'}`}>
                    {d.gdp_growth >= 0 ? '▲' : '▼'}
                  </span>
                  <span className="mac_gdp_pct">{Math.abs(d.gdp_growth).toFixed(1)}%</span>
                </div>
                <span className="mac_gdp_note">Annual avg. 2014–2024</span>
              </div>
            </div>

            {/* Value added composition */}
            <div className="mac_section">
              <span className="cdde_section_label">VALUE ADDED COMPOSITION</span>
              <StackedBar
                segments={['agri', 'industry', 'services'].map(k => ({
                  ...VA_SEGS(k),
                  pct: d.value_added[k],
                }))}
              />
            </div>

            {/* Small bars */}
            <div className="cdde_small_bars">
              <div className="cdde_small_row">
                <span className="cdde_small_label">TOTAL NATURAL RESOURCE RENTS</span>
                <div className="cdde_small_track">
                  <div className="cdde_small_fill" style={{ width: `${Math.min(d.nat_resource_rents, 50) * 2}%`, background: 'var(--un-color-yellow)' }} />
                </div>
                <span className="cdde_small_pct">{d.nat_resource_rents}%</span>
              </div>
              <div className="cdde_small_row">
                <span className="cdde_small_label">EXPORT CONCENTRATION (HHI)</span>
                <div className="cdde_small_track">
                  <div className="cdde_small_fill" style={{ width: hhi != null ? `${Math.min(hhi, 1) * 100}%` : '0%', background: 'var(--un-color-blue)' }} />
                </div>
                <span className="cdde_small_pct">{hhi != null ? Number(hhi).toFixed(2) : '–'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <ChartSource>UNCTADstat (2025) · World Bank WDI (2025).</ChartSource>
    </div>
  );
}
