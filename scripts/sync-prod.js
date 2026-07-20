const { execSync } = require('node:child_process');

const STORAGE = `https://${process.env.AZURE_STORAGE_NAME}.blob.core.windows.net/\\$web/${process.env.npm_package_name}`;
const ENTRIES = ['2026-cdde.min.js', '2026-cdde-compare.min.js', '2026-cdde-header.min.js', '2026-cdde-know-more.min.js'].join(';');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// CSS + assets: default cache
run(`azcopy copy "dist/*" "${STORAGE}/" --include-path "css;assets" --recursive --exclude-pattern ".DS_Store"`);

// Entry JS: no-cache — filenames are stable between deployments so browsers must always revalidate
// Note: azcopy appends the source directory name ("js") to the destination, so destination is STORAGE not STORAGE/js
run(`azcopy copy "dist/js" "${STORAGE}" --include-pattern "${ENTRIES}" --cache-control "no-cache, must-revalidate" --recursive`);

// Chunk JS: immutable — random deploy hash guarantees a new URL on every build, so CDN always misses
// Exclude entry files and their source maps; build the pattern as two separate lists to avoid the
// "*.map suffix only attaches to the last semicolon token" pitfall in azcopy --exclude-pattern.
const ENTRY_MAPS = ENTRIES.split(';')
  .map(e => `${e}.map`)
  .join(';');
run(`azcopy copy "dist/js" "${STORAGE}" --exclude-pattern "${ENTRIES};${ENTRY_MAPS}" --cache-control "max-age=31536000, immutable" --recursive`);
