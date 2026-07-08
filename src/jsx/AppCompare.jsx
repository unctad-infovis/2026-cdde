import { useRef } from 'react';

import Compare from './components/cdde/02compare/Compare.jsx';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const AppCompare = ({ meta }) => {
  const appRef = useRef();

  window.appRef = appRef;

  // Remap nav: scroll-only items → link to main page; anchors → index.html#anchor
  const nav = (meta?.nav || []).map(item => ({
    ...item,
    href: item.href ? (item.href.startsWith('#') ? `./index.html${item.href}` : item.href) : './index.html'
  }));

  return (
    <div className="app" ref={appRef}>
      <MiniHeader title={meta?.title} title_highlight={meta?.title_highlight} nav={nav} />
      <Compare meta={meta} />
    </div>
  );
};

export default AppCompare;
