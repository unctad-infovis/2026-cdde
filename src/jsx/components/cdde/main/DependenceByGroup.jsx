import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import useIsVisible from '../../../helpers/UseIsVisible';
import ChartHeader from '../shared/ChartHeader';
import ChartMeta from '../shared/ChartMeta';
import ChartTooltip from '../shared/ChartTooltip';

import './DependenceByGroup.css';

const BANDS = [
  { key: 'below60', label: 'Non-commodity-dependent (<60%)', color: 'var(--un-color-blue)' },
  { key: 'band60_80', label: '60–80%', color: 'var(--un-color-yellow)' },
  { key: 'above80', label: '>80%', color: 'var(--un-color-red)' }
];

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function DependenceByGroup({ insight, note, source, subtitle, title }) {
  const [data, setData] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const wrapRef = useRef(null);
  const [visRef, isVisible] = useIsVisible(0.2);
  const [svgW, setSvgW] = useState(400);

  useLayoutEffect(() => {
    if (!data) return;
    const el = wrapRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    if (w > 0) setSvgW(w);
    const ro = new ResizeObserver(([entry]) => setSvgW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  function handleMouseMove(e, d) {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTooltip({ left: e.clientX - r.left, top: e.clientY - r.top, d });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  useEffect(() => {
    loadFile('assets/data/cdde_dependence_by_group.csv')
      .then(r => r?.text())
      .then(text => {
        if (!text) return;
        const rows = CSVtoJSON(text).filter(r => r.group);
        setData(
          rows.map(r => ({
            group: r.group,
            group_short: (r.group_short || r.group).replace(/~/g, '\n'),
            total: +r.total,
            below60: +r.below60,
            band60_80: +r.band60_80,
            above80: +r.above80
          }))
        );
      });
  }, []);

  const animated = isVisible || REDUCED_MOTION;

  if (!data) {
    return (
      <div className="dbg_container cdde_reveal" ref={visRef}>
        <div className="dbg_loading" />
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total));
  const yMax = Math.ceil(maxTotal / 10) * 10 + 10;
  const yTicks = [];
  for (let v = 0; v <= yMax; v += 20) yTicks.push(v);

  const H = 280;
  const PAD = { top: 16, right: 16, bottom: 40, left: 32 };
  const chartW = svgW - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const barW = Math.floor(chartW / data.length) - 10;
  const gap = Math.floor((chartW - barW * data.length) / (data.length + 1));

  function yScale(v) {
    return chartH - (v / yMax) * chartH;
  }

  function barX(i) {
    return gap + i * (barW + gap);
  }

  return (
    <div className="dbg_container cdde_reveal" ref={visRef}>
      <ChartHeader title={title} subtitle={subtitle} large />

      {insight && <p className="cdde_insight">{insight}</p>}

      <div className="cdde_legend_row">
        {BANDS.map(b => (
          <span key={b.key} className="cdde_legend_item">
            <span className="cdde_legend_dot cdde_legend_dot--sq" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>

      <div className="dbg_chart_wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${svgW} ${H}`} className={`dbg_svg${animated ? ' dbg_svg--animated' : ''}`} aria-label="Stacked bar chart of commodity dependence by country group" onMouseLeave={handleMouseLeave}>
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y grid lines and labels */}
            {yTicks.map(v => (
              <g key={v} transform={`translate(0,${yScale(v)})`}>
                <line x1={0} x2={chartW} stroke="var(--un-color-grey-lighest)" strokeWidth={1} />
                <text x={-6} y={4} textAnchor="end" className="dbg_axis_label">
                  {v}
                </text>
              </g>
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const x = barX(i);
              let yOffset = chartH;
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: SVG bar group hover target
                <g key={d.group} onMouseMove={e => handleMouseMove(e, d)}>
                  {BANDS.map(band => {
                    const h = (d[band.key] / yMax) * chartH;
                    yOffset -= h;
                    const showLabel = d[band.key] > 0;
                    return (
                      <g key={band.key}>
                        <rect x={x} y={yOffset} width={barW} height={h} fill={band.color} style={{ transitionDelay: `${500 + i * 80}ms` }} />
                        {showLabel && h > 14 && (
                          <text x={x + barW / 2} y={yOffset + h / 2 + 4} textAnchor="middle" className="dbg_bar_label" style={{ transitionDelay: `${500 + i * 80 + 480}ms` }}>
                            {d[band.key]}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* X axis label */}
                  <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" className="dbg_x_label">
                    {d.group_short.split('\n').map((line, li) => (
                      <tspan key={line} x={x + barW / 2} dy={li === 0 ? '0.2em' : '1.2em'}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {tooltip && (
          <ChartTooltip left={tooltip.left} top={tooltip.top} flip={!!(wrapRef.current && tooltip.left > wrapRef.current.clientWidth * 0.6)}>
            <div className="dbg_tt_name">{tooltip.d.group}</div>
            {BANDS.map(band => (
              <div key={band.key} className="dbg_tt_row">
                <span className="dbg_tt_dot" style={{ background: band.color }} />
                <span className="dbg_tt_label">{band.label}</span>
                <span className="dbg_tt_val">{tooltip.d[band.key]}</span>
              </div>
            ))}
            <div className="dbg_tt_total">
              <span className="dbg_tt_label">Total</span>
              <span className="dbg_tt_val">{tooltip.d.total}</span>
            </div>
          </ChartTooltip>
        )}
      </div>

      <ChartMeta source={source} note={note} />
    </div>
  );
}
