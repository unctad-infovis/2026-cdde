import BackToTop from '@unctad-infovis/general-tools/components/BackToTop.jsx';
import { useRef } from 'react';

import CompareArticle from '../CountryData.mdx';
import Compare from './components/cdde/country_data/CountryData.jsx';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import '@unctad-infovis/general-tools/styles/styles.css';
import './App.css';
import './components/cdde/shared/cdde-patterns.css';

const components = { BackToTop, Compare };

const ON_UNCTAD = typeof window !== 'undefined' && window.location.hostname.includes('unctad.org');
const homeHref = ON_UNCTAD ? `${window.location.protocol}//${window.location.host}${window.location.pathname.split('/').slice(0, -1).join('/')}` : './index.html';

const AppCompare = ({ meta }) => {
  const appRef = useRef();

  window.appRef = appRef;

  const nav = (meta?.nav || []).map(item => ({
    ...item,
    href: item.href ? (item.href.startsWith('#') ? `${homeHref}${item.href}` : item.href) : homeHref,
    label: item.primary ? '← Main page' : item.label
  }));

  return (
    <div className="app" ref={appRef}>
      <MiniHeader title={meta?.title} title_highlight={meta?.title_highlight} nav={nav} />
      <CompareArticle components={components} meta={meta} />
    </div>
  );
};

export default AppCompare;
