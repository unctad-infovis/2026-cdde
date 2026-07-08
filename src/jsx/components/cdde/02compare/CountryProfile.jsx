import CircleFlag from '../../general/CircleFlag';
import DependenceOverTime from './DependenceOverTime';
import LeadingExports from './LeadingExports';
import TopMarkets from './TopMarkets';
import ImportDependencies from './ImportDependencies';
import MacroContext from './MacroContext';
import SocialContext from './SocialContext';

import './CountryProfile.css';

const GROUP_LABELS = {
  agri: 'Agricultural',
  energy: 'Energy',
  mining: 'Mining',
  'non-dependent': 'Non-commodity',
};

const GROUP_COLORS = {
  agri: '#72bf44',
  energy: '#009edb',
  mining: '#fbaf17',
  'non-dependent': '#9e9e9e',
};

const GROUP_INSIGHT = {
  agri: 'agricultural commodities, exposing the economy to weather, price and policy shocks across food markets',
  energy: 'energy commodities, leaving the economy highly exposed to oil and gas price cycles and geopolitical supply risks',
  mining: 'mineral and mining resources, making the economy sensitive to global metals demand and price volatility',
  'non-dependent': 'a diversified export basket, which reduces vulnerability to single-commodity price swings',
};

function depColor(pct) {
  if (pct > 80) return '#a71f36';
  if (pct > 60) return '#fbaf17';
  return '#009edb';
}

function hhiLabel(hhi) {
  if (hhi < 0.10) return 'Low';
  if (hhi < 0.25) return 'Moderate';
  return 'High';
}

export default function CountryProfile({ country }) {
  const {
    iso3, iso2, name, region,
    export_dependence: pct,
    dominant_group,
    merchandise_exports,
    hhi,
    gdp_per_capita,
    population,
  } = country;

  const safePct = Number.isFinite(pct) ? pct : null;

  const groupColor  = GROUP_COLORS[dominant_group] || '#9e9e9e';
  const groupLabel  = GROUP_LABELS[dominant_group] || dominant_group;
  const insightDesc = GROUP_INSIGHT[dominant_group] || 'commodity exports';
  const aboveBelow  = safePct != null ? (safePct > 60 ? 'Above' : 'Below') : null;

  return (
    <div className="cp_panel">
      {/* Country header */}
      <div className="cp_header_card">
        <div className="cp_header_left">
          <CircleFlag countryCode={iso2} height={56} width={56} />
          <div className="cp_header_info">
            <h2 className="cp_country_name">{name}</h2>
            <p className="cp_country_meta">{region} · ISO {iso3} · Population {population}</p>
          </div>
        </div>
        <div className="cp_dep_block">
          <span className="cp_dep_eyebrow">COMMODITY EXPORT DEPENDENCE</span>
          <span className="cp_dep_pct" style={{ color: safePct != null ? depColor(safePct) : '#9e9e9e' }}>
            {safePct != null ? `${safePct.toFixed(1)}%` : '–'}
          </span>
          {aboveBelow && <span className="cp_dep_note">{aboveBelow} the 60% threshold · 2022–2024</span>}
        </div>
      </div>

      {/* Insight */}
      <p className="cp_insight">
        {name}'s exports remain anchored in{' '}
        <strong style={{ color: groupColor }}>{insightDesc.split(',')[0]}</strong>
        {insightDesc.includes(',') ? ',' + insightDesc.split(',').slice(1).join(',') : ''}.
      </p>

      {/* Key stats row */}
      <div className="cp_stats_row">
        <div className="cp_stat">
          <span className="cp_stat_label">MERCHANDISE EXPORTS</span>
          <span className="cp_stat_value">{merchandise_exports}</span>
          <span className="cp_stat_note">2022–2024 avg</span>
        </div>
        <div className="cp_stat">
          <span className="cp_stat_label">DOMINANT GROUP</span>
          <span className="cp_stat_value" style={{ color: groupColor }}>{groupLabel}</span>
          <span className="cp_stat_note">SITC classification</span>
        </div>
        <div className="cp_stat">
          <span className="cp_stat_label">HHI CONCENTRATION</span>
          <span className="cp_stat_value cp_stat_value--dark">{hhi != null ? Number(hhi).toFixed(2) : '–'}</span>
          <span className="cp_stat_note">{hhi != null ? hhiLabel(hhi) : ''}</span>
        </div>
        <div className="cp_stat">
          <span className="cp_stat_label">GDP PER CAPITA</span>
          <span className="cp_stat_value cp_stat_value--dark">{gdp_per_capita}</span>
          <span className="cp_stat_note">Constant 2015 dollars</span>
        </div>
      </div>

      {/* Chart row 1 */}
      <div className="cp_chart_row">
        <DependenceOverTime
          iso3={iso3}
          currentPct={safePct}
          dominantGroup={dominant_group}
        />
        <LeadingExports
          iso3={iso3}
          dominantGroup={dominant_group}
        />
      </div>

      {/* Chart row 2 */}
      <div className="cp_chart_row">
        <TopMarkets iso3={iso3} />
        <ImportDependencies iso3={iso3} />
      </div>

      {/* Chart row 3 */}
      <div className="cp_chart_row">
        <MacroContext iso3={iso3} hhi={hhi} />
        <SocialContext iso3={iso3} />
      </div>
    </div>
  );
}
