import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import { useEffect, useState } from 'react';
import CircleFlag from '../../../general/CircleFlag';
import { depColor } from '../../shared/cdde-constants';
import RollingNumber from '../../shared/RollingNumber';
import DependenceOverTime from './DependenceOverTime';
import EnergyNetImports from './EnergyNetImports';
import FoodNetImports from './FoodNetImports';
import LeadingExports from './LeadingExports';
import MacroContext from './MacroContext';
import SocialContext from './SocialContext';
import TimeSeriesChart from './TimeSeriesChart';
import TopMarkets from './TopMarkets';

import './CountryProfile.css';

const GROUP_INSIGHT = {
  agri: 'agricultural commodities, exposing the economy to weather, price and policy shocks across these markets',
  energy: 'energy commodities, leaving the economy highly exposed to oil and gas price cycles and geopolitical supply risks',
  mining: 'mineral and mining resources, making the economy sensitive to global metals demand and price volatility',
  'non-dependent': 'a diversified export basket, which reduces vulnerability to single-commodity price swings'
};

const SMALL_ECONOMIES = new Set(['KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'KNA', 'LCA', 'VCT', 'STP', 'SLB', 'SOM', 'TKM', 'TLS', 'TON', 'TUV', 'VUT']);

export default function CountryProfile({ country, content = {} }) {
  const { iso3, iso2, name, region, export_dependence: pct, dominant_group, agri_pct, energy_pct, mining_pct } = country;
  const isSmall = SMALL_ECONOMIES.has(iso3);

  const categories = [
    { key: 'agri', label: 'Agriculture', val: agri_pct != null ? +agri_pct : 0 },
    { key: 'energy', label: 'Energy', val: energy_pct != null ? +energy_pct : 0 },
    { key: 'mining', label: 'Mining', val: mining_pct != null ? +mining_pct : 0 }
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

  const insightDesc = GROUP_INSIGHT[dominant_group] || 'commodity exports';

  return (
    <div className="cp_panel">
      {/* Country header */}
      <div className="content_wrapper">
        <div className="cp_header_card">
          <CircleFlag countryCode={iso2} height={56} width={56} />
          <div className="cp_header_info">
            <h2 className="cp_country_name">{name}</h2>
            <p className="cp_country_meta">{region}</p>
            {iso3 === 'LIE' && (
              <p className="cp_country_note">
                Trade data is reported together with Switzerland. <a href="./compare.html?country=CHE">View Switzerland's profile →</a>
              </p>
            )}
          </div>
        </div>

        {/* Insight */}
        {safePct != null && (
          <p className="cp_insight">
            {name}'s exports remain anchored in <strong data-group={dominant_group}>{insightDesc.split(',')[0]}</strong>
            {insightDesc.includes(',') ? `,${insightDesc.split(',').slice(1).join(',')}` : ''}.
          </p>
        )}

        {/* Key stats row – keyed on iso3 so RollingNumber re-animates on country change */}
        <div className="cp_stats_row" key={iso3}>
          <div className="cp_stat">
            <RollingNumber value={countryStats?.commodity_dependence != null ? `${countryStats.commodity_dependence}%` : '–'} className="cp_stat_value" style={{ color: safePct != null ? depColor(safePct) : 'var(--un-color-blue-darkest)' }} />
            <span className="cp_stat_label">Commodity dependence</span>
            {safePct != null && (
              <div className="cp_stat_cats">
                {categories.map(cat => (
                  <div key={cat.key} className={`cp_stat_cat_row${dominant_group === cat.key ? ' cp_stat_cat_row--dominant' : ''}`}>
                    <span className="cp_stat_cat_dot" data-group={cat.key} />
                    <span className="cp_stat_cat_label">{cat.label}</span>
                    <span className="cp_stat_cat_val">{cat.val}%</span>
                  </div>
                ))}
              </div>
            )}
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
      </div>

      {/* Exports section */}
      <h3 className="cp_section_head cp_section_head--sep">{content.exportsHeading ?? 'Exports'}</h3>

      <DependenceOverTime iso3={iso3} currentPct={safePct} dominantGroup={dominant_group} {...content.dependenceOverTime} />
      <TimeSeriesChart iso3={iso3} dataFile="cdde_exports_over_time.json" ariaLabel="Line chart of commodity exports over time" useMillions={isSmall} {...content.exportsOverTime} />

      <div className="cp_chart_row">
        <LeadingExports iso3={iso3} {...content.leadingExports} />
        <TopMarkets iso3={iso3} {...content.topMarkets} />
      </div>

      {/* Imports section */}
      <h3 className="cp_section_head cp_section_head--sep">{content.importsHeading ?? 'Imports'}</h3>

      <TimeSeriesChart iso3={iso3} dataFile="cdde_imports_over_time.json" ariaLabel="Line chart of commodity imports over time" useMillions={isSmall || iso3 === 'SSD'} {...content.importsOverTime} />

      <div className="cp_chart_row">
        <TimeSeriesChart iso3={iso3} dataFile="cdde_food_imports.json" lineColor="var(--un-color-green)" ariaLabel="Line chart of food imports over time" useMillions={isSmall || iso3 === 'SSD' || iso3 === 'PSE'} {...content.foodImportsOverTime} />
        <TimeSeriesChart iso3={iso3} dataFile="cdde_energy_imports.json" lineColor="var(--un-color-purple)" ariaLabel="Line chart of energy imports over time" useMillions={isSmall || iso3 === 'SSD' || iso3 === 'PSE'} {...content.energyImportsOverTime} />
      </div>

      <div className="cp_chart_row">
        <FoodNetImports iso3={iso3} countryName={name} {...content.foodNetImports} />
        <EnergyNetImports iso3={iso3} countryName={name} {...content.energyNetImports} />
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
