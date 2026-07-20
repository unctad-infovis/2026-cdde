/**
 * Converts data/Group bands(MAPS).xlsx
 * → public/assets/data/cdde_dependence_by_group.csv
 *
 * Expected Excel columns:
 *   A: group        — country group label  (e.g. "Developed countries")
 *   B: group_short  — short label for x-axis, use ~ for line breaks  (e.g. "Developed~countries")
 *   C: total        — total economies in the group
 *   D: below60      — economies with commodity share ≤60%
 *   E: band60_80    — economies with commodity share 60–80%
 *   F: above80      — economies with commodity share >80%
 *
 * Example row:
 *   Developed countries  Developed~countries  43  40  2  1
 */

import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(ROOT, 'data', 'Group bands(MAPS).xlsx');
const OUTPUT = resolve(ROOT, 'public', 'assets', 'data', 'cdde_dependence_by_group.csv');

const wb = XLSX.readFile(INPUT);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const header = ['group', 'group_short', 'total', 'below60', 'band60_80', 'above80'];
const out = [header.join(',')];

for (let i = 1; i < rows.length; i++) {
  const [group, groupShort, total, below60, band60_80, above80] = rows[i].map(c => String(c || '').trim());
  if (!group || !total) continue;
  out.push([group, groupShort || group, +total, +below60, +band60_80, +above80].join(','));
}

createWriteStream(OUTPUT).end(`${out.join('\r\n')}\r\n`);
console.log(`✓ ${out.length - 1} rows → ${OUTPUT}`);
