import KnowMore from './components/cdde/know_more/KnowMore.jsx';
import MiniHeader from './components/cdde/shared/MiniHeader.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const ON_UNCTAD = typeof window !== 'undefined' && window.location.hostname.includes('unctad.org');
const homeHref = ON_UNCTAD
  ? `${window.location.protocol}//${window.location.host}${window.location.pathname.split('/').slice(0, -1).join('/')}`
  : './index.html';

const AppKnowMore = ({ meta }) => {
  const nav = (meta?.nav || []).map(item => ({
    ...item,
    href: item.href
      ? item.href.startsWith('#')
        ? `${homeHref}${item.href}`
        : item.href
      : homeHref,
    label: item.primary ? '← Main page' : item.label,
  }));

  return (
    <div className="app">
      <MiniHeader title={meta?.title} title_highlight={meta?.title_highlight} nav={nav} />
      <KnowMore />
    </div>
  );
};

export default AppKnowMore;
