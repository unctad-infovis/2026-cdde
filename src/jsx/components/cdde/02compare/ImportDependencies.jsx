import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './ImportDependencies.css';

function StatusBadge({ status }) {
  const isExporter = status === 'net_exporter';
  return <span className={`imd_badge${isExporter ? ' imd_badge--exporter' : ' imd_badge--importer'}`}>{isExporter ? 'Net exporter' : 'Net importer'}</span>;
}

export default function ImportDependencies({ iso3 }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_import_deps.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setAllData(d);
      });
  }, []);

  const d = allData?.[iso3] ?? null;

  return (
    <div className="imd_card">
      <ChartHeader title="Import dependencies" subtitle="Share of total merchandise imports · 2022–2024" />

      <div className="imd_body">
        {!allData && <div className="imd_loading" />}

        {allData && !d && <p className="imd_no_data">Import dependency data not available for this country.</p>}

        {d && (
          <>
            <div className="imd_row">
              <div className="imd_row_header">
                <span className="imd_row_label">Food imports</span>
                <StatusBadge status={d.food_status} />
              </div>
              <div className="imd_bar_line">
                <div className="imd_track">
                  <div className="imd_fill imd_fill--food" style={{ width: `${d.food_pct}%` }} />
                </div>
                <span className="imd_pct">{d.food_pct}%</span>
                <span className="imd_val">{d.food_val}</span>
              </div>
            </div>

            <div className="imd_row">
              <div className="imd_row_header">
                <span className="imd_row_label">Energy imports</span>
                <StatusBadge status={d.energy_status} />
              </div>
              <div className="imd_bar_line">
                <div className="imd_track">
                  <div className="imd_fill imd_fill--energy" style={{ width: `${d.energy_pct}%` }} />
                </div>
                <span className="imd_pct">{d.energy_pct}%</span>
                <span className="imd_val">{d.energy_val}</span>
              </div>
            </div>

            <div className="imd_total">
              <span className="imd_total_label">Total commodity imports</span>
              <span className="imd_total_val">{d.total_imports}</span>
            </div>
          </>
        )}
      </div>

      <ChartSource>UNCTADstat (2025).</ChartSource>
    </div>
  );
}
