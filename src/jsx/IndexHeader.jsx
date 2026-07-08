import { createRoot } from 'react-dom/client';

import meta from './../meta.json';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

// On sub-pages, scroll-only items link back to the main page;
// in-page anchors become absolute links to index.html#section.
const nav = (meta.nav || []).map(item => ({
  ...item,
  href: item.href
    ? (item.href.startsWith('#') ? `./index.html${item.href}` : item.href)
    : './index.html',
}));

const container = document.getElementById(`app-root-${__PROJECT_NAME__}`);
const root = createRoot(container);
root.render(
  <div className="app">
    <MiniHeader title={meta.title} title_highlight={meta.title_highlight} nav={nav} />
  </div>
);
