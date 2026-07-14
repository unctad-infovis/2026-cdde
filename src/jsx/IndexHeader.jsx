import { createRoot } from 'react-dom/client';

import meta from './../meta.json';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const nav = meta.nav || [];

const container = document.getElementById(`app-root-${__PROJECT_NAME__}`);
const root = createRoot(container);
root.render(
  <div className="app">
    <MiniHeader title={meta.title} title_highlight={meta.title_highlight} nav={nav} />
  </div>
);
