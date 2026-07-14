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

// Chunk files that are dynamically imported by entry files and/or by other chunks.
const CHUNKS = [
  '2026-cdde.BackToTop.js',
  '2026-cdde.cdde-patterns.js',
  '2026-cdde.KnowMore.js',
  '2026-cdde.MiniHeader.js',
  '2026-cdde.UNCTADSiteHeader.js',
];

const ENTRIES = [
  'dist/js/2026-cdde.min.js',
  'dist/js/2026-cdde-compare.min.js',
  'dist/js/2026-cdde-header.min.js',
  'dist/js/2026-cdde-know-more.min.js',
];

const ALL_JS = [...ENTRIES, ...CHUNKS.map(c => path.join('dist/js', c))];

function md5(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);
}

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

// PASS 1: hash original chunk content, then patch inter-chunk imports inside chunk files.
// This changes the content of chunks that have inter-chunk imports.
const pass1Hashes = {};
for (const chunk of CHUNKS) {
  pass1Hashes[chunk] = md5(path.join('dist/js', chunk));
}
applyHashes(ALL_JS, pass1Hashes);

// PASS 2: recompute hashes from the now-patched chunk files.
// Chunks that had inter-chunk imports added now have different content → different hash →
// different CDN URL → guaranteed cache miss even if the CDN cached the previous version.
const pass2Hashes = {};
for (const chunk of CHUNKS) {
  pass2Hashes[chunk] = md5(path.join('dist/js', chunk));
}
// Apply final hashes to all files (overwrites the pass-1 hashes already embedded).
applyHashes(ALL_JS, pass2Hashes);

console.log('postbuild: cache hashes applied —', Object.entries(pass2Hashes).map(([k, v]) => `${k}?v=${v}`).join(', '));
