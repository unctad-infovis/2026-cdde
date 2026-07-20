import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import { useEffect, useState } from 'react';
import './KnowMore.css';

const NAV_ITEMS = [
  { id: 'km-sources', label: 'Sources & definitions' },
  { id: 'km-groupings', label: 'Country groupings' },
  { id: 'km-classification', label: 'Classification SITC 3' }
];

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Sources accordion ─────────────────────────────────────────────────────

function SourcesAccordion({ items }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="km_accordion">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className={`km_acc_item${isOpen ? ' km_acc_item--open' : ''}`}>
            <button type="button" className="km_acc_trigger" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}>
              <span className="km_acc_title">{item.title}</span>
              <svg className="km_acc_chevron" viewBox="0 0 12 8" aria-hidden="true">
                <path d="M1 1l5 5 5-5" />
              </svg>
            </button>
            {isOpen && (
              <div className="km_acc_body">
                {item.definition && <p className="km_acc_definition">{item.definition}</p>}
                <div className="km_acc_meta">
                  {item.unit && (
                    <div className="km_acc_meta_row">
                      <span className="km_acc_meta_label">Unit</span>
                      <span className="km_acc_meta_val">{item.unit}</span>
                    </div>
                  )}
                  {item.comments && (
                    <div className="km_acc_meta_row">
                      <span className="km_acc_meta_label">Note</span>
                      <span className="km_acc_meta_val km_acc_meta_val--note">{item.comments}</span>
                    </div>
                  )}
                  {item.source && (
                    <div className="km_acc_meta_row">
                      <span className="km_acc_meta_label">Source</span>
                      <span className="km_acc_meta_val">
                        {item.link ? (
                          <a className="km_acc_link" href={item.link} target="_blank" rel="noreferrer">
                            {item.source} ↗
                          </a>
                        ) : (
                          item.source
                        )}
                      </span>
                    </div>
                  )}
                  {item.date && (
                    <div className="km_acc_meta_row">
                      <span className="km_acc_meta_label">Extracted</span>
                      <span className="km_acc_meta_val">{item.date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Country groupings ─────────────────────────────────────────────────────

function GroupingsSection({ data }) {
  const regions = [...new Set(data.geographic.map(g => g.region))];

  return (
    <div className="km_groupings">
      <div className="km_groupings_geo">
        <h4 className="km_groupings_sub_heading">Geographic classification according to the UN statistical classification.</h4>
        <table className="km_table">
          <thead>
            <tr>
              <th className="km_th">Region</th>
              <th className="km_th">Sub-region</th>
              <th className="km_th">Economies</th>
            </tr>
          </thead>
          <tbody>
            {regions.map(region => {
              const subgroups = data.geographic.filter(g => g.region === region);
              return subgroups.map((sg, si) => (
                <tr key={`${region}-${sg.subregion}`} className="km_tr">
                  {si === 0 && (
                    <td className="km_td km_td--region" rowSpan={subgroups.length}>
                      {region}
                    </td>
                  )}
                  <td className="km_td km_td--subregion">{sg.subregion}</td>
                  <td className="km_td km_td--countries">{sg.countries.join(', ')}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <div className="km_groupings_special">
        <h4 className="km_groupings_sub_heading">Development status & special categories of economies covered in the dashboard</h4>
        <div className="km_special_grid">
          {data.special.map(cat => (
            <div key={cat.label} className="km_special_card">
              <div className="km_special_label">{cat.label}</div>
              <div className="km_special_count">{cat.countries.length} economies</div>
              <div className="km_special_countries">{cat.countries.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SITC 3 classification ─────────────────────────────────────────────────

function SitcSection({ data }) {
  const isNonCommodity = sec => sec.heading.toLowerCase().includes('non-commodi') || sec.heading.toLowerCase().includes('other products');

  return (
    <div className="km_sitc">
      {data.sections.map(sec => (
        <div key={sec.heading} className={`km_sitc_section${isNonCommodity(sec) ? ' km_sitc_section--other' : ''}`}>
          <h4 className="km_sitc_heading">{sec.heading}</h4>
          <ul className="km_sitc_list">
            {sec.items.map(item => (
              <li key={item.label} className="km_sitc_item">
                <span className="km_code_badge">[{item.code}]</span>
                <span className="km_sitc_label">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="km_sitc_abbr">Abbreviation: n.e.s., not elsewhere specified. Note: headings are as summarized in the UNCTADstat database.</p>
    </div>
  );
}

// ── Main KnowMore component ───────────────────────────────────────────────

export default function KnowMore() {
  const [sources, setSources] = useState(null);
  const [groupings, setGroupings] = useState(null);
  const [sitc3, setSitc3] = useState(null);
  const [activeSection, setActiveSection] = useState('km-sources');

  useEffect(() => {
    loadFile('assets/data/cdde_sources.json')
      .then(r => r?.json())
      .then(d => d && setSources(d));
    loadFile('assets/data/cdde_commodity_groups.json')
      .then(r => r?.json())
      .then(d => d && setGroupings(d));
    loadFile('assets/data/cdde_sitc3.json')
      .then(r => r?.json())
      .then(d => d && setSitc3(d));
  }, []);

  // Track which section is in view
  useEffect(() => {
    const observers = NAV_ITEMS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => {
      for (const o of observers) o?.disconnect();
    };
  }, []);

  return (
    <section className="km_section" id="know-more">
      <div className="km_header">
        <div className="km_header_inner">
          <div className="km_eyebrow">
            <span className="km_eyebrow_line" />
            Know more
          </div>
          <h2 className="km_title">Sources, groupings & classification</h2>
          <p className="km_subtitle">Reference documentation for all indicators, country categories and product classifications used in this publication.</p>
        </div>
      </div>

      <div className="km_sticky_nav">
        <div className="km_nav_inner">
          {NAV_ITEMS.map(({ id, label }) => (
            <button key={id} type="button" className={`km_nav_pill${activeSection === id ? ' km_nav_pill--active' : ''}`} onClick={() => scrollTo(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="km_content">
        <section id="km-sources" className="km_sub_section">
          <h3 className="km_sub_heading">Sources & definitions</h3>
          {sources ? <SourcesAccordion items={sources} /> : <div className="cdde_loading km_loading_block" />}
        </section>

        <section id="km-groupings" className="km_sub_section">
          <h3 className="km_sub_heading">Country groupings</h3>
          {groupings ? <GroupingsSection data={groupings} /> : <div className="cdde_loading km_loading_block" />}
        </section>

        <section id="km-classification" className="km_sub_section">
          <h3 className="km_sub_heading">Classification SITC 3</h3>
          {sitc3 ? <SitcSection data={sitc3} /> : <div className="cdde_loading km_loading_block" />}
        </section>
      </div>
    </section>
  );
}
