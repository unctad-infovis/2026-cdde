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

// Hash each chunk file and append ?v=<hash> to its references in all entry files
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

const ENTRIES = [
  'dist/js/2026-cdde.min.js',
  'dist/js/2026-cdde-compare.min.js',
  'dist/js/2026-cdde-header.min.js',
  'dist/js/2026-cdde-know-more.min.js',
];

for (const entryPath of ENTRIES) {
  let src = fs.readFileSync(entryPath, 'utf8');
  for (const [chunk, hash] of Object.entries(hashes)) {
    const escaped = chunk.replace('.', '\\.').replace('-', '\\-');
    src = src.replace(new RegExp(`${escaped}(?:\\?[^"']*)?`, 'g'), `${chunk}?v=${hash}`);
  }
  fs.writeFileSync(entryPath, src);
}

console.log('postbuild: cache hashes applied —', Object.entries(hashes).map(([k, v]) => `${k}?v=${v}`).join(', '));
