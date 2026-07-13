# 2026-cdde

**Live demo** https://unctad-infovis.github.io/2026-cdde/

## About

The State of Commodity Dependence of the World 2026 is a UNCTAD flagship publication tracking how dependent economies are on commodity exports. This project is the interactive web publication presenting the report's key findings through a scrollytelling minisite with narrative text, data visualisations, and an interactive country data tool.

The publication consists of three pages:

- **Main page** – a scrollytelling narrative with animated charts covering global commodity dependence trends, including a world map, bubble charts, dumbbell charts, and time-series visualisations across 191 UNCTAD member states.
- **Country data page** – an interactive tool with three tabs: (1) a deep-dive country profile with 10+ charts per economy, (2) a side-by-side comparison of up to 3 economies, and (3) a variable ranking league table.
- **Know more page** – supplementary context, methodology, and background material.

Content is authored in MDX and rendered as a standalone React application embeddable within UNCTAD's Drupal platform.

## Embedding

### Main publication page

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-cdde/js/2026-cdde.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-cdde/css/2026-cdde.min.css?v=1">
<div class="app-root-2026-cdde" id="app-root-2026-cdde">
  Loading...
</div>
```

### Country data page

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-cdde/js/2026-cdde-compare.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-cdde/css/2026-cdde.min.css?v=1">
<div class="app-root-2026-cdde" id="app-root-2026-cdde">
  Loading...
</div>
```

### Know more page

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-cdde/js/2026-cdde-know-more.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-cdde/css/2026-cdde.min.css?v=1">
<div class="app-root-2026-cdde" id="app-root-2026-cdde">
  Loading...
</div>
```

### Header

A standalone hero header with the publication title and navigation bar, intended for embedding at the top of a Drupal page that hosts the main publication.

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-cdde/js/2026-cdde-header.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-cdde/css/2026-cdde.min.css?v=1">
<div class="app-root-2026-cdde" id="app-root-2026-cdde">
  Loading...
</div>
```

Update the `?v=` query parameter to match the current build version to bust the cache.

## Rights of usage

Contact Teemo Tebest.

## How to build and develop

This is a Vite + React project.

* `npm install`
* `npm run start`

Project should start at: http://localhost:8080

For developing please refer to `package.json`

## Files and folders

All public assets go to folder `public`.

All source code goes to folder `src`.

### Source structure

```
src/
  jsx/
    components/
      cdde/
        main/         – main publication page components
        country_data/ – country data tool (profile/, compare/, ranking/)
        shared/       – shared chart and UI components
      general/        – generic reusable components (flags, buttons, etc.)
      minisite/       – minisite layout components (header, nav)
  styles/             – global CSS (colors, typography, layout)
  Main.mdx            – main page content
  CountryData.mdx     – country data page content
```

### Data files

All data files live in `public/assets/data/` and are loaded at runtime. They are generated from Excel source files provided by the CDDE team and must be updated each year when new data becomes available.

| File | Powers |
|---|---|
| `cdde_dependence_map.csv` | World map – commodity dependence choropleth |
| `cdde_dependence_by_level.csv` | Dependence by income level chart |
| `cdde_dependence_by_group.csv` | Dependence by commodity group chart |
| `cdde_dependence_movers.json` | Status changers dumbbell chart |
| `cdde_dependence_over_time.json` | Country-level dependence over time (line chart) |
| `cdde_exports_over_time.json` | Country-level commodity exports over time |
| `cdde_exports_by_region.csv` | Exports by region chart |
| `cdde_commodity_prices.json` | Commodity price index chart |
| `cdde_status_changers.json` | Countries crossing the 60% threshold (StatusChangers chart) |
| `cdde_commodity_groups.json` | Commodity group metadata and definitions |
| `cdde_export_composition.json` | Per-country ag/energy/mining/other export share breakdown (Commodity DNA) |
| `cdde_profile_stats.json` | Key stats per country (commodity dependence, leading market/commodity shares) |
| `cdde_leading_exports.json` | Top 3 commodity exports per country |
| `cdde_top_markets.json` | Top 3 export destination markets per country |
| `cdde_imports_over_time.json` | Commodity imports over time per country |
| `cdde_food_imports.json` | Food imports over time per country |
| `cdde_energy_imports.json` | Energy imports over time per country |
| `cdde_net_imports.json` | Net food and energy imports (two periods) |
| `cdde_macro_context.json` | Macro context indicators per country |
| `cdde_social_context.json` | Social context indicators per country |
| `cdde_ranking_indicators.json` | Variable ranking league table indicators |
| `cdde_sources.json` | Source references |
| `cdde_sitc3.json` | SITC Rev. 3 commodity classification labels |
| `world_countries.json` | World map country polygons (TopoJSON) |
| `world_borders.json` | World map country borders overlay (TopoJSON) |

## Packages

The following packages are used in this project by default.

### Project specific

* **d3** – used to create all custom SVG visualisations (maps, line charts, bubble charts, dumbbell charts)
* **topojson-client** – used to render the world map from TopoJSON geometry

### Build & Dev Server

* **vite** – development server with hot module replacement and production bundler, replaces webpack
* **@vitejs/plugin-react** – adds React and JSX support to Vite

### React

* **react** – UI component library
* **react-dom** – renders React components to the DOM

### Formatter & Linter

* **@biomejs/biome** – formats and lints JS, JSX and CSS files on save, replaces ESLint + Prettier

### Minification

* **terser** – minifies the production JavaScript bundle, removes console.logs in production builds

### MDX

* **@mdx-js/rollup** – Vite/Rollup plugin that compiles MDX files into React components
* **@mdx-js/react** – provides React context for MDX components
