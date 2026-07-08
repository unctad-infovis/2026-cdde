import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

import './DependenceStandings.css';

const CRITERIA = [
  {
    id: 'export_dependence',
    label: 'Commodity dependence (%)',
    tickFmt: v => `${v}%`,
    valFmt: v => `${v.toFixed(1)}%`,
    domain: [0, 100],
    threshold: 60,
    thresholdLabel: '60% threshold'
  },
  {
    id: 'hhi',
    label: 'Export concentration (HHI)',
    tickFmt: v => v.toFixed(2),
    valFmt: v => v.toFixed(2),
    domain: [0, 1],
    threshold: null,
    thresholdLabel: null
  }
];

const REGION_LIST = ['All regions', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

const REGION_GROUPS = {
  Africa: ['North Africa', 'Sub-Saharan Africa'],
  Americas: ['Caribbean', 'Central America', 'Northern America', 'South America'],
  Asia: ['Central Asia', 'Eastern Asia', 'South-Eastern Asia', 'Southern Asia', 'Western Asia'],
  Europe: ['Eastern Europe', 'Northern Europe', 'Southern Europe', 'Western Europe'],
  Oceania: ['Oceania']
};

const DEVELOPED = new Set(['AUS', 'AUT', 'BEL', 'CAN', 'CHE', 'CZE', 'DEU', 'DNK', 'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GRC', 'HUN', 'IRL', 'ISL', 'ISR', 'ITA', 'JPN', 'KOR', 'LTU', 'LUX', 'LVA', 'NLD', 'NOR', 'NZL', 'POL', 'PRT', 'SVK', 'SVN', 'SWE', 'USA']);

function parsePop(pop) {
  if (!pop) return 5e6;
  const s = String(pop).trim().toUpperCase();
  const n = parseFloat(s);
  if (s.includes('B')) return n * 1e9;
  if (s.includes('M')) return n * 1e6;
  if (s.includes('K')) return n * 1e3;
  return n || 5e6;
}

export default function DependenceStandings({ countries }) {
  const [criterion, setCriterion] = useState('export_dependence');
  const [region, setRegion] = useState('All regions');
  const [highlight, setHighlight] = useState([]);
  const [hlInput, setHlInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [chartW, setChartW] = useState(0);

  const svgRef = useRef();
  const wrapRef = useRef();

  const crit = CRITERIA.find(c => c.id === criterion);

  const visible = (countries || []).filter(c => {
    const v = c[criterion];
    if (v == null || Number.isNaN(v)) return false;
    if (region === 'All regions') return true;
    return REGION_GROUPS[region]?.includes(c.region);
  });

  // Track container width
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => setChartW(entries[0].contentRect.width));
    ro.observe(wrapRef.current);
    setChartW(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Draw beeswarm
  useEffect(() => {
    if (!chartW || !visible.length || !svgRef.current) return;

    const W = chartW;
    const H = 400;
    const M = { top: 36, right: 96, bottom: 56, left: 16 };
    const iW = W - M.left - M.right;
    const iH = H - M.top - M.bottom;

    const xScale = d3.scaleLinear().domain(crit.domain).range([0, iW]);

    const maxPop = d3.max(visible, c => parsePop(c.population)) || 1e9;
    const rScale = d3.scaleSqrt().domain([0, maxPop]).range([3, 16]);

    const nodes = visible.map(c => ({
      iso3: c.iso3,
      name: c.name,
      val: c[criterion],
      r: rScale(parsePop(c.population)),
      dev: DEVELOPED.has(c.iso3),
      x: xScale(c[criterion]),
      y: iH / 2
    }));

    // Beeswarm via force simulation (synchronous)
    d3.forceSimulation(nodes)
      .force('x', d3.forceX(d => xScale(d.val)).strength(1))
      .force('y', d3.forceY(iH / 2).strength(0.05))
      .force(
        'collision',
        d3.forceCollide(d => d.r + 1.5)
      )
      .stop()
      .tick(120);

    nodes.forEach(n => {
      n.y = Math.max(n.r + 2, Math.min(iH - n.r - 2, n.y));
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', '#f5f7fa').attr('rx', 6);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(crit.tickFmt))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#ccc'))
      .call(ax => ax.selectAll('text').attr('fill', '#888').attr('font-size', 11));

    // Axis label
    g.append('text')
      .attr('x', iW / 2)
      .attr('y', iH + 48)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .attr('letter-spacing', '0.06em')
      .text(crit.label.toUpperCase());

    // Reference line
    if (crit.threshold != null) {
      const tx = xScale(crit.threshold);
      g.append('line').attr('x1', tx).attr('x2', tx).attr('y1', 0).attr('y2', iH).attr('stroke', '#fbaf17').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,4');
      g.append('text')
        .attr('x', tx + 6)
        .attr('y', 16)
        .attr('fill', '#fbaf17')
        .attr('font-size', 11)
        .attr('font-weight', 700)
        .text(crit.thresholdLabel);
    }

    // Economy count
    svg
      .append('text')
      .attr('x', W - M.right + 8)
      .attr('y', M.top + 16)
      .attr('fill', '#aaa')
      .attr('font-size', 11)
      .text(`${nodes.length} economies`);

    // Dots
    const hlSet = new Set(highlight);
    const hasHL = hlSet.size > 0;

    g.selectAll('circle')
      .data(nodes, d => d.iso3)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.r)
      .attr('fill', d => (hasHL && !hlSet.has(d.iso3) ? '#ccc' : d.dev ? '#009edb' : '#fbaf17'))
      .attr('opacity', d => (hasHL && !hlSet.has(d.iso3) ? 0.25 : 0.82))
      .attr('stroke', d => (hlSet.has(d.iso3) ? '#003a5c' : 'none'))
      .attr('stroke-width', 2.5)
      .append('title')
      .text(d => `${d.name}: ${crit.valFmt(d.val)}`);
  }, [visible, criterion, chartW, highlight, crit.tickFmt, crit.label.toUpperCase, crit.valFmt, crit.thresholdLabel, crit.threshold, crit.domain]);

  // Highlight input
  const handleHlInput = e => {
    const val = e.target.value;
    setHlInput(val);
    const q = val.toLowerCase().trim();
    const pool = countries || [];
    setSuggestions(q ? pool.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8) : pool.slice(0, 8));
  };

  const handleHlFocus = () => {
    setSuggestions((countries || []).slice(0, 8));
  };

  const addHighlight = c => {
    if (!highlight.includes(c.iso3)) setHighlight(prev => [...prev, c.iso3]);
    setHlInput('');
    setSuggestions([]);
  };

  return (
    <div className="dp_card">
      <div className="dp_card_header">
        <h3 className="dp_card_title">Where every economy stands</h3>
        <p className="dp_card_desc">Each dot is a country, positioned by its value on the chosen criterion. Vertical clustering shows where most economies fall.</p>
      </div>

      <div className="dp_divider" />

      <div className="dp_controls">
        <div className="dp_control_group">
          <span className="dp_control_label">CRITERION</span>
          <div className="dp_select_wrap">
            <select className="dp_select" value={criterion} onChange={e => setCriterion(e.target.value)}>
              {CRITERIA.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <svg className="dp_chevron" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="dp_control_group">
          <span className="dp_control_label">REGION</span>
          <div className="dp_select_wrap">
            <select className="dp_select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGION_LIST.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <svg className="dp_chevron" viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div ref={wrapRef} className="dp_chart_wrap">
        {!countries && <div className="dp_loading" />}
        <svg ref={svgRef} />
      </div>

      <div className="dp_legend">
        <div className="dp_legend_left">
          <div className="dp_legend_item">
            <span className="dp_dot_swatch" style={{ background: '#009edb' }} />
            <span className="dp_legend_label">Developed</span>
          </div>
          <div className="dp_legend_item">
            <span className="dp_dot_swatch" style={{ background: '#fbaf17' }} />
            <span className="dp_legend_label">Developing</span>
          </div>
        </div>
        <div className="dp_legend_sep" />
        <div className="dp_legend_right">
          <span className="dp_size_legend">
            <span className="dp_size_dot dp_size_dot--s" />
            <span className="dp_size_dot dp_size_dot--m" />
            <span className="dp_size_dot dp_size_dot--l" />
          </span>
          <span className="dp_legend_label">= population</span>
        </div>
      </div>

      <div className="dp_hl_bar">
        <span className="dp_hl_label">HIGHLIGHT</span>
        <div className="dp_hl_input_wrap">
          <input className="dp_hl_input" type="text" placeholder="Click or type to add a country" value={hlInput} onChange={handleHlInput} onFocus={handleHlFocus} />
          {suggestions.length > 0 && (
            <div className="dp_suggestions">
              {suggestions.map(c => (
                <button key={c.iso3} className="dp_suggestion_item" onMouseDown={() => addHighlight(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {highlight.length > 0 && (
          <button className="dp_hl_clear" onClick={() => setHighlight([])}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
