import { useEffect, useState } from 'react';
import CircleFlag from '../../general/CircleFlag';
import loadFile from '../../../helpers/LoadFile';
import { DEVELOPED } from '../shared/cdde-constants';

import './CountryRankings.css';

const fmtPct = v => `${Number(v).toFixed(1)} per cent`;
const fmtGdpPc = v => `$${Math.round(v).toLocaleString('en-US')}`;
const fmtPop = v => {
  const m = v / 1000;
  return m >= 1000 ? `${(m / 1000).toFixed(2)} billion` : `${m.toFixed(1)} million`;
};
const fmtGdp = v => {
  const b = v / 1000;
  return b >= 1000 ? `$${(b / 1000).toFixed(1)} trillion` : `$${b.toFixed(1)} billion`;
};
const fmtHdi = v => Number(v).toFixed(3);
const fmtMillions = v => {
  const n = Number(v);
  if (n >= 1000) return `$${(n / 1000).toFixed(1)} bn`;
  return `$${Math.round(n)} mn`;
};

const RANK_OPTIONS = [
  {
    key: 'export_dependence',
    label: 'Commodity export dependence',
    colHeader: 'COMMODITY DEPENDENCE',
    unit: 'Per cent, 2022–2024',
    fmt: fmtPct,
    src: 'country'
  },
  {
    key: 'commodity_exports',
    label: 'Commodity exports',
    colHeader: 'COMMODITY EXPORTS',
    unit: 'Millions of dollars, 2022–2024',
    fmt: fmtMillions,
    src: 'additional'
  },
  {
    key: 'leading_commodity',
    label: 'Three leading commodity exports',
    colHeader: 'LEADING COMMODITIES',
    unit: 'Per cent of exports, 2022–2024',
    fmt: fmtPct,
    src: 'stats'
  },
  {
    key: 'food_imports',
    label: 'Food imports',
    colHeader: 'FOOD IMPORTS',
    unit: 'Millions of dollars, 2022–2024',
    fmt: fmtMillions,
    src: 'additional'
  },
  {
    key: 'energy_imports',
    label: 'Energy imports',
    colHeader: 'ENERGY IMPORTS',
    unit: 'Millions of dollars, 2022–2024',
    fmt: fmtMillions,
    src: 'additional'
  },
  {
    key: 'net_food_imports',
    label: 'Net food imports',
    colHeader: 'NET FOOD IMPORTS',
    unit: 'Per cent of merchandise trade, 2022–2024',
    fmt: fmtPct,
    src: 'netImports',
    netKey: 'food_recent'
  },
  {
    key: 'net_energy_imports',
    label: 'Net energy imports',
    colHeader: 'NET ENERGY IMPORTS',
    unit: 'Per cent of merchandise trade, 2022–2024',
    fmt: fmtPct,
    src: 'netImports',
    netKey: 'energy_recent'
  },
  {
    key: 'gdp_per_capita',
    label: 'GDP per capita',
    colHeader: 'GDP PER CAPITA',
    unit: 'Constant 2020 USD',
    fmt: fmtGdpPc,
    src: 'macro'
  },
  {
    key: 'gdp',
    label: 'GDP (total)',
    colHeader: 'GDP TOTAL',
    unit: 'Millions USD, constant 2020',
    fmt: fmtGdp,
    src: 'macro'
  },
  {
    key: 'population',
    label: 'Population',
    colHeader: 'POPULATION',
    unit: 'Thousands, 2024',
    fmt: fmtPop,
    src: 'social'
  },
  {
    key: 'hdi_value',
    label: 'Human Development Index',
    colHeader: 'HDI',
    unit: 'Value (0–1), 2023',
    fmt: fmtHdi,
    src: 'social'
  }
];

const FILTER_OPTIONS = [
  { key: 'all', label: 'All economies' },
  { key: 'developing', label: 'Developing' },
  { key: 'developed', label: 'Developed' }
];

function downloadCSV(rows, opt) {
  const header = ['Rank', 'ISO3', 'Economy', 'Status', 'Region', opt.label].join(',');
  const lines = rows
    .filter(c => c._val != null)
    .map((c, i) => [i + 1, c.iso3, `"${c.name}"`, DEVELOPED.has(c.iso3) ? 'Developed' : 'Developing', c.region, c._val].join(','));
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
  const [macroData, setMacroData] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [additionalData, setAdditionalData] = useState(null);
  const [netImportsData, setNetImportsData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_macro_context.json').then(r => r?.json()).then(d => d && setMacroData(d));
    loadFile('assets/data/cdde_social_context.json').then(r => r?.json()).then(d => d && setSocialData(d));
    loadFile('assets/data/cdde_profile_stats.json').then(r => r?.json()).then(d => d && setStatsData(d));
    loadFile('assets/data/cdde_additional_comparison.json').then(r => r?.json()).then(d => d && setAdditionalData(d));
    loadFile('assets/data/cdde_net_imports.json').then(r => r?.json()).then(d => d && setNetImportsData(d));
  }, []);

  const opt = RANK_OPTIONS.find(o => o.key === rankBy);

  function getVal(c) {
    if (opt.src === 'country') return c.export_dependence ?? null;
    if (opt.src === 'macro') return macroData?.[c.iso3]?.[opt.key] ?? null;
    if (opt.src === 'social') return socialData?.[c.iso3]?.[opt.key] ?? null;
    if (opt.src === 'stats') return statsData?.[c.iso3]?.[opt.key] ?? null;
    if (opt.src === 'additional') return additionalData?.[c.iso3]?.[opt.key] ?? null;
    if (opt.src === 'netImports') return netImportsData?.[c.iso3]?.[opt.netKey] ?? null;
    return null;
  }

  const base = countries || [];
  const pool = groupFilter === 'developed'
    ? base.filter(c => DEVELOPED.has(c.iso3))
    : groupFilter === 'developing'
      ? base.filter(c => !DEVELOPED.has(c.iso3))
      : base;

  const withVals = pool.map(c => ({ ...c, _val: getVal(c) }));
  const sorted = [...withVals].sort((a, b) => {
    if (a._val == null && b._val == null) return 0;
    if (a._val == null) return 1;
    if (b._val == null) return -1;
    return b._val - a._val;
  });
  const maxVal = sorted.find(c => c._val != null)?._val ?? 1;

  const dataLoaded = opt.src === 'country'
    || (opt.src === 'macro' && macroData)
    || (opt.src === 'social' && socialData)
    || (opt.src === 'stats' && statsData)
    || (opt.src === 'additional' && additionalData)
    || (opt.src === 'netImports' && netImportsData);

  return (
    <div className="rt_wrap">
      {(!countries || !dataLoaded) && <div className="cdde_loading" style={{ height: 400 }} />}
      {countries && dataLoaded && (<>
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
          <div className="cdde_legend_row rt_legend">
            <span className="cdde_legend_item">
              <span className="cdde_legend_dot" style={{ background: 'var(--un-color-blue)' }} />
              Developed
            </span>
            <span className="cdde_legend_item">
              <span className="cdde_legend_dot" style={{ background: 'var(--un-color-yellow)' }} />
              Developing
            </span>
          </div>
          <button type="button" className="rt_csv_btn" onClick={() => downloadCSV(sorted, opt)}>
            ↓ .csv
          </button>
        </div>
      </div>

      {/* ── Unit line ── */}
      <p className="rt_unit">{opt.unit}</p>

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
          const pct = maxVal > 0 && c._val != null ? (c._val / maxVal) * 100 : 0;
          return (
            <div key={c.iso3} className={`rt_row${c._val == null ? ' rt_row--nodata' : ''}`}>
              <span className={`rt_rank${i < 10 && c._val != null ? ' rt_rank--top' : ''}`}>
                {c._val != null ? i + 1 : '–'}
              </span>

              <div className="rt_economy">
                <CircleFlag countryCode={c.iso2} width={22} height={22} />
                <span className="rt_name">{c.name}</span>
              </div>

              <div className="rt_group">
                <span className={`rt_pill rt_pill--${dev ? 'dev' : 'devg'}`}>{dev ? 'DEVELOPED' : 'DEVELOPING'}</span>
                <span className="rt_region">· {c.region}</span>
              </div>

              <div className="rt_bar_col">
                {c._val != null && (
                  <div className="rt_bar_track">
                    <div
                      className="rt_bar_fill"
                      style={{
                        '--rt-bar-pct': `${pct}%`,
                        animationDelay: `${i * 8}ms`,
                        background: barColor
                      }}
                    />
                  </div>
                )}
              </div>

              <span className="rt_val">{c._val != null ? opt.fmt(c._val) : '–'}</span>
            </div>
          );
        })}
      </div>
      </>)}
    </div>
  );
}
