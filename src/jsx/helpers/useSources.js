import { useEffect, useState } from 'react';
import loadFile from './LoadFile';

let _cache = null;
let _promise = null;

function loadSources() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) _promise = loadFile('assets/data/cdde_sources.json')
    .then(r => r?.json())
    .then(d => { _cache = d; return d; });
  return _promise;
}

export function fmtExtractedDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d} ${months[m - 1]} ${y}`;
}

export default function useSources() {
  const [sources, setSources] = useState(_cache);
  useEffect(() => {
    if (!_cache) loadSources().then(d => d && setSources(d));
  }, []);
  return sources;
}
