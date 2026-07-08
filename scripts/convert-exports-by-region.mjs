/**
 * Converts data/Export concentration(MAPS).xlsx
 * → public/assets/data/cdde_exports_by_region.csv
 *
 * Expected Excel columns (one row per country):
 *   A: region      — parent region (Europe / Asia / Americas / Africa / Oceania)
 *   B: subregion   — sub-region label shown on the chart
 *   C: country     — country name
 *   D: value       — commodity exports, millions of dollars, 2022–2024 average (0 if no data)
 *
 * Example rows:
 *   Europe  Southern Europe  Spain   121370
 *   Europe  Southern Europe  Italy   118825
 *   Europe  Southern Europe  Holy See  0
 */

import { createRequire } from 'module';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT  = resolve(ROOT, 'data', 'Export concentration(MAPS).xlsx');
const OUTPUT = resolve(ROOT, 'public', 'assets', 'data', 'cdde_exports_by_region.csv');

const wb    = XLSX.readFile(INPUT);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const header = ['region', 'subregion', 'country', 'value'];
const out    = [header.join(',')];

for (let i = 1; i < rows.length; i++) {
  const [region, subregion, country, value] = rows[i].map(c => String(c || '').trim());
  if (!region || !subregion || !country) continue;
  out.push([region, subregion, country, +value || 0].join(','));
}

createWriteStream(OUTPUT).end(out.join('\r\n') + '\r\n');
console.log(`✓ ${out.length - 1} rows → ${OUTPUT}`);
