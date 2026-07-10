import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import CircleFlag from '../../general/CircleFlag';
import ChartHeader from '../shared/ChartHeader';
import StackedBar from '../shared/StackedBar';

import './CompareView.css';

const SLOTS = [
  { bg: 'linear-gradient(135deg, #1a2d4a 0%, #2a5878 100%)', bar: '#009edb' },
  { bg: 'linear-gradient(135deg, #6a3c00 0%, #b07010 100%)', bar: '#fbaf17' },
  { bg: 'linear-gradient(135deg, #174d17 0%, #32803a 100%)', bar: '#72bf44' }
];

const DNA_COLORS = {
  agri: '#72bf44',
  energy: '#a05fb4',
  mining: '#fbaf17',
  other: '#cccccc'
};

const GROUP_INFO = {
  agri: { label: 'Agricultural', icon: '🌾' },
  energy: { label: 'Energy', icon: '⚡' },
  mining: { label: 'Mining & metals', icon: '⛏' },
  'non-dependent': { label: 'Non-commodity', icon: '●' }
};

const ROWS = [
  {
    key: 'commodity_dependence',
    label: 'Commodity export dependence',
    desc: 'Per cent of merchandise exports, 2022–2024',
    star: 'min',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'leading_commodity',
    label: 'Three leading commodity exports',
    desc: 'Per cent of total exports, 2022–2024',
    star: 'min',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'leading_market',
    label: 'Top 3 destination markets',
    desc: 'Per cent of total merchandise exports, 2022–2024',
    star: 'min',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'gdp_per_capita',
    label: 'GDP per capita',
    desc: 'Constant 2015 USD',
    star: 'max',
    fmt: v => `$${Math.round(v).toLocaleString('en-US')}`
  },
  {
    key: 'population_m',
    label: 'Population',
    desc: 'Millions, 2024',
    star: null,
    fmt: v => `${Number(v).toFixed(1)} million`
  },
  {
    key: 'hdi_value',
    label: 'Human Development Index',
    desc: 'Value (0–1), 2023',
    star: 'max',
    fmt: v => Number(v).toFixed(3)
  },
  {
    key: 'dominant_group',
    label: 'Dominant commodity group',
    desc: 'Largest export category, 2022–2024',
    star: null,
    fmt: null
  }
];

export default function CompareView({ compareList, countries, dnaTitle, dnaSubtitle, dnaDescription }) {
  const [groupData, setGroupData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [macroData, setMacroData] = useState(null);
  const [socialData, setSocialData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_group_breakdown.json').then(r => r?.json()).then(d => d && setGroupData(d));
    loadFile('assets/data/cdde_profile_stats.json').then(r => r?.json()).then(d => d && setStatsData(d));
    loadFile('assets/data/cdde_macro_context.json').then(r => r?.json()).then(d => d && setMacroData(d));
    loadFile('assets/data/cdde_social_context.json').then(r => r?.json()).then(d => d && setSocialData(d));
  }, []);

  function getMerged(iso3) {
    const s = statsData?.[iso3] ?? {};
    const m = macroData?.[iso3] ?? {};
    const soc = socialData?.[iso3] ?? {};
    return {
      commodity_dependence: s.commodity_dependence ?? null,
      leading_commodity: s.leading_commodity ?? null,
      leading_market: s.leading_market ?? null,
      gdp_per_capita: m.gdp_per_capita ?? null,
      population_m: soc.population != null ? soc.population / 1000 : null,
      hdi_value: soc.hdi_value ?? null,
    };
  }

  const slots = compareList.map((iso3, i) => ({
    country: iso3 ? (countries || []).find(c => c.iso3 === iso3) : null,
    slot: SLOTS[i],
    i
  }));

  if (!slots.some(s => s.country)) return null;

  return (
    <div className="cv_wrap">
      {/* ── 3 country header cards ── */}
      <div className="cv_cards">
        {slots.map(({ country, slot, i }) => (
          <div key={i} className="cv_card" style={{ background: slot.bg }}>
            {country ? (
              <>
                <div className="cv_card_flag">
                  <CircleFlag countryCode={country.iso2} width={44} height={44} />
                </div>
                <h3 className="cv_card_name">{country.name}</h3>
                <p className="cv_card_meta">
                  {country.region}
                </p>
                <div className="cv_card_pct">{country.export_dependence.toFixed(1)}%</div>
                <p className="cv_card_dep_label">COMMODITY EXPORT DEPENDENCE</p>
              </>
            ) : (
              <p className="cv_card_placeholder">Select a country above</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Commodity DNA ── */}
      <div className="cv_panel">
        <ChartHeader title={dnaTitle} subtitle={dnaSubtitle} description={dnaDescription} />

        <div className="cv_dna_legend">
          {[
            ['agri', 'Agricultural'],
            ['energy', 'Energy'],
            ['mining', 'Mining & metals'],
            ['other', 'Other / non-commodity']
          ].map(([k, l]) => (
            <div key={k} className="cv_dna_leg_item">
              <span className="cv_dna_leg_dot" style={{ background: DNA_COLORS[k] }} />
              <span className="cv_dna_leg_lbl">{l}</span>
            </div>
          ))}
        </div>

        <div className="cv_dna_rows">
          {slots.map(({ country, i }) => {
            if (!country) return null;
            const d = groupData?.[country.iso3];
            return (
              <div key={i} className="cv_dna_row">
                <div className="cv_dna_flag_name">
                  <CircleFlag countryCode={country.iso2} width={22} height={22} />
                  <span className="cv_dna_cname">{country.name}</span>
                </div>
                {d ? (
                  <StackedBar
                    showLegend={false}
                    height={34}
                    segments={[
                      { key: 'agri', label: 'Agricultural', color: DNA_COLORS.agri, pct: d.agri },
                      { key: 'energy', label: 'Energy', color: DNA_COLORS.energy, pct: d.energy },
                      { key: 'mining', label: 'Mining & metals', color: DNA_COLORS.mining, pct: d.mining },
                      { key: 'other', label: 'Other', color: DNA_COLORS.other, pct: d.other }
                    ]}
                  />
                ) : (
                  <div className="cv_dna_bar cv_dna_bar--empty">
                    <span className="cv_dna_nodata">No breakdown available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Indicator table ── */}
      <div className="cv_panel">
        <div className="cv_tbl_hdr">
          <div className="cv_tbl_hdr_ind">INDICATOR</div>
          {slots.map(({ country, slot, i }) => (
            <div key={i} className="cv_tbl_hdr_col">
              {country && (
                <>
                  <CircleFlag countryCode={country.iso2} width={20} height={20} />
                  <span className="cv_tbl_hdr_name" style={{ color: slot.bar }}>
                    {country.name.toUpperCase()}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {ROWS.map(row => {
          const vals = slots.map(({ country }) => {
            if (!country) return null;
            if (row.key === 'dominant_group') return country.dominant_group ?? null;
            return getMerged(country.iso3)[row.key] ?? null;
          });

          const nums = vals.map(v => (v != null && row.fmt !== null ? parseFloat(v) || 0 : 0));
          const positives = nums.filter(n => n > 0);
          const maxNum = positives.length ? Math.max(...nums) : 0;

          let starIdx = -1;
          if (row.star === 'min' && positives.length) {
            const minVal = Math.min(...positives);
            starIdx = nums.indexOf(minVal);
          } else if (row.star === 'max' && positives.length) {
            starIdx = nums.indexOf(maxNum);
          }

          return (
            <div key={row.key} className="cv_tbl_row">
              <div className="cv_tbl_ind">
                <span className="cv_tbl_ind_label">{row.label}</span>
                <span className="cv_tbl_ind_desc">{row.desc}</span>
              </div>

              {slots.map(({ country, slot, i }) => {
                const val = vals[i];

                if (row.fmt === null) {
                  const g = GROUP_INFO[val] || null;
                  return (
                    <div key={i} className="cv_tbl_val">
                      {g ? (
                        <div className="cv_group_cell">
                          <span className="cv_group_icon" style={{ background: slot.bar }}>
                            {g.icon}
                          </span>
                          <span className="cv_group_lbl">{g.label}</span>
                        </div>
                      ) : (
                        <span className="cv_tbl_empty">–</span>
                      )}
                    </div>
                  );
                }

                const num = nums[i];
                const barPct = maxNum > 0 ? (num / maxNum) * 100 : 0;

                return (
                  <div key={i} className="cv_tbl_val">
                    {val != null ? (
                      <>
                        <div className="cv_val_row">
                          <span className="cv_val_num">{row.fmt(val)}</span>
                          {i === starIdx && <span className="cv_star">★</span>}
                        </div>
                        <div className="cv_bar_track">
                          <div className="cv_bar_fill" style={{ width: `${barPct}%`, background: slot.bar }} />
                        </div>
                      </>
                    ) : (
                      <span className="cv_tbl_empty">–</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
