import basePath from '@unctad-infovis/general-tools/helpers/BasePath.js';
import Nav from './Nav.jsx';
import './MiniHeader.css';

const ON_UNCTAD = typeof window !== 'undefined' && window.location.hostname.includes('unctad.org');
const homeHref = ON_UNCTAD ? `${window.location.protocol}//${window.location.host}${window.location.pathname.split('/').slice(0, -1).join('/')}` : './index.html';

// Resolve nav items: primary items that haven't already been labelled get "← Main page"
// pointing back to the parent page. This handles the standalone header context where
// items arrive directly from meta.json without prior transformation.
function resolveNav(items) {
  return (items || []).map(item => {
    if (item.primary && item.label !== '← Main page') {
      return { ...item, href: homeHref, label: '← Main page' };
    }
    if (item.href?.startsWith('#')) {
      return { ...item, href: `${homeHref}${item.href}` };
    }
    return item;
  });
}

export default function MiniHeader({ title, title_highlight, nav }) {
  const resolvedNav = resolveNav(nav);
  function renderTitle() {
    if (!title_highlight || !title.includes(title_highlight)) return title;
    const [before, after] = title.split(title_highlight);
    return (
      <>
        {before}
        <br />
        <span className="mh_title_highlight">{title_highlight}</span>
        {after}
      </>
    );
  }

  return (
    <div className="mh_container" style={{ '--hero-bg-url': `url(${basePath()}assets/img/2026-cdde_hero_tmp.jpg)` }}>
      <div className="mh_container_inner">
        <div className="mh_content">
          <h1 className="mh_title">{renderTitle()}</h1>
          {resolvedNav.length > 0 && <Nav items={resolvedNav} />}
        </div>
      </div>
    </div>
  );
}
