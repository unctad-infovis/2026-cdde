/**
 * Converts data/Commodity dependence(MAPS).xlsx
 * → public/assets/data/cdde_dependence_map.csv
 *
 * Expected Excel columns:
 *   A: ISO code 3 (numeric)   B: ISO Alpha 3   C: ISO Alpha 2
 *   D: Country                E: region         F: SCD computed (0–1)
 *   G: Agricultural products  H: Energy         I: Mining
 */

import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(ROOT, 'data', 'Commodity dependence(MAPS).xlsx');
const OUTPUT = resolve(ROOT, 'public', 'assets', 'data', 'cdde_dependence_map.csv');
const THRESHOLD = 0.6;

const wb = XLSX.readFile(INPUT);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const header = ['iso3', 'iso2', 'name', 'region', 'export_dependence', 'dominant_group', 'agri_pct', 'energy_pct', 'mining_pct'];
const out = [header.join(',')];

for (let i = 1; i < rows.length; i++) {
  const [, iso3Raw, iso2Raw, nameRaw, regionRaw, scdRaw, agri, energy, mining] = rows[i];

  const iso3 = String(iso3Raw || '').trim();
  if (!iso3) continue;

  const iso2 = String(iso2Raw || '')
    .trim()
    .toLowerCase();
  const name = String(nameRaw || '').trim();
  const region = String(regionRaw || '').trim();
  const scd = parseFloat(scdRaw);

  if (Number.isNaN(scd)) {
    // No data (e.g. Vatican, Monaco) — include with empty dependence
    out.push([iso3, iso2, name, region, '', '', '', '', ''].join(','));
    continue;
  }

  const exportDep = (scd * 100).toFixed(1);
  const agriPct = +agri > 0 ? (+agri * 100).toFixed(1) : '';
  const energyPct = +energy > 0 ? (+energy * 100).toFixed(1) : '';
  const miningPct = +mining > 0 ? (+mining * 100).toFixed(1) : '';

  let dominant;
  if (scd >= THRESHOLD) {
    const groups = [
      ['agri', +agri || 0],
      ['energy', +energy || 0],
      ['mining', +mining || 0]
    ];
    dominant = groups.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  } else {
    dominant = 'non-dependent';
  }

  out.push([iso3, iso2, name, region, exportDep, dominant, agriPct, energyPct, miningPct].join(','));
}

createWriteStream(OUTPUT).end(`${out.join('\r\n')}\r\n`);
console.log(`✓ ${out.length - 1} rows → ${OUTPUT}`);
