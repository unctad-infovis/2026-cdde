import * as d3 from 'd3';
import { useEffect, useMemo, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './ExportConcentration.css';

// Resolved hex values from colors.css — CSS vars can't be used directly in SVG fill attributes.
// Europe=blue, Asia=yellow, Americas=green, Oceania=red/pink, Africa=purple
const COLOR_MAP = {
  blue: '#009edb',
  yellow: '#fbaf17',
  green: '#72bf44',
  red: '#ed1847',
  purple: '#a05fb4',
};

const W = 960;
const H = 500;

function formatM(v) {
  return d3.format(',.0f')(Math.round(v)) + 'M';
}

export default function ExportConcentration() {
  const [rawData, setRawData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_export_concentration.json')
      .then(r => r?.json())
      .then(d => { if (d) setRawData(d); });
  }, []);

  const { leafNodes, regionNodes } = useMemo(() => {
    if (!rawData) return { leafNodes: [], regionNodes: [] };

    const root = d3.hierarchy(rawData)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);

    d3.treemap()
      .size([W, H])
      .paddingInner(2)
      .paddingOuter(2)
      .round(true)(root);

    return {
      leafNodes: root.leaves(),
      regionNodes: root.children || [],
    };
  }, [rawData]);

  function handleClick(node) {
    setSelected(prev => (prev?.data?.name === node.data.name ? null : node));
  }

  return (
    <div className="exc_container">
      <div className="exc_header_row">
        <ChartHeader
          title="Where commodity exports concentrate"
          subtitle="Commodity exports by sub-region, 2022–2024 average, millions of dollars"
          large
        />
        <span className="exc_hint">
          {selected ? `${selected.parent?.data?.name} › ${selected.data.name}` : 'Click a sub-region for country list →'}
        </span>
      </div>

      <p className="exc_insight">
        Global commodity exports are heavily concentrated in a few regions, with{' '}
        <strong className="exc_insight_bold">Asia and Europe dominating the landscape</strong>.
      </p>

      <div className="exc_chart_wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="exc_svg"
          aria-label="Treemap of commodity exports concentrated by sub-region"
        >
          {/* Sub-region leaf cells */}
          {leafNodes.map(node => {
            const colorKey = node.parent?.data?.color_key;
            const fill = COLOR_MAP[colorKey] || '#ccc';
            const w = node.x1 - node.x0;
            const h = node.y1 - node.y0;
            const isSelected = selected?.data?.name === node.data.name;
            const dimmed = selected && !isSelected;
            const showName = w > 90 && h > 46;
            const showValue = w > 60 && h > 26;

            return (
              <g key={node.data.name} onClick={() => handleClick(node)} className="exc_cell">
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={w}
                  height={h}
                  fill={fill}
                  opacity={dimmed ? 0.55 : 1}
                />
                {isSelected && (
                  <rect
                    x={node.x0 + 1.5}
                    y={node.y0 + 1.5}
                    width={w - 3}
                    height={h - 3}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2.5}
                    rx={1}
                  />
                )}
                {showName && (
                  <text
                    x={node.x0 + w / 2}
                    y={node.y0 + h / 2 - (showValue ? 9 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="exc_cell_name"
                  >
                    {node.data.name}
                  </text>
                )}
                {showValue && (
                  <text
                    x={node.x0 + w / 2}
                    y={node.y0 + h / 2 + (showName ? 11 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="exc_cell_value"
                  >
                    {formatM(node.data.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Region labels — rendered last so they sit on top */}
          {regionNodes.map(rNode => (
            <text
              key={rNode.data.name}
              x={rNode.x0 + 10}
              y={rNode.y0 + 22}
              className="exc_region_label"
              style={{ pointerEvents: 'none' }}
            >
              {rNode.data.name}
            </text>
          ))}
        </svg>
      </div>

      {/* Country list panel */}
      {selected && (
        <div className="exc_panel">
          <div className="exc_panel_header" style={{ borderLeftColor: COLOR_MAP[selected.parent?.data?.color_key] }}>
            <span className="exc_panel_region">{selected.parent?.data?.name}</span>
            <span className="exc_panel_sep"> › </span>
            <span className="exc_panel_subregion">{selected.data.name}</span>
            <span className="exc_panel_value">{formatM(selected.data.value)}</span>
            <button className="exc_panel_close" onClick={() => setSelected(null)} aria-label="Close">×</button>
          </div>
          <div className="exc_panel_countries">
            {(selected.data.countries || []).map(c => (
              <span key={c} className="exc_panel_country">{c}</span>
            ))}
          </div>
        </div>
      )}

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). Values in current millions of dollars, 2022–2024 average.</ChartSource>
    </div>
  );
}
