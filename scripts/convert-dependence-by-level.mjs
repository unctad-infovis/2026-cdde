/**
 * Converts data/Avg by level(MAPS).xlsx
 * → public/assets/data/cdde_dependence_by_level.csv
 *
 * Expected Excel columns:
 *   A: group      — country group label  (use "Developed" for the developed group — bar turns green)
 *   B: economies  — number of economies in the group
 *   C: avg_pct    — mean commodity export share, 0–100  (e.g. 79.7)
 *
 * Example rows:
 *   LLDCs   32  79.7
 *   LDCs    44  79.5
 *   SIDS    38  65.9
 *   Other developing  89  61.3
 *   Developed         40  36.0
 *
 * Note: the bar colour is derived automatically — "Developed" → green, all others → blue.
 */

import { createRequire } from 'module';
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT  = resolve(ROOT, 'data', 'Avg by level(MAPS).xlsx');
const OUTPUT = resolve(ROOT, 'public', 'assets', 'data', 'cdde_dependence_by_level.csv');

const wb    = XLSX.readFile(INPUT);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const LABEL_RENAME = {
  'Other developing': 'Other developing economies',
  'Developed':        'Developed economies',
};

const header = ['group', 'economies', 'avg_pct'];
const out    = [header.join(',')];

for (let i = 1; i < rows.length; i++) {
  const [rawGroup, economies, avg_pct] = rows[i].map(c => String(c || '').trim());
  if (!rawGroup || !avg_pct) continue;
  const group = LABEL_RENAME[rawGroup] ?? rawGroup;
  out.push([group, +economies, +avg_pct].join(','));
}

createWriteStream(OUTPUT).end(out.join('\r\n') + '\r\n');
console.log(`✓ ${out.length - 1} rows → ${OUTPUT}`);
