import * as d3 from 'd3';
import { useEffect, useMemo, useState } from 'react';
import CSVtoJSON from '../../../helpers/CsvToJson';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';

import './ExportsByRegion.css';

const COLOR_MAP = {
  blue: 'var(--un-color-blue)',
  yellow: 'var(--un-color-yellow)',
  green: 'var(--un-color-green)',
  red: 'var(--un-color-red)',
  purple: 'var(--un-color-purple)'
};

const COLOR_DARK = {
  blue: '#007ab0',
  yellow: '#c98d00',
  green: '#5a9c33',
  red: '#bb0e35',
  purple: '#7d4a8d'
};

const REGION_COLOR = {
  Europe: 'blue',
  Asia: 'yellow',
  Americas: 'green',
  Africa: 'purple',
  Oceania: 'red'
};

const MIN_SHARE = 0.013;

function csvToHierarchy(rows) {
  const regionMap = new Map();
  for (const row of rows) {
    if (!row.region || !row.subregion || !row.country) continue;
    if (!regionMap.has(row.region)) {
      regionMap.set(row.region, { name: row.region, color_key: REGION_COLOR[row.region] || 'blue', subregions: new Map() });
    }
    const subs = regionMap.get(row.region).subregions;
    if (!subs.has(row.subregion)) subs.set(row.subregion, { name: row.subregion, countries: [] });
    subs.get(row.subregion).countries.push({ name: row.country, value: +row.value || 0 });
  }
  return [...regionMap.values()].map(r => ({
    name: r.name,
    color_key: r.color_key,
    children: [...r.subregions.values()].map(s => ({
      name: s.name,
      value: s.countries.reduce((sum, c) => sum + c.value, 0),
      countries: s.countries
    }))
  }));
}

const W = 960;
const H = 500;

function fmt(v) {
  return `${d3.format(',.0f')(Math.round(v)).replace(/,/g, ' ')}M`;
}

export default function ExportsByRegion() {
  const [regions, setRegions] = useState(null);
  const [drill, setDrill] = useState(null); // { regionName, subregionName }

  useEffect(() => {
    loadFile('assets/data/cdde_exports_by_region.csv')
      .then(r => r?.text())
      .then(text => {
        if (text) setRegions(csvToHierarchy(CSVtoJSON(text).filter(r => r.region)));
      });
  }, []);

  // Overview treemap — subregions as leaves
  const overview = useMemo(() => {
    if (!regions) return { leaves: [], regionNodes: [] };
    const root = d3
      .hierarchy({ name: 'World', children: regions })
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);
    d3.treemap().size([W, H]).paddingInner(2).paddingOuter(2).round(true)(root);
    return { leaves: root.leaves(), regionNodes: root.children || [] };
  }, [regions]);

  // Drilldown treemap — countries as leaves, with minimum floor
  const drillView = useMemo(() => {
    if (!drill || !regions) return null;
    const region = regions.find(r => r.name === drill.regionName);
    if (!region) return null;
    const sub = region.children.find(s => s.name === drill.subregionName);
    if (!sub) return null;

    const total = sub.value;
    const minVal = total * MIN_SHARE;
    const drillData = {
      name: sub.name,
      children: sub.countries.map(c => ({ ...c, displayValue: Math.max(c.value, minVal) }))
    };
    const root = d3
      .hierarchy(drillData)
      .sum(d => d.displayValue || 0)
      .sort((a, b) => b.data.value - a.data.value);
    d3.treemap().size([W, H]).paddingInner(2).paddingOuter(0).round(true)(root);

    return {
      nodes: root.leaves(),
      subName: sub.name,
      regionName: drill.regionName,
      countryCount: sub.countries.length,
      colorKey: region.color_key,
      total
    };
  }, [drill, regions]);

  function handleCellClick(node) {
    setDrill({ regionName: node.parent?.data?.name, subregionName: node.data.name });
  }

  const title = drill ? `${drill.subregionName} – Member States` : 'Where commodity exports concentrate';
  const subtitle = drill ? `${drill.regionName} › ${drill.subregionName} (${drillView?.countryCount ?? '–'} countries)` : 'Commodity exports by sub-region, 2022–2024 average, millions of dollars';

  return (
    <div className="exc_container">
      <ChartHeader title={title} subtitle={subtitle} large />

      {!drill && (
        <p className="exc_insight">
          Global commodity exports are heavily concentrated in a few regions, with <strong className="exc_insight_bold">Asia and Europe dominating the landscape</strong>.
        </p>
      )}

      <div className="exc_chart_wrap">
        {drill && (
          <button type="button" className="exc_back_btn" onClick={() => setDrill(null)}>
            ◄ Back to overview
          </button>
        )}

        <svg viewBox={`0 0 ${W} ${H}`} className="exc_svg" aria-label={drill ? `Treemap of ${drill.subregionName} countries` : 'Treemap of commodity exports by sub-region'}>
          {!drill && (
            <>
              {overview.leaves.map(node => {
                const colorKey = node.parent?.data?.color_key;
                const fill = COLOR_MAP[colorKey] || '#ccc';
                const w = node.x1 - node.x0;
                const h = node.y1 - node.y0;
                return (
                  <g key={node.data.name} onClick={() => handleCellClick(node)} className="exc_cell">
                    <rect x={node.x0} y={node.y0} width={w} height={h} fill={fill} />
                    {w > 90 && h > 46 && (
                      <text x={node.x0 + w / 2} y={node.y0 + h / 2 - (w > 60 && h > 26 ? 9 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_name">
                        {node.data.name}
                      </text>
                    )}
                    {w > 60 && h > 26 && (
                      <text x={node.x0 + w / 2} y={node.y0 + h / 2 + (w > 90 && h > 46 ? 11 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_value">
                        {fmt(node.data.value)}
                      </text>
                    )}
                  </g>
                );
              })}
              {overview.regionNodes.map(rNode => (
                <text key={rNode.data.name} x={rNode.x0 + 10} y={rNode.y0 + 22} className="exc_region_label" style={{ pointerEvents: 'none' }}>
                  {rNode.data.name}
                </text>
              ))}
            </>
          )}

          {drill &&
            drillView?.nodes.map(node => {
              const w = node.x1 - node.x0;
              const h = node.y1 - node.y0;
              const hasValue = node.data.value > 0;
              const fill = hasValue ? COLOR_MAP[drillView.colorKey] : COLOR_DARK[drillView.colorKey];
              const showName = w > 48 && h > 22;
              const showValue = w > 52 && h > 38;
              return (
                <g key={node.data.name} className="exc_cell exc_cell--country">
                  <rect x={node.x0} y={node.y0} width={w} height={h} fill={fill} />
                  {showName && (
                    <text x={node.x0 + w / 2} y={node.y0 + h / 2 - (showValue ? 9 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_name">
                      {node.data.name}
                      {!hasValue ? '*' : ''}
                    </text>
                  )}
                  {showValue && (
                    <text x={node.x0 + w / 2} y={node.y0 + h / 2 + (showName ? 11 : 0)} textAnchor="middle" dominantBaseline="middle" className="exc_cell_value">
                      {fmt(node.data.value)}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {drill && <p className="exc_drill_note">Tile size uses a minimum share of the sub-region total so every member economy is visible; dollar amounts are actual commodity exports (2022–2024 average $M). * indicates no reported value in the source data for this period.</p>}

      <ChartSource>UN Trade and Development (UNCTAD) secretariat calculations, based on UNCTADstat (2025). Values in current millions of dollars, 2022–2024 average.</ChartSource>
    </div>
  );
}
