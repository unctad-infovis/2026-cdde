const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

// Fix HTML: convert absolute paths to relative so the site works at any subpath
// Also write .nojekyll for gh-pages
fs.writeFileSync('dist/.nojekyll', '');
for (const f of fs.readdirSync('dist').filter(f => f.endsWith('.html'))) {
  const p = path.join('dist', f);
  const html = fs.readFileSync(p, 'utf8');
  fs.writeFileSync(p, html.replace(/href="\/(?!\/)/g, 'href="./').replace(/src="\/(?!\/)/g, 'src="./'));
}

const ENTRIES = ['dist/js/2026-cdde.min.js', 'dist/js/2026-cdde-compare.min.js', 'dist/js/2026-cdde-header.min.js', 'dist/js/2026-cdde-know-more.min.js'];

// Chunk files that are dynamically imported by entry files and/or by other chunks.
// Rollup names these after one of the modules bundled into them, which can change
// whenever imports move between local files and packages, so discover them instead
// of hardcoding names.
const CHUNKS = fs
  .readdirSync('dist/js')
  .filter(f => f.endsWith('.js'))
  .map(f => path.join('dist/js', f))
  .filter(p => !ENTRIES.includes(p))
  .map(p => path.basename(p));

const ALL_JS = [...ENTRIES, ...CHUNKS.map(c => path.join('dist/js', c))];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyHashes(filePaths, hashes) {
  for (const filePath of filePaths) {
    let src = fs.readFileSync(filePath, 'utf8');
    for (const [chunk, hash] of Object.entries(hashes)) {
      src = src.replace(new RegExp(`${escapeRe(chunk)}(?:\\?[^"']*)?`, 'g'), `${chunk}?v=${hash}`);
    }
    fs.writeFileSync(filePath, src);
  }
}

// One random hash per build — same value for all chunks so inter-chunk imports stay consistent.
// A new hash on every build guarantees a CDN cache miss regardless of file content.
const deployHash = crypto.randomBytes(4).toString('hex');
const hashes = Object.fromEntries(CHUNKS.map(c => [c, deployHash]));
applyHashes(ALL_JS, hashes);

console.log('postbuild: deploy hash', deployHash, '— applied to', CHUNKS.join(', '));
