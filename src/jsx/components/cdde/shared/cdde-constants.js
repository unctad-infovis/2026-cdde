export function axisFmt(v, step) {
  if (v === 0) return '0';
  if (step >= 1) return `${Math.round(v)}`;
  if (step >= 0.1) return v.toFixed(1);
  return v.toFixed(2);
}

// Shared chart colours — use these everywhere instead of inline hex
export const C_YELLOW = '#fbaf17';
export const C_BLUE = '#009edb';

export const GROUP_COLORS = {
  agri: '#72bf44',
  energy: '#a05fb4',
  mining: C_YELLOW,
  'non-dependent': '#aea29a',
};

export const DEP_COLOR_SCALE = [
  { threshold: 0,  color: '#d8d8d8' },
  { threshold: 20, color: '#b0b0b0' },
  { threshold: 40, color: '#7c7c7c' },
  { threshold: 60, color: '#0077b8' },
  { threshold: 80, color: '#004987' },
];

export const NO_DATA_FILL = '#f0f0f0';

export function depColor(pct) {
  if (pct > 80) return '#a71f36';
  if (pct > 60) return C_YELLOW;
  return C_BLUE;
}

export const REGION_GROUPS = {
  Africa: ['Northern Africa', 'Eastern Africa', 'Middle Africa', 'Southern Africa', 'Western Africa'],
  Americas: ['Caribbean', 'Central America', 'Northern America', 'South America'],
  Asia: ['Central Asia', 'Eastern Asia', 'South-eastern Asia', 'Southern Asia', 'Western Asia'],
  Europe: ['Eastern Europe', 'Northern Europe', 'Southern Europe', 'Western Europe'],
  Oceania: ['Oceania']
};

export const DEVELOPED = new Set(['AUS', 'AUT', 'BEL', 'CAN', 'CHE', 'CZE', 'DEU', 'DNK', 'ESP', 'EST', 'FIN', 'FRA', 'GBR', 'GRC', 'HUN', 'IRL', 'ISL', 'ISR', 'ITA', 'JPN', 'KOR', 'LTU', 'LUX', 'LVA', 'NLD', 'NOR', 'NZL', 'POL', 'PRT', 'SVK', 'SVN', 'SWE', 'USA']);
