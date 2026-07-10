import { useState } from 'react';
import CircleFlag from '../../general/CircleFlag';
import { DEVELOPED } from '../shared/cdde-constants';

import './CountryRankings.css';

const RANK_OPTIONS = [
  { key: 'export_dependence', label: 'Commodity export dependence (%)', colHeader: 'COMMODITY DEPENDENCE', fmt: v => `${Number(v).toFixed(1)}%` },
  { key: 'hhi', label: 'Export concentration (HHI)', colHeader: 'EXPORT CONCENTRATION', fmt: v => Number(v).toFixed(2) },
  { key: 'merchandise_exports', label: 'Merchandise exports', colHeader: 'MERCHANDISE EXPORTS', fmt: v => String(v) },
  { key: 'gdp_per_capita', label: 'GDP per capita', colHeader: 'GDP PER CAPITA', fmt: v => String(v) },
  { key: 'population', label: 'Population', colHeader: 'POPULATION', fmt: v => String(v) }
];

const FILTER_OPTIONS = [
  { key: 'all', label: 'All economies' },
  { key: 'developing', label: 'Developing' },
  { key: 'developed', label: 'Developed' }
];

function parseVal(v) {
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[$,\s]/g, '');
  const n = parseFloat(s);
  if (/B$/i.test(s)) return n * 1e9;
  if (/M$/i.test(s)) return n * 1e6;
  if (/K$/i.test(s)) return n * 1e3;
  return n || 0;
}

function downloadCSV(rows, opt) {
  const header = ['Rank', 'ISO3', 'Economy', 'Status', 'Region', opt.label].join(',');
  const lines = rows.map((c, i) => [i + 1, c.iso3, `"${c.name}"`, DEVELOPED.has(c.iso3) ? 'Developed' : 'Developing', c.region, c[opt.key]].join(','));
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `cdde_ranking_${opt.key}.csv`
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function CountryRankings({ countries }) {
  const [rankBy, setRankBy] = useState('export_dependence');
  const [groupFilter, setGroupFilter] = useState('all');

  const opt = RANK_OPTIONS.find(o => o.key === rankBy);

  // Compute directly — no useMemo closure issues, 193 rows sorts in <1ms
  const base = countries || [];
  const pool = groupFilter === 'developed' ? base.filter(c => DEVELOPED.has(c.iso3)) : groupFilter === 'developing' ? base.filter(c => !DEVELOPED.has(c.iso3)) : base;
  const sorted = [...pool].sort((a, b) => parseVal(b[rankBy]) - parseVal(a[rankBy]));
  const maxVal = sorted.length ? parseVal(sorted[0][rankBy]) : 1;

  if (!countries) return <div className="cdde_loading" style={{ height: 400 }} />;

  return (
    <div className="rt_wrap">
      {/* ── Controls ── */}
      <div className="rt_controls">
        <div className="rt_controls_left">
          <span className="rt_ctrl_label">RANK BY</span>
          <div className="rt_select_wrap">
            <select className="rt_select" value={rankBy} onChange={e => setRankBy(e.target.value)}>
              {RANK_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg className="rt_chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <span className="rt_ctrl_label">FILTER</span>
          <div className="rt_select_wrap">
            <select className="rt_select" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              {FILTER_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg className="rt_chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="rt_controls_right">
          <div className="rt_legend">
            <span className="rt_legend_dot rt_legend_dot--dev" />
            <span className="rt_legend_lbl">Developed</span>
            <span className="rt_legend_dot rt_legend_dot--devg" />
            <span className="rt_legend_lbl">Developing</span>
          </div>
          <button type="button" className="rt_csv_btn" onClick={() => downloadCSV(sorted, opt)}>
            ↓ .csv
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rt_table">
        <div className="rt_thead">
          <span className="rt_th rt_th--rank">#</span>
          <span className="rt_th rt_th--economy">ECONOMY</span>
          <span className="rt_th rt_th--group">GROUP</span>
          <span className="rt_th rt_th--bar">{opt.colHeader}</span>
          <span className="rt_th rt_th--val">VALUE</span>
        </div>

        {sorted.map((c, i) => {
          const dev = DEVELOPED.has(c.iso3);
          const barColor = dev ? 'var(--un-color-blue)' : 'var(--un-color-yellow)';
          const pct = maxVal > 0 ? (parseVal(c[rankBy]) / maxVal) * 100 : 0;
          return (
            <div key={c.iso3} className="rt_row">
              <span className={`rt_rank${i < 10 ? ' rt_rank--top' : ''}`}>{i + 1}</span>

              <div className="rt_economy">
                <CircleFlag countryCode={c.iso2} width={22} height={22} />
                <span className="rt_name">{c.name}</span>
              </div>

              <div className="rt_group">
                <span className={`rt_pill rt_pill--${dev ? 'dev' : 'devg'}`}>{dev ? 'DEVELOPED' : 'DEVELOPING'}</span>
                <span className="rt_region">· {c.region}</span>
              </div>

              <div className="rt_bar_col">
                <div className="rt_bar_track">
                  <div className="rt_bar_fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>

              <span className="rt_val">{opt.fmt(c[rankBy])}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
