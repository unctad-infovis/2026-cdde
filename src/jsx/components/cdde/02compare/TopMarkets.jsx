import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import HorizBar from '../shared/HorizBar';

import './TopMarkets.css';

const W = 560;
const H = 320;
const MIN_PCT = 1;

const BLUE_SCALE = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolate('#005392', '#009edb'));

function buildTreemap(markets) {
  const named = markets.filter(m => m.pct >= MIN_PCT);
  const smallSum = markets.filter(m => m.pct < MIN_PCT).reduce((s, m) => s + m.pct, 0);
  const knownSum = markets.reduce((s, m) => s + m.pct, 0);
  const otherSum = smallSum + Math.max(0, 100 - knownSum);

  const children = [
    ...named.map(m => ({ label: m.label, pct: m.pct })),
    ...(otherSum > 0 ? [{ label: 'Other', pct: +otherSum.toFixed(1) }] : []),
  ];

  const root = d3.hierarchy({ children })
    .sum(d => d.pct)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([W, H])
    .paddingOuter(2)
    .paddingInner(2)
    .round(true)(root);

  return root.leaves();
}

export default function TopMarkets({ iso3 }) {
  const [allData, setAllData] = useState(null);
  const [showTree, setShowTree] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    loadFile('assets/data/cdde_top_markets.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const markets = allData?.[iso3] ?? null;
  const leaves = useMemo(() => (markets && showTree) ? buildTreemap(markets) : null, [markets, showTree]);

  function handleMouseMove(e, leaf) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setTooltip({ label: leaf.data.label, pct: leaf.data.pct, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className="cdde_card">
      <div className="tm_header_row">
        <ChartHeader
          title="Top destination markets"
          subtitle="% of total merchandise exports · 2022–2024"
        />
        {markets && (
          <button className="tm_toggle_btn" onClick={() => setShowTree(v => !v)}>
            {showTree ? 'Hide treemap' : 'Show treemap'}
          </button>
        )}
      </div>

      <div className="cdde_card_body">
        {!allData && <div className="cdde_loading" style={{ height: 120 }} />}

        {allData && !markets && (
          <p className="cdde_no_data">Destination market data not available for this country.</p>
        )}

        {markets && !showTree && (
          <div className="cdde_bars">
            {markets.map((item, i) => (
              <HorizBar key={i} label={item.label} pct={item.pct} color="var(--un-color-blue)" />
            ))}
          </div>
        )}
      </div>

      {leaves && (
        <div className="tm_wrap" ref={wrapRef}>
          <svg viewBox={`0 0 ${W} ${H}`} className="tm_svg" aria-label="Treemap of destination markets">
            {leaves.map((leaf, i) => {
              const lw = leaf.x1 - leaf.x0;
              const lh = leaf.y1 - leaf.y0;
              const isOther = leaf.data.label === 'Other';
              const fill = isOther ? '#aea29a' : BLUE_SCALE(leaf.data.pct);
              const cx = leaf.x0 + lw / 2;
              const cy = leaf.y0 + lh / 2;
              const showLabel = lw >= 32 && lh >= 28;
              const sm = lw < 70;

              return (
                <g key={i}
                  onMouseMove={e => handleMouseMove(e, leaf)}
                  onMouseLeave={() => setTooltip(null)}
                  className="tm_cell"
                >
                  <rect x={leaf.x0} y={leaf.y0} width={lw} height={lh} fill={fill} rx={2} />
                  {showLabel && (
                    <>
                      <text x={cx} y={lh > 48 ? cy - 7 : cy - 5} textAnchor="middle" className={`tm_label${sm ? ' tm_label--sm' : ''}`}>
                        {leaf.data.label}
                      </text>
                      <text x={cx} y={lh > 48 ? cy + 11 : cy + 9} textAnchor="middle" className={`tm_pct${sm ? ' tm_pct--sm' : ''}`}>
                        {leaf.data.pct}%
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {tooltip && (
            <div
              className={`tm_tooltip${tooltip.x > W * 0.6 ? ' tm_tooltip--flip' : ''}`}
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="tm_tt_name">{tooltip.label}</div>
              <div className="tm_tt_pct">{tooltip.pct}%</div>
            </div>
          )}
        </div>
      )}

      <ChartSource>UNCTADstat (2025), bilateral trade flows.</ChartSource>
    </div>
  );
}
