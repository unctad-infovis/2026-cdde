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

// Hash each chunk file and append ?v=<hash> to ALL references across entries AND chunks,
// so inter-chunk imports also bust the CDN cache (prevents stale chunk mismatches).
const CHUNKS = [
  '2026-cdde.BackToTop.js',
  '2026-cdde.cdde-patterns.js',
  '2026-cdde.KnowMore.js',
  '2026-cdde.MiniHeader.js',
  '2026-cdde.UNCTADSiteHeader.js',
];

const hashes = {};
for (const chunk of CHUNKS) {
  const content = fs.readFileSync(path.join('dist/js', chunk));
  hashes[chunk] = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

// Patch entries AND chunks — inter-chunk imports need version hashes too
const ALL_JS = [
  'dist/js/2026-cdde.min.js',
  'dist/js/2026-cdde-compare.min.js',
  'dist/js/2026-cdde-header.min.js',
  'dist/js/2026-cdde-know-more.min.js',
  ...CHUNKS.map(c => path.join('dist/js', c)),
];

for (const filePath of ALL_JS) {
  let src = fs.readFileSync(filePath, 'utf8');
  for (const [chunk, hash] of Object.entries(hashes)) {
    // Escape all regex special chars in the filename
    const escaped = chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    src = src.replace(new RegExp(`${escaped}(?:\\?[^"']*)?`, 'g'), `${chunk}?v=${hash}`);
  }
  fs.writeFileSync(filePath, src);
}

console.log('postbuild: cache hashes applied —', Object.entries(hashes).map(([k, v]) => `${k}?v=${v}`).join(', '));
