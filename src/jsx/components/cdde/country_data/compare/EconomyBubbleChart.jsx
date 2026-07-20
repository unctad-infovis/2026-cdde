import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import ChartTooltip from '../../shared/ChartTooltip';
import { C_BLUE, C_YELLOW, DEVELOPED, REGION_GROUPS } from '../../shared/cdde-constants';

import './EconomyBubbleChart.css';

const PILL_W = 100;
const PILL_H = 20;
const PILL_R = 3;
const PILL_ARROW = 4;

const LABEL_H = 22;
const LABEL_PAD_X = 10;
const LABEL_GAP = 4;
const LABEL_R = 4;
// Candidate slots tried for each label, all sitting directly against the dot — no sideways
// drift, so a label never ends up far from its own dot. Primary (cardinal) sides are tried
// first in a randomised order so labels don't all default to the same side; the four diagonal
// corners are the fallback. If none is overlap-free, the least-overlapping slot wins — a little
// overlap beats placing the label away from its dot.
const LABEL_PRIMARY = ['top', 'right', 'bottom', 'left'];
const LABEL_SECONDARY = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const REGION_LIST = ['All regions', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

// Category fill/border pair: fill stays the regular category colour, border is the darker
// shade used to outline a selected dot or a highlight label.
const fillColor = dev => (dev ? C_BLUE : C_YELLOW);
const borderColor = dev => (dev ? 'var(--un-color-blue-darkest)' : 'var(--un-color-yellow-darkest)');

// Fill for a dot: grey when another country is highlighted instead of this one, its category colour otherwise.
function dotFill(n, hlSet, hasHL) {
  if (hasHL && !hlSet.has(n.iso3)) return '#ccc';
  return fillColor(n.dev);
}

// Builds a candidate label box directly against the given side/corner of a highlighted dot.
function labelRectFor(node, pos, w, h) {
  const gap = node.r + LABEL_GAP;
  const diag = gap / Math.SQRT2;
  switch (pos) {
    case 'top':
      return { left: node.x - w / 2, right: node.x + w / 2, top: node.y - gap - h, bottom: node.y - gap };
    case 'bottom':
      return { left: node.x - w / 2, right: node.x + w / 2, top: node.y + gap, bottom: node.y + gap + h };
    case 'left':
      return { left: node.x - gap - w, right: node.x - gap, top: node.y - h / 2, bottom: node.y + h / 2 };
    case 'right':
      return { left: node.x + gap, right: node.x + gap + w, top: node.y - h / 2, bottom: node.y + h / 2 };
    case 'top-right':
      return { left: node.x + diag, right: node.x + diag + w, top: node.y - diag - h, bottom: node.y - diag };
    case 'bottom-right':
      return { left: node.x + diag, right: node.x + diag + w, top: node.y + diag, bottom: node.y + diag + h };
    case 'bottom-left':
      return { left: node.x - diag - w, right: node.x - diag, top: node.y + diag, bottom: node.y + diag + h };
    default:
      return { left: node.x - diag - w, right: node.x - diag, top: node.y - diag - h, bottom: node.y - diag };
  }
}

function clampRect(rect, bounds) {
  const r = { ...rect };
  if (r.left < bounds.left) {
    r.right += bounds.left - r.left;
    r.left = bounds.left;
  }
  if (r.right > bounds.right) {
    r.left -= r.right - bounds.right;
    r.right = bounds.right;
  }
  if (r.top < bounds.top) {
    r.bottom += bounds.top - r.top;
    r.top = bounds.top;
  }
  if (r.bottom > bounds.bottom) {
    r.top -= r.bottom - bounds.bottom;
    r.bottom = bounds.bottom;
  }
  return r;
}

const rectsOverlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

export default function EconomyBubbleChart({ countries, title, subtitle, description, source, note }) {
  const [region, setRegion] = useState('All regions');
  const [highlight, setHighlight] = useState([]);
  const [hlInput, setHlInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [chartW, setChartW] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const [socialData, setSocialData] = useState(null);

  const svgRef = useRef();
  const wrapRef = useRef();
  const hlRef = useRef();
  const highlightRef = useRef(highlight);
  const nodesRef = useRef([]);
  const labelsGroupRef = useRef(null);
  const dimsRef = useRef({ iW: 0, iH: 0 });
  useEffect(() => {
    highlightRef.current = highlight;
  }, [highlight]);

  const renderLabels = useCallback(hlList => {
    const labelsGroup = labelsGroupRef.current;
    if (!labelsGroup) return;
    labelsGroup.selectAll('*').remove();
    const hlSet = new Set(hlList);
    if (!hlSet.size) return;

    const { iW, iH } = dimsRef.current;
    const bounds = { left: -14, right: iW + 14, top: -38, bottom: iH + 26 };
    const allNodes = nodesRef.current;
    const hlNodes = allNodes.filter(n => hlSet.has(n.iso3)).sort((a, b) => a.x - b.x);
    if (!hlNodes.length) return;

    // Measure label widths off-screen so box sizing matches the actual rendered text.
    const measureG = labelsGroup.append('g').attr('visibility', 'hidden');
    const widths = new Map();
    hlNodes.forEach(n => {
      const t = measureG.append('text').attr('class', 'ebc_label_text').text(n.name);
      widths.set(n.iso3, t.node().getBBox().width);
    });
    measureG.remove();

    const placed = [];
    hlNodes.forEach(n => {
      const w = (widths.get(n.iso3) || 40) + LABEL_PAD_X * 2;
      const h = LABEL_H;

      const candidates = [...shuffled(LABEL_PRIMARY), ...LABEL_SECONDARY];
      let best = null;
      let bestOverlap = Infinity;
      for (const pos of candidates) {
        const clamped = clampRect(labelRectFor(n, pos, w, h), bounds);
        let overlapCount = 0;
        placed.forEach(p => {
          if (rectsOverlap(clamped, p)) overlapCount += 1;
        });
        if (overlapCount < bestOverlap) {
          bestOverlap = overlapCount;
          best = clamped;
        }
        if (overlapCount === 0) break;
      }
      placed.push(best);

      const labelG = labelsGroup.append('g').attr('class', 'ebc_label').attr('transform', `translate(${best.left},${best.top})`);
      labelG.append('rect').attr('class', 'ebc_label_rect').attr('width', w).attr('height', h).attr('rx', LABEL_R).style('fill', fillColor(n.dev));
      labelG
        .append('text')
        .attr('class', 'ebc_label_text')
        .attr('x', w / 2)
        .attr('y', h / 2 + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(n.name);
    });
  }, []);

  useEffect(() => {
    loadFile('assets/data/cdde_social_context.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setSocialData(d);
      });
  }, []);

  const visible = useMemo(
    () =>
      (countries || []).filter(c => {
        const v = c.export_dependence;
        if (v == null || Number.isNaN(v)) return false;
        if (region === 'All regions') return true;
        return REGION_GROUPS[region]?.includes(c.region);
      }),
    [countries, region]
  );

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
    const H = W < 420 ? 250 : W < 600 ? 300 : 300;
    const M = { top: 40, right: 16, bottom: 28, left: 16 };
    const iW = W - M.left - M.right;
    const iH = H - M.top - M.bottom;

    const xScale = d3.scaleLinear().domain([0, 100]).range([0, iW]);

    const getPop = c => socialData?.[c.iso3]?.population ?? 5000;
    const maxPop = d3.max(visible, c => getPop(c)) || 1400000;
    const maxR = W < 450 ? 20 : W < 600 ? 25 : W < 800 ? 30 : 50;
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

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${iH})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat(v => `${v}`)
      )
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line').attr('stroke', 'var(--un-color-grey-light)'))
      .call(ax => ax.selectAll('text').style('fill', 'var(--un-color-grey-text)').style('font-size', 'var(--un-font-size-xxxs)'))
      .call(ax =>
        ax
          .selectAll('.tick text')
          .filter((_d, i, nodes) => i === nodes.length - 1)
          .text(d => `${d}%`)
      );

    // 60% threshold vertical line
    const tx = xScale(60);
    g.append('line').attr('x1', tx).attr('x2', tx).attr('y1', 0).attr('y2', iH).attr('stroke', C_YELLOW).attr('stroke-width', 1.5).attr('stroke-dasharray', '5,4');

    // 60% threshold pill
    const pillX = Math.min(iW - PILL_W - 2, Math.max(2, tx - PILL_W / 2));
    const arrowCX = Math.max(PILL_ARROW + 2, Math.min(PILL_W - PILL_ARROW - 2, tx - pillX));
    const pillG = g.append('g').attr('transform', `translate(${pillX},${-PILL_H - PILL_ARROW - 4})`);
    pillG.append('rect').attr('width', PILL_W).attr('height', PILL_H).attr('rx', PILL_R).attr('fill', C_YELLOW);
    pillG
      .append('text')
      .attr('x', PILL_W / 2)
      .attr('y', PILL_H - 5)
      .attr('text-anchor', 'middle')
      .attr('class', 'dot_pill_label')
      .text('60% threshold');
    pillG
      .append('polygon')
      .attr('points', `${arrowCX - PILL_ARROW},${PILL_H} ${arrowCX + PILL_ARROW},${PILL_H} ${arrowCX},${PILL_H + PILL_ARROW}`)
      .attr('fill', C_YELLOW);

    // Dots — initial colors from ref so highlight state doesn't cause a redraw
    const hlSet = new Set(highlightRef.current);
    const hasHL = hlSet.size > 0;

    g.selectAll('circle')
      .data(nodes, d => d.iso3)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 0)
      .style('fill', d => dotFill(d, hlSet, hasHL))
      .attr('opacity', d => (hasHL && !hlSet.has(d.iso3) ? 0.25 : 0.82))
      .style('stroke', d => (hlSet.has(d.iso3) ? borderColor(d.dev) : 'none'))
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setHighlight(prev => (prev.includes(d.iso3) ? prev.filter(iso3 => iso3 !== d.iso3) : [...prev, d.iso3]));
      })
      .on('mouseover', (event, d) => {
        const rect = wrapRef.current.getBoundingClientRect();
        setTooltip({ left: event.clientX - rect.left, top: event.clientY - rect.top, name: d.name, val: d.val });
      })
      .on('mousemove', (event, d) => {
        const rect = wrapRef.current.getBoundingClientRect();
        setTooltip({ left: event.clientX - rect.left, top: event.clientY - rect.top, name: d.name, val: d.val });
      })
      .on('mouseout', () => setTooltip(null))
      .transition()
      .duration(1000)
      .delay((_d, i) => i * 2)
      .attr('r', d => d.r);

    nodesRef.current = nodes;
    dimsRef.current = { iW, iH };
    labelsGroupRef.current = g.append('g').attr('class', 'ebc_labels');
    renderLabels(highlightRef.current);

    d3.select(svgRef.current).on('mouseleave', () => setTooltip(null));
  }, [visible, chartW, socialData, renderLabels]);

  useEffect(() => {
    if (!svgRef.current) return;
    const hlSet = new Set(highlight);
    const hasHL = hlSet.size > 0;
    d3.select(svgRef.current)
      .selectAll('circle')
      .style('fill', d => dotFill(d, hlSet, hasHL))
      .attr('opacity', d => (hasHL && !hlSet.has(d.iso3) ? 0.25 : 0.82))
      .style('stroke', d => (hlSet.has(d.iso3) ? borderColor(d.dev) : 'none'));
    renderLabels(highlight);
  }, [highlight, renderLabels]);

  const handleHlInput = e => {
    const val = e.target.value;
    setHlInput(val);
    const q = val.toLowerCase().trim();
    const pool = countries || [];
    setSuggestions(q ? pool.filter(c => c.name.toLowerCase().includes(q)) : pool);
  };

  const handleHlFocus = () => {
    setSuggestions(countries || []);
  };

  useEffect(() => {
    const handler = e => {
      if (hlRef.current && !hlRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addHighlight = c => {
    if (!highlight.includes(c.iso3)) setHighlight(prev => [...prev, c.iso3]);
    setHlInput('');
    setSuggestions([]);
  };

  return (
    <div className="ebc_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />

      <div className="ebc_divider" />

      <div className="ebc_controls" ref={hlRef}>
        <div className="ebc_control_group">
          <span className="ebc_control_label">REGION</span>
          <div className="ebc_select_wrap">
            <select className="ebc_select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGION_LIST.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <svg className="ebc_chevron" viewBox="0 0 12 8" aria-hidden="true">
              <path d="M1 1l5 5 5-5" />
            </svg>
          </div>
        </div>

        <div className="ebc_hl_bar">
          <span className="ebc_hl_label">HIGHLIGHT</span>
          <div className="ebc_hl_input_wrap">
            <input className="ebc_hl_input" type="text" placeholder="Click or type to add a country" value={hlInput} onChange={handleHlInput} onFocus={handleHlFocus} />
            {suggestions.length > 0 && (
              <div className="ebc_suggestions">
                {suggestions.map(c => (
                  <button type="button" key={c.iso3} className="ebc_suggestion_item" onMouseDown={() => addHighlight(c)}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {highlight.length > 0 && (
            <button type="button" className="ebc_hl_clear" onClick={() => setHighlight([])}>
              Clear all
            </button>
          )}
        </div>
      </div>

      <div ref={wrapRef} className="ebc_chart_wrap">
        {!countries && <div className="ebc_loading" />}
        <svg ref={svgRef} />
        {tooltip && (
          <ChartTooltip left={tooltip.left} top={tooltip.top} flip={tooltip.left > chartW * 0.6}>
            <div className="ebc_tt_name">{tooltip.name}</div>
            <div className="ebc_tt_row">
              <span className="ebc_tt_label">Export dependence</span>
              <span className="ebc_tt_val">{tooltip.val.toFixed(1)}%</span>
            </div>
          </ChartTooltip>
        )}
      </div>

      <div className="ebc_legend">
        <div className="ebc_legend_left">
          <div className="ebc_legend_item">
            <span className="cdde_legend_dot cdde_legend_dot--blue" />
            <span className="ebc_legend_label">Developed</span>
          </div>
          <div className="ebc_legend_item">
            <span className="cdde_legend_dot cdde_legend_dot--yellow" />
            <span className="ebc_legend_label">Developing</span>
          </div>
        </div>
        <div className="ebc_legend_sep" />
        <div className="ebc_legend_right">
          <span className="ebc_size_legend">
            <span className="ebc_size_dot ebc_size_dot--s" />
            <span className="ebc_size_dot ebc_size_dot--m" />
            <span className="ebc_size_dot ebc_size_dot--l" />
          </span>
          <span className="ebc_legend_label">= population</span>
        </div>
      </div>

      <ChartMeta source={source} note={note} sourceKey={['Commodity Dependence, 2022–2024', 'Constant GDP']} />
    </div>
  );
}
