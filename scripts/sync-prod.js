const { execSync } = require('node:child_process');

const STORAGE = `https://${process.env.AZURE_STORAGE_NAME}.blob.core.windows.net/\\$web/${process.env.npm_package_name}`;
const ENTRIES = [
  '2026-cdde.min.js',
  '2026-cdde-compare.min.js',
  '2026-cdde-header.min.js',
  '2026-cdde-know-more.min.js',
].join(';');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// CSS + assets: default cache
run(`azcopy copy "dist/*" "${STORAGE}/" --include-path "css;assets" --recursive --exclude-pattern ".DS_Store"`);

// Entry JS: no-cache — filenames are stable between deployments so browsers must always revalidate
run(`azcopy copy "dist/js" "${STORAGE}/js" --include-pattern "${ENTRIES}" --cache-control "no-cache, must-revalidate" --recursive`);

// Chunk JS: immutable — filenames include content hashes so a new hash = cache miss anyway
run(`azcopy copy "dist/js" "${STORAGE}/js" --exclude-pattern "${ENTRIES}*.map" --cache-control "max-age=31536000, immutable" --recursive`);
