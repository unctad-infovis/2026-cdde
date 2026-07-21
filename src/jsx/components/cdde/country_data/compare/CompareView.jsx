import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import { useEffect, useRef, useState } from 'react';
import CircleFlag from '@unctad-infovis/general-tools/components/CircleFlag.jsx';
import ChartHeader from '../../shared/ChartHeader';
import CountrySearch from '../../shared/CountrySearch';
import { GROUP_COLORS } from '../../shared/cdde-constants';
import StackedBar from '../../shared/StackedBar';

import './CompareView.css';

const SLOTS = [
  { bg: 'linear-gradient(135deg, #1a2d4a 0%, #2a5878 100%)', bar: '#009edb' },
  { bg: 'linear-gradient(135deg, #6a3c00 0%, #b07010 100%)', bar: '#009edb' },
  { bg: 'linear-gradient(135deg, #174d17 0%, #32803a 100%)', bar: '#009edb' }
];

const DNA_COLORS = {
  agri: GROUP_COLORS.agri,
  energy: GROUP_COLORS.energy,
  mining: GROUP_COLORS.mining,
  other: GROUP_COLORS['non-dependent']
};

const GROUP_INFO = {
  agri: { label: 'Agricultural', icon: '🌾' },
  energy: { label: 'Energy', icon: '⚡' },
  mining: { label: 'Mining', icon: '⛏' },
  'non-dependent': { label: 'Non-commodity', icon: '●' }
};

function fmtMillions(v) {
  const n = Number(v);
  if (n >= 1000) return `$${(n / 1000).toFixed(1)} billion`;
  return `$${Math.round(n)} million`;
}

const ROWS = [
  {
    key: 'commodity_exports',
    label: 'Commodity exports',
    desc: 'Dollars, 2022–2024',
    fmt: fmtMillions
  },
  {
    key: 'leading_commodity',
    label: 'Three leading commodity exports',
    desc: 'Per cent of total exports, 2022–2024',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'leading_market',
    label: 'Top 3 destination markets',
    desc: 'Per cent of total merchandise exports, 2022–2024',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'food_imports',
    label: 'Food imports',
    desc: 'Dollars, 2022–2024',
    fmt: fmtMillions
  },
  {
    key: 'energy_imports',
    label: 'Energy imports',
    desc: 'Dollars, 2022–2024',
    fmt: fmtMillions
  },
  {
    key: 'net_food_imports',
    label: 'Net food imports',
    desc: 'Per cent of merchandise trade, 2022–2024',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'net_energy_imports',
    label: 'Net energy imports',
    desc: 'Per cent of merchandise trade, 2022–2024',
    fmt: v => `${Number(v).toFixed(1)} per cent`
  },
  {
    key: 'gdp_per_capita',
    label: 'GDP per capita',
    desc: 'Constant 2020 USD',
    fmt: v => `$${Math.round(v).toLocaleString('en-US').replace(/,/g, ' ')}`
  },
  {
    key: 'population_m',
    label: 'Population',
    desc: '2024',
    fmt: v => {
      const m = Number(v);
      if (m < 0.1) return `${Math.round(m * 1000)} thousand`;
      return `${m.toFixed(1)} million`;
    }
  },
  {
    key: 'hdi_value',
    label: 'Human Development Index',
    desc: 'Value (0–1), 2023',
    fmt: v => Number(v).toFixed(3)
  },
  {
    key: 'dominant_group',
    label: 'Dominant commodity group',
    desc: 'Largest export category, 2022–2024',
    fmt: null
  }
];

export default function CompareView({ compareList, countries, onCompareChange, dnaTitle, dnaSubtitle, dnaDescription }) {
  const tablePanelRef = useRef(null);
  const [groupData, setGroupData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [macroData, setMacroData] = useState(null);
  const [socialData, setSocialData] = useState(null);
  const [additionalData, setAdditionalData] = useState(null);
  const [netImportsData, setNetImportsData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_export_composition.json')
      .then(r => r?.json())
      .then(d => d && setGroupData(d));
    loadFile('assets/data/cdde_profile_stats.json')
      .then(r => r?.json())
      .then(d => d && setStatsData(d));
    loadFile('assets/data/cdde_macro_context.json')
      .then(r => r?.json())
      .then(d => d && setMacroData(d));
    loadFile('assets/data/cdde_social_context.json')
      .then(r => r?.json())
      .then(d => d && setSocialData(d));
    loadFile('assets/data/cdde_ranking_indicators.json')
      .then(r => r?.json())
      .then(d => d && setAdditionalData(d));
    loadFile('assets/data/cdde_net_imports.json')
      .then(r => r?.json())
      .then(d => d && setNetImportsData(d));
  }, []);

  useEffect(() => {
    const el = tablePanelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        el.classList.add('cv_panel--revealed');
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function getMerged(iso3) {
    const s = statsData?.[iso3] ?? {};
    const m = macroData?.[iso3] ?? {};
    const soc = socialData?.[iso3] ?? {};
    const add = additionalData?.[iso3] ?? {};
    const net = netImportsData?.[iso3] ?? {};
    return {
      leading_commodity: s.leading_commodity ?? null,
      leading_market: s.leading_market ?? null,
      gdp_per_capita: m.gdp_per_capita ?? null,
      population_m: soc.population != null ? soc.population / 1000 : null,
      hdi_value: soc.hdi_value ?? null,
      commodity_exports: add.commodity_exports || null,
      food_imports: add.food_imports || null,
      energy_imports: add.energy_imports || null,
      net_food_imports: net.food_recent ?? null,
      net_energy_imports: net.energy_recent ?? null
    };
  }

  const slots = compareList.map((iso3, i) => ({
    country: iso3 ? (countries || []).find(c => c.iso3 === iso3) : null,
    slot: SLOTS[i],
    i
  }));

  const handleChange = (idx, iso3) => {
    const next = [...compareList];
    next[idx] = iso3 || null;
    onCompareChange(next);
  };

  return (
    <div className="cv_wrap">
      {/* ── 3 country header cards ── */}
      <div className="cv_cards">
        {slots.map(({ country, slot, i }) => (
          <div key={i} className="cv_card" style={{ background: slot.bg }}>
            {country && (
              <div className="cv_card_flag">
                <CircleFlag countryCode={country.iso2} width={44} height={44} />
              </div>
            )}
            <div className="cv_card_search">
              <CountrySearch countries={countries} value={compareList[i]} onChange={iso3 => handleChange(i, iso3)} placeholder="Select economy…" />
            </div>
            {country && (
              <>
                <p className="cv_card_meta">{country.region}</p>
                <div className="cv_card_pct">{country.export_dependence != null ? `${country.export_dependence.toFixed(1)}%` : 'No data'}</div>
                <p className="cv_card_dep_label">COMMODITY EXPORT DEPENDENCE</p>
              </>
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
            ['mining', 'Mining'],
            ['non-dependent', 'Other / non-commodity']
          ].map(([k, l]) => (
            <div key={k} className="cv_dna_leg_item">
              <span className="cv_dna_leg_dot" data-group={k} />
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
                  <span className="cv_dna_cname">{country.name}</span>
                  <CircleFlag countryCode={country.iso2} width={22} height={22} />
                </div>
                {d ? (
                  <StackedBar
                    height={40}
                    showLegend={false}
                    segments={[
                      { key: 'agri', label: 'Agricultural', color: DNA_COLORS.agri, pct: d.agri },
                      { key: 'energy', label: 'Energy', color: DNA_COLORS.energy, pct: d.energy },
                      { key: 'mining', label: 'Mining', color: DNA_COLORS.mining, pct: d.mining },
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
      <div className="cv_panel" ref={tablePanelRef}>
        <div className="cv_tbl_hdr">
          <div className="cv_tbl_hdr_ind">INDICATOR</div>
          {slots.map(({ country, _slot, i }) => (
            <div key={i} className="cv_tbl_hdr_col">
              {country && (
                <>
                  <CircleFlag countryCode={country.iso2} width={20} height={20} />
                  <span className="cv_tbl_hdr_name">{country.name.toUpperCase()}</span>
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
          const maxNum = nums.length ? Math.max(...nums) : 0;

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
                      {country?.name && <span className="cv_val_country_label">{country.name}</span>}
                      {g ? (
                        <div className="cv_group_cell">
                          <span className="cv_group_icon" data-group={val}>
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
                    {country?.name && <span className="cv_val_country_label">{country.name}</span>}
                    {val != null ? (
                      <>
                        <div className="cv_val_row">
                          <span className="cv_val_num">{row.fmt(val)}</span>
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
