import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './GroupBandsChart.css';

const BANDS = [
  { key: 'below60', label: '≤60%', color: 'var(--un-color-blue)' },
  { key: 'band60_80', label: '60–80%', color: 'var(--un-color-yellow)' },
  { key: 'above80', label: '>80%', color: 'var(--un-color-red-dark)' },
];

export default function GroupBandsChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_group_bands.json')
      .then(r => r?.json())
      .then(d => { if (d) setData(d); });
  }, []);

  if (!data) return <div className="gbc_loading" />;

  const maxTotal = Math.max(...data.map(d => d.total));
  const yMax = Math.ceil(maxTotal / 10) * 10 + 10;
  const yTicks = [];
  for (let v = 0; v <= yMax; v += 20) yTicks.push(v);

  const W = 400;
  const H = 280;
  const PAD = { top: 16, right: 16, bottom: 40, left: 32 };
  const chartW = W - PAD.left - PAD.right;
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
    <div className="gbc_container">
      <ChartHeader
        title="Commodity dependence by country group"
        subtitle="One column per group · ≤60%, 60–80%, >80% bands · 2022–2024"
      />

      <p className="gbc_insight">
        <strong className="gbc_insight_bold">Developing economies dominate</strong> the ranks of countries exceeding the 80% commodity-dependence threshold, while developed nations remain the exception.
      </p>

      <div className="gbc_chart_wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="gbc_svg" aria-label="Stacked bar chart of commodity dependence by country group">
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y grid lines and labels */}
            {yTicks.map(v => (
              <g key={v} transform={`translate(0,${yScale(v)})`}>
                <line x1={0} x2={chartW} stroke="var(--un-color-grey-lighest)" strokeWidth={1} />
                <text x={-6} y={4} textAnchor="end" className="gbc_axis_label">{v}</text>
              </g>
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const x = barX(i);
              let yOffset = chartH;
              return (
                <g key={d.group}>
                  {BANDS.map(band => {
                    const h = (d[band.key] / yMax) * chartH;
                    yOffset -= h;
                    const showLabel = d[band.key] > 0;
                    return (
                      <g key={band.key}>
                        <rect
                          x={x}
                          y={yOffset}
                          width={barW}
                          height={h}
                          fill={band.color}
                          rx={band.key === 'above80' ? 3 : 0}
                        />
                        {showLabel && h > 14 && (
                          <text
                            x={x + barW / 2}
                            y={yOffset + h / 2 + 4}
                            textAnchor="middle"
                            className="gbc_bar_label"
                          >
                            {d[band.key]}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* X axis label */}
                  <text
                    x={x + barW / 2}
                    y={chartH + 14}
                    textAnchor="middle"
                    className="gbc_x_label"
                  >
                    {d.group_short.split('\n').map((line, li) => (
                      <tspan key={li} x={x + barW / 2} dy={li === 0 ? 0 : '1.2em'}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="gbc_legend">
        {BANDS.map(b => (
          <span key={b.key} className="gbc_legend_item">
            <span className="gbc_legend_dot" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). UN Trade and Development (UNCTAD) development groupings.</ChartSource>
    </div>
  );
}
