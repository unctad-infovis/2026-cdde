import { useEffect, useMemo, useRef, useState } from 'react';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import { REGION_GROUPS } from '../shared/cdde-constants';
import CountryList from './CountryList';
import CompareView from './compare/CompareView';
import EconomyBubbleChart from './compare/EconomyBubbleChart';
import CountryProfile from './profile/CountryProfile';
import CountryRankings from './ranking/CountryRankings';

import './CountryData.css';

const DEFAULT_TOOLS = [
  { id: '01', label: 'Country profile', desc: 'Deep-dive on one economy' },
  { id: '02', label: 'Compare profiles', desc: 'Up to 3 economies side by side' },
  { id: '03', label: 'Variable ranking', desc: 'League table for any indicator' }
];

const REGIONS = ['All', ...Object.keys(REGION_GROUPS)];
const THRESHOLDS = ['All', '≤60%', '60–80%', '>80%'];

export default function Compare({ content = {} }) {
  const TOOLS = content.tools ?? DEFAULT_TOOLS;
  const [allCountries, setAllCountries] = useState(null);
  const [activeTool, setActiveTool] = useState('01');
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [threshold, setThreshold] = useState('All');
  const [compareList, setCompareList] = useState(['NGA', 'CHL', 'AUS']);
  const [panelOpen, setPanelOpen] = useState(!new URLSearchParams(window.location.search).get('country'));
  const filtersMounted = useRef(false);

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_map.csv')
      .then(r => r?.text())
      .then(text => {
        if (!text) return;
        const rows = CSVtoJSON(text)
          .filter(r => r.iso3)
          .map(r => ({
            ...r,
            export_dependence: r.export_dependence !== '' ? +r.export_dependence : null,
            dominant_group: r.dominant_group || null,
            agri_pct: r.agri_pct !== '' ? +r.agri_pct : null,
            energy_pct: r.energy_pct !== '' ? +r.energy_pct : null,
            mining_pct: r.mining_pct !== '' ? +r.mining_pct : null
          }));
        const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        setAllCountries(sorted);
        const preselect = new URLSearchParams(window.location.search).get('country');
        const initial = (preselect && sorted.find(r => r.iso3 === preselect)) || sorted[0];
        setSelected(initial);
      });
  }, []);

  // Auto-open panel when filters change (skip initial mount)
  useEffect(() => {
    if (!filtersMounted.current) {
      filtersMounted.current = true;
      return;
    }
    setPanelOpen(true);
  }, []);

  const filtered = useMemo(() => {
    if (!allCountries) return [];
    return allCountries.filter(c => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q);
      const matchRegion = region === 'All' || REGION_GROUPS[region]?.includes(c.region);
      const pct = c.export_dependence;
      const matchThreshold = threshold === 'All' || (threshold === '≤60%' && pct <= 60) || (threshold === '60–80%' && pct > 60 && pct <= 80) || (threshold === '>80%' && pct > 80);
      return matchSearch && matchRegion && matchThreshold;
    });
  }, [allCountries, search, region, threshold]);

  const totalCount = allCountries?.length ?? 0;

  return (
    <div className="cmp_section">
      {/* Tool nav */}
      <div className="cmp_tool_nav">
        {TOOLS.map(t => (
          <button type="button" key={t.id} className={`cmp_tool_tab${activeTool === t.id ? ' cmp_tool_tab--active' : ''}`} onClick={() => setActiveTool(t.id)}>
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
            {/* Panel toggle */}
            <button type="button" className={`cmp_panel_btn${panelOpen ? ' cmp_panel_btn--open' : ''}`} onClick={() => setPanelOpen(v => !v)} aria-label={panelOpen ? 'Hide country list' : 'Show country list'}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
              <span>Select another country</span>
            </button>
          </div>

          <div className="cmp_body">
            {/* Backdrop – closes panel when clicking outside */}
            {panelOpen && <button type="button" className="cmp_backdrop" aria-label="Close country list" onClick={() => setPanelOpen(false)} />}

            {/* Collapsible overlay panel */}
            <div className={`cmp_col_left${panelOpen ? '' : ' cmp_col_left--closed'}`}>
              <button type="button" className="cmp_panel_close" onClick={() => setPanelOpen(false)} aria-label="Close country list">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {/* Search + region + threshold filters */}
              <div className="cmp_panel_filters">
                <div className="cmp_search_wrap">
                  <svg className="cmp_search_icon" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                    <line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input className="cmp_search_input" type="text" placeholder={`Search ${totalCount} member States`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="cmp_filter_group">
                  <span className="cmp_filter_group_label">REGION</span>
                  {REGIONS.map(r => (
                    <button type="button" key={r} className={`cmp_filter_pill${region === r ? ' cmp_filter_pill--active' : ''}`} onClick={() => setRegion(r)}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="cmp_filter_group">
                  <span className="cmp_filter_group_label">THRESHOLD</span>
                  {THRESHOLDS.map(t => (
                    <button type="button" key={t} className={`cmp_filter_pill${threshold === t ? ' cmp_filter_pill--active' : ''}`} onClick={() => setThreshold(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cmp_list_wrap">
                {allCountries ? (
                  <CountryList
                    countries={filtered}
                    selected={selected}
                    onSelect={c => {
                      setSelected(c);
                      setPanelOpen(false);
                    }}
                  />
                ) : (
                  <div className="cmp_list_loading" />
                )}
              </div>
            </div>

            {/* Right: always full width */}
            <div className="cmp_col_right">{selected ? <CountryProfile country={selected} content={content.profile ?? {}} /> : <p className="cmp_placeholder">Select a country to view its profile.</p>}</div>
          </div>
        </>
      )}

      {/* Tab 02: dot plot + compare bar */}
      {activeTool === '02' && (
        <>
          <EconomyBubbleChart countries={allCountries} {...content.standings} />
          <CompareView compareList={compareList} countries={allCountries} onCompareChange={setCompareList} {...content.compareView} />
        </>
      )}

      {/* Tab 03: variable ranking */}
      {activeTool === '03' && <CountryRankings countries={allCountries} />}
    </div>
  );
}
