import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ChartTooltip from '../shared/ChartTooltip';
import { DEVELOPED, REGION_GROUPS } from '../shared/cdde-constants';

import './DependenceStandings.css';

const PILL_W = 110;
const PILL_H = 20;
const PILL_R = 3;
const PILL_ARROW = 4;

const REGION_LIST = ['All regions', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

export default function DependenceStandings({ countries, title, subtitle, description, source, note }) {
  const [region, setRegion] = useState('All regions');
  const [highlight, setHighlight] = useState([]);
  const [hlInput, setHlInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [chartW, setChartW] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const [socialData, setSocialData] = useState(null);

  const svgRef = useRef();
  const wrapRef = useRef();

  useEffect(() => {
    loadFile('assets/data/cdde_social_context.json')
      .then(r => r?.json())
      .then(d => { if (d) setSocialData(d); });
  }, []);

  const visible = (countries || []).filter(c => {
    const v = c.export_dependence;
    if (v == null || Number.isNaN(v)) return false;
    if (region === 'All regions') return true;
    return REGION_GROUPS[region]?.includes(c.region);
  });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => setChartW(entries[0].contentRect.width));
    ro.observe(wrapRef.current);
    setChartW(wrapRef.current.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!chartW || !visible.length || !svgRef.current) return;

    const W = chartW;
    const H = 220;
    const M = { top: 40, right: 16, bottom: 28, left: 16 };
    const iW = W - M.left - M.right;
    const iH = H - M.top - M.bottom;

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, iW]);

    const getPop = c => socialData?.[c.iso3]?.population ?? 5000;
    const maxPop = d3.max(visible, c => getPop(c)) || 1400000;
    const maxR = W < 420 ? 10 : W < 600 ? 15 : 24;
    const rScale = d3.scaleSqrt().domain([0, maxPop]).range([2, maxR]);

    const nodes = visible.map(c => ({
      iso3: c.iso3,
      name: c.name,
      val: c.export_dependence,
      r: rScale(getPop(c)),
      dev: DEVELOPED.has(c.iso3),
      x: xScale(c.export_dependence),
      y: iH / 2
    }));

    d3.forceSimulation(nodes)
      .force('x', d3.forceX(d => xScale(d.val)).strength(1))
      .force('y', d3.forceY(iH / 2).strength(0.05))
      .force('collision', d3.forceCollide(d => d.r + 1.5))
      .stop()
      .tick(120);

    nodes.forEach(n => {
      n.y = Math.max(n.r + 2, Math.min(iH - n.r - 2, n.y));
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H);

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(v => `${v}%`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line').attr('stroke', '#ccc'))
      .call(ax => ax.selectAll('text').attr('fill', '#888').attr('font-size', 11));

    // 60% threshold vertical line
    const tx = xScale(60);
    g.append('line')
      .attr('x1', tx).attr('x2', tx)
      .attr('y1', 0).attr('y2', iH)
      .attr('stroke', '#fbaf17').attr('stroke-width', 1.5).attr('stroke-dasharray', '5,4');

    // 60% threshold pill
    const pillX = Math.min(iW - PILL_W - 2, Math.max(2, tx - PILL_W / 2));
    const arrowCX = Math.max(PILL_ARROW + 2, Math.min(PILL_W - PILL_ARROW - 2, tx - pillX));
    const pillG = g.append('g').attr('transform', `translate(${pillX},${-PILL_H - PILL_ARROW - 4})`);
    pillG.append('rect').attr('width', PILL_W).attr('height', PILL_H).attr('rx', PILL_R).attr('fill', '#fbaf17');
    pillG.append('text')
      .attr('x', PILL_W / 2).attr('y', PILL_H - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .attr('font-family', 'Inter, Arial, sans-serif')
      .text('60% threshold');
    pillG.append('polygon')
      .attr('points', `${arrowCX - PILL_ARROW},${PILL_H} ${arrowCX + PILL_ARROW},${PILL_H} ${arrowCX},${PILL_H + PILL_ARROW}`)
      .attr('fill', '#fbaf17');

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
      .style('cursor', 'default')
      .on('mouseover', (event, d) => {
        const rect = wrapRef.current.getBoundingClientRect();
        setTooltip({ left: event.clientX - rect.left, top: event.clientY - rect.top, name: d.name, val: d.val });
      })
      .on('mousemove', (event, d) => {
        const rect = wrapRef.current.getBoundingClientRect();
        setTooltip({ left: event.clientX - rect.left, top: event.clientY - rect.top, name: d.name, val: d.val });
      })
      .on('mouseout', () => setTooltip(null));

    d3.select(svgRef.current).on('mouseleave', () => setTooltip(null));

  }, [visible, chartW, highlight, socialData]);

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
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      <div className="dp_divider" />

      <div className="dp_controls">
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
            <svg className="dp_chevron" viewBox="0 0 12 8" fill="none" aria-hidden="true">
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
            <span className="dp_dot_swatch" style={{ background: 'var(--un-color-blue)' }} />
            <span className="dp_legend_label">Developed</span>
          </div>
          <div className="dp_legend_item">
            <span className="dp_dot_swatch" style={{ background: 'var(--un-color-yellow)' }} />
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
                <button type="button" key={c.iso3} className="dp_suggestion_item" onMouseDown={() => addHighlight(c)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {highlight.length > 0 && (
          <button type="button" className="dp_hl_clear" onClick={() => setHighlight([])}>
            Clear all
          </button>
        )}
      </div>

      <ChartMeta source={source} note={note} />

      {tooltip && (
        <ChartTooltip left={tooltip.left} top={tooltip.top} flip={tooltip.left > chartW * 0.6}>
          <div className="cmap_tt_name">{tooltip.name}</div>
          <div className="cmap_tt_row">
            <span className="cmap_tt_label">Export dependence</span>
            <span className="cmap_tt_val">{tooltip.val.toFixed(1)}%</span>
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}
