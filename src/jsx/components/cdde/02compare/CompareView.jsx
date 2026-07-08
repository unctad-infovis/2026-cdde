import { useEffect, useState } from 'react';
import CircleFlag from '../../general/CircleFlag';
import loadFile from '../../../helpers/LoadFile';
import StackedBar from '../shared/StackedBar';

import './CompareView.css';

// Per-slot visual identity (card gradient bg + bar/text accent color)
const SLOTS = [
  { bg: 'linear-gradient(135deg, #1a2d4a 0%, #2a5878 100%)', bar: '#009edb' },
  { bg: 'linear-gradient(135deg, #6a3c00 0%, #b07010 100%)', bar: '#fbaf17' },
  { bg: 'linear-gradient(135deg, #174d17 0%, #32803a 100%)', bar: '#72bf44' },
];

const DNA_COLORS = {
  agri:   '#72bf44',
  energy: '#009edb',
  mining: '#fbaf17',
  other:  '#cccccc',
};

const GROUP_INFO = {
  agri:           { label: 'Agricultural',    icon: '🌾' },
  energy:         { label: 'Energy',          icon: '⚡' },
  mining:         { label: 'Mining & metals', icon: '⛏' },
  'non-dependent':{ label: 'Non-commodity',   icon: '●'  },
};

// Rows for the indicator table
const ROWS = [
  {
    key: 'export_dependence',
    label: 'Commodity export dependence',
    desc: '% of merchandise exports, 2022–24',
    star: 'min',
    fmt: v => `${Number(v).toFixed(1)}%`,
  },
  {
    key: 'merchandise_exports',
    label: 'Merchandise exports',
    desc: 'Millions of dollars, 2022–24 average',
    star: 'max',
    fmt: v => String(v),
  },
  {
    key: 'hhi',
    label: 'Export concentration (HHI)',
    desc: '0 = diversified, 1 = concentrated',
    star: 'min',
    fmt: v => Number(v).toFixed(2),
  },
  {
    key: 'gdp_per_capita',
    label: 'GDP per capita',
    desc: 'Constant 2015 dollars',
    star: 'max',
    fmt: v => String(v),
  },
  {
    key: 'population',
    label: 'Population',
    desc: 'Millions, mid-2023 estimate',
    star: null,
    fmt: v => String(v),
  },
  {
    key: 'dominant_group',
    label: 'Dominant commodity group',
    desc: 'Largest export category',
    star: null,
    fmt: null, // special render
  },
];

function parseNum(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  return parseFloat(String(v).replace(/[$,%\s,]/g, '').replace(/[BMKTbmkt]/g, '')) || 0;
}

export default function CompareView({ compareList, countries }) {
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_group_breakdown.json')
      .then(r => r?.json())
      .then(d => d && setGroupData(d));
  }, []);

  const slots = compareList.map((iso3, i) => ({
    country: iso3 ? (countries || []).find(c => c.iso3 === iso3) : null,
    slot: SLOTS[i],
    i,
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
                  {country.region} · ISO {country.iso3}
                </p>
                <div className="cv_card_pct">
                  {country.export_dependence.toFixed(1)}%
                </div>
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
        <div className="cv_dna_top">
          <div className="cv_dna_title_col">
            <h3 className="cv_panel_title">Commodity DNA – what each economy exports</h3>
            <p className="cv_panel_desc">
              Share of agricultural, energy and mining products in each country's commodity
              export basket. Bigger segment = greater dependence on that group.
            </p>
          </div>
          <div className="cv_dna_legend">
            {[
              ['agri',   'Agricultural'],
              ['energy', 'Energy'],
              ['mining', 'Mining & metals'],
              ['other',  'Other / non-commodity'],
            ].map(([k, l]) => (
              <div key={k} className="cv_dna_leg_item">
                <span className="cv_dna_leg_dot" style={{ background: DNA_COLORS[k] }} />
                <span className="cv_dna_leg_lbl">{l}</span>
              </div>
            ))}
          </div>
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
                      { key: 'agri',   label: 'Agricultural',    color: DNA_COLORS.agri,   pct: d.agri },
                      { key: 'energy', label: 'Energy',          color: DNA_COLORS.energy, pct: d.energy },
                      { key: 'mining', label: 'Mining & metals', color: DNA_COLORS.mining, pct: d.mining },
                      { key: 'other',  label: 'Other',           color: DNA_COLORS.other,  pct: d.other },
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
        {/* Table header */}
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

        {/* Data rows */}
        {ROWS.map(row => {
          const vals = slots.map(s => s.country ? s.country[row.key] : null);
          const nums = vals.map(v => parseNum(v));
          const positives = nums.filter(n => n > 0);
          const maxNum = positives.length ? Math.max(...nums) : 0;

          let starIdx = -1;
          if (row.star === 'min' && positives.length) {
            const minVal = Math.min(...positives);
            starIdx = nums.findIndex(n => n === minVal);
          } else if (row.star === 'max' && positives.length) {
            starIdx = nums.findIndex(n => n === maxNum);
          }

          return (
            <div key={row.key} className="cv_tbl_row">
              <div className="cv_tbl_ind">
                <span className="cv_tbl_ind_label">{row.label}</span>
                <span className="cv_tbl_ind_desc">{row.desc}</span>
              </div>

              {slots.map(({ country, slot, i }) => {
                const val = country ? country[row.key] : null;
                const num = parseNum(val);
                const barPct = maxNum > 0 ? (num / maxNum) * 100 : 0;

                // Dominant group: icon + label, no bar
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
                      ) : <span className="cv_tbl_empty">–</span>}
                    </div>
                  );
                }

                return (
                  <div key={i} className="cv_tbl_val">
                    {val != null ? (
                      <>
                        <div className="cv_val_row">
                          <span className="cv_val_num">{row.fmt(val)}</span>
                          {i === starIdx && <span className="cv_star">★</span>}
                        </div>
                        <div className="cv_bar_track">
                          <div
                            className="cv_bar_fill"
                            style={{ width: `${barPct}%`, background: slot.bar }}
                          />
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
