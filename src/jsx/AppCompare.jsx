import { useRef } from 'react';
import CompareArticle from '../CountryData.mdx';

import Compare from './components/cdde/country_data/CountryData.jsx';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const components = { Compare };

const AppCompare = ({ meta }) => {
  const appRef = useRef();

  window.appRef = appRef;

  const nav = (meta?.nav || []).map(item => ({
    ...item,
    href: item.href ? (item.href.startsWith('#') ? `./index.html${item.href}` : item.href) : './index.html'
  }));

  return (
    <div className="app" ref={appRef}>
      <MiniHeader title={meta?.title} title_highlight={meta?.title_highlight} nav={nav} />
      <CompareArticle components={components} meta={meta} />
    </div>
  );
};

export default AppCompare;
