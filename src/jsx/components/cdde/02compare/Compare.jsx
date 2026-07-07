import { useEffect, useMemo, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import CountryList from './CountryList';
import CountryProfile from './CountryProfile';
import DotPlot from './DotPlot';
import CompareBar from './CompareBar';
import CompareView from './CompareView';
import RankTable from './RankTable';

import './Compare.css';

const TOOLS = [
  { id: '01', label: 'Country profile', desc: 'Deep-dive on one economy' },
  { id: '02', label: 'Compare profiles', desc: 'Up to 3 economies side by side' },
  { id: '03', label: 'Variable ranking', desc: 'League table for any indicator' },
];

const REGION_GROUPS = {
  Africa:   ['North Africa', 'Sub-Saharan Africa'],
  Americas: ['Caribbean', 'Central America', 'Northern America', 'South America'],
  Asia:     ['Central Asia', 'Eastern Asia', 'South-Eastern Asia', 'Southern Asia', 'Western Asia'],
  Europe:   ['Eastern Europe', 'Northern Europe', 'Southern Europe', 'Western Europe'],
  Oceania:  ['Oceania'],
};
const REGIONS = ['All', ...Object.keys(REGION_GROUPS)];
const THRESHOLDS = ['All', '≤60%', '60–80%', '>80%'];

export default function Compare() {
  const [allCountries, setAllCountries] = useState(null);
  const [activeTool, setActiveTool] = useState('01');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [threshold, setThreshold] = useState('All');
  const [compareList, setCompareList] = useState(['NGA', 'CHL', 'AUS']);

  useEffect(() => {
    loadFile('assets/data/cdde_map_data.json')
      .then(r => r?.json())
      .then(d => {
        if (!d) return;
        const sorted = [...d].sort((a, b) => a.name.localeCompare(b.name));
        setAllCountries(sorted);
        setSelected(sorted[0]);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!allCountries) return [];
    return allCountries.filter(c => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q);
      const matchRegion =
        region === 'All' || REGION_GROUPS[region]?.includes(c.region);
      const pct = c.export_dependence;
      const matchThreshold =
        threshold === 'All' ||
        (threshold === '≤60%'  && pct <= 60) ||
        (threshold === '60–80%' && pct > 60 && pct <= 80) ||
        (threshold === '>80%'  && pct > 80);
      return matchSearch && matchRegion && matchThreshold;
    });
  }, [allCountries, search, region, threshold]);

  const totalCount = allCountries?.length ?? 0;

  return (
    <div className="cmp_section">
      {/* Tool nav */}
      <div className="cmp_tool_nav">
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`cmp_tool_tab${activeTool === t.id ? ' cmp_tool_tab--active' : ''}`}
            onClick={() => setActiveTool(t.id)}
          >
            <span className="cmp_tool_num">{t.id}</span>
            <div className="cmp_tool_text">
              <span className="cmp_tool_label">{t.label}</span>
              <span className="cmp_tool_desc">{t.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab 01: filter bar + split layout */}
      {activeTool === '01' && (
        <>
          <div className="cmp_filter_bar">
            <div className="cmp_search_wrap">
              <svg className="cmp_search_icon" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                className="cmp_search_input"
                type="text"
                placeholder={`Search ${totalCount} member States`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="cmp_filter_group">
              <span className="cmp_filter_group_label">REGION</span>
              {REGIONS.map(r => (
                <button
                  key={r}
                  className={`cmp_filter_pill${region === r ? ' cmp_filter_pill--active' : ''}`}
                  onClick={() => setRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="cmp_filter_group">
              <span className="cmp_filter_group_label">THRESHOLD</span>
              {THRESHOLDS.map(t => (
                <button
                  key={t}
                  className={`cmp_filter_pill${threshold === t ? ' cmp_filter_pill--active' : ''}`}
                  onClick={() => setThreshold(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="cmp_body">
            <div className="cmp_col_left">
              {allCountries
                ? <CountryList countries={filtered} selected={selected} onSelect={setSelected} />
                : <div className="cmp_list_loading" />
              }
            </div>
            <div className="cmp_col_right">
              {selected
                ? <CountryProfile country={selected} />
                : <p className="cmp_placeholder">Select a country to view its profile.</p>
              }
            </div>
          </div>
        </>
      )}

      {/* Tab 02: dot plot + compare bar */}
      {activeTool === '02' && (
        <>
          <DotPlot countries={allCountries} />
          <CompareBar
            countries={allCountries}
            compareList={compareList}
            onCompareChange={setCompareList}
          />
          <CompareView
            compareList={compareList}
            countries={allCountries}
          />
        </>
      )}

      {/* Tab 03: variable ranking */}
      {activeTool === '03' && (
        <RankTable countries={allCountries} />
      )}
    </div>
  );
}
