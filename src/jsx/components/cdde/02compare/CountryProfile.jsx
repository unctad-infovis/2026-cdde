import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import CircleFlag from '../../general/CircleFlag';
import RollingNumber from '../shared/RollingNumber';
import DependenceOverTime from './DependenceOverTime';
import EnergyImportsOverTime from './EnergyImportsOverTime';
import EnergyNetImports from './EnergyNetImports';
import ExportsOverTime from './ExportsOverTime';
import FoodImportsOverTime from './FoodImportsOverTime';
import FoodNetImports from './FoodNetImports';
import ImportsOverTime from './ImportsOverTime';
import LeadingExports from './LeadingExports';
import MacroContext from './MacroContext';
import SocialContext from './SocialContext';
import TopMarkets from './TopMarkets';

import './CountryProfile.css';

const GROUP_COLORS = {
  agri: '#72bf44',
  energy: '#a05fb4',
  mining: '#fbaf17',
  'non-dependent': '#9e9e9e'
};

const GROUP_TEXT_COLORS = {
  agri: 'var(--un-color-green-text)',
  energy: 'var(--un-color-purple-text)',
  mining: 'var(--un-color-yellow-dark)',
  'non-dependent': 'var(--un-color-grey-text)'
};

const GROUP_INSIGHT = {
  agri: 'agricultural commodities, exposing the economy to weather, price and policy shocks across food markets',
  energy: 'energy commodities, leaving the economy highly exposed to oil and gas price cycles and geopolitical supply risks',
  mining: 'mineral and mining resources, making the economy sensitive to global metals demand and price volatility',
  'non-dependent': 'a diversified export basket, which reduces vulnerability to single-commodity price swings'
};

function depColor(pct) {
  if (pct > 80) return '#a71f36';
  if (pct > 60) return '#fbaf17';
  return '#009edb';
}

export default function CountryProfile({ country, content = {} }) {
  const { iso3, iso2, name, region, export_dependence: pct, dominant_group, agri_pct, energy_pct, mining_pct } = country;

  const categories = [
    { key: 'agri', label: 'Agriculture', val: agri_pct != null ? +agri_pct : 0 },
    { key: 'energy', label: 'Energy', val: energy_pct != null ? +energy_pct : 0 },
    { key: 'mining', label: 'Mining & metals', val: mining_pct != null ? +mining_pct : 0 }
  ].sort((a, b) => b.val - a.val);

  const [stats, setStats] = useState(null);
  useEffect(() => {
    loadFile('assets/data/cdde_profile_stats.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setStats(d);
      });
  }, []);

  const countryStats = stats?.[iso3] ?? null;
  const safePct = Number.isFinite(pct) ? pct : null;

  const groupColor = GROUP_TEXT_COLORS[dominant_group] || 'var(--un-color-grey-text)';
  const insightDesc = GROUP_INSIGHT[dominant_group] || 'commodity exports';

  return (
    <div className="cp_panel">
      {/* Country header */}
      <div className="cp_header_card">
        <CircleFlag countryCode={iso2} height={56} width={56} />
        <div className="cp_header_info">
          <h2 className="cp_country_name">{name}</h2>
          <p className="cp_country_meta">{region}</p>
        </div>
      </div>

      {/* Insight */}
      <p className="cp_insight">
        {name}'s exports remain anchored in <strong style={{ color: groupColor }}>{insightDesc.split(',')[0]}</strong>
        {insightDesc.includes(',') ? `,${insightDesc.split(',').slice(1).join(',')}` : ''}.
      </p>

      {/* Key stats row – keyed on iso3 so RollingNumber re-animates on country change */}
      <div className="cp_stats_row" key={iso3}>
        <div className="cp_stat">
          <RollingNumber
            value={countryStats?.commodity_dependence != null ? `${countryStats.commodity_dependence}%` : '–'}
            className="cp_stat_value"
            style={{ color: safePct != null ? depColor(safePct) : 'var(--un-color-blue-darkest)' }}
          />
          <span className="cp_stat_label">Commodity dependence</span>
          <div className="cp_stat_cats">
            {categories.map(cat => (
              <div key={cat.key} className={`cp_stat_cat_row${dominant_group === cat.key ? ' cp_stat_cat_row--dominant' : ''}`}>
                <span className="cp_stat_cat_dot" style={{ background: GROUP_COLORS[cat.key] }} />
                <span className="cp_stat_cat_label">{cat.label}</span>
                <span className="cp_stat_cat_val">{cat.val}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cp_stat">
          <RollingNumber value={countryStats?.leading_market != null ? `${countryStats.leading_market}%` : '–'} className="cp_stat_value" />
          <span className="cp_stat_label">Leading destination markets</span>
          <span className="cp_stat_note">Share of top 3 export destination countries</span>
        </div>
        <div className="cp_stat">
          <RollingNumber value={countryStats?.leading_commodity != null ? `${countryStats.leading_commodity}%` : '–'} className="cp_stat_value" />
          <span className="cp_stat_label">Leading commodities</span>
          <span className="cp_stat_note">Share of top 3 commodities</span>
        </div>
      </div>

      {/* Exports section */}
      <h3 className="cp_section_head cp_section_head--sep">{content.exportsHeading ?? 'Exports'}</h3>

      <DependenceOverTime iso3={iso3} currentPct={safePct} dominantGroup={dominant_group} {...content.dependenceOverTime} />
      <ExportsOverTime iso3={iso3} dominantGroup={dominant_group} {...content.exportsOverTime} />

      <div className="cp_chart_row">
        <LeadingExports iso3={iso3} dominantGroup={dominant_group} {...content.leadingExports} />
        <TopMarkets iso3={iso3} {...content.topMarkets} />
      </div>

      {/* Imports section */}
      <h3 className="cp_section_head cp_section_head--sep">{content.importsHeading ?? 'Imports'}</h3>

      <ImportsOverTime iso3={iso3} {...content.importsOverTime} />

      <div className="cp_chart_row">
        <FoodImportsOverTime iso3={iso3} {...content.foodImportsOverTime} />
        <EnergyImportsOverTime iso3={iso3} {...content.energyImportsOverTime} />
      </div>

      <div className="cp_chart_row">
        <FoodNetImports iso3={iso3} {...content.foodNetImports} />
        <EnergyNetImports iso3={iso3} {...content.energyNetImports} />
      </div>

      {/* Context section */}
      <h3 className="cp_section_head cp_section_head--sep">{content.contextHeading ?? 'Context'}</h3>

      <div className="cp_chart_row">
        <MacroContext iso3={iso3} {...content.macroContext} />
        <SocialContext iso3={iso3} {...content.socialContext} />
      </div>
    </div>
  );
}
