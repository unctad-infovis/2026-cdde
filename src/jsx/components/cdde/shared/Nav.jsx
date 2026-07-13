import './Nav.css';

const ON_UNCTAD = typeof window !== 'undefined' && window.location.hostname.includes('unctad.org');
const UNCTAD_CDDE_PREFIX = 'https://unctad.org/topic/commodities/state-of-commodity-dependence/';
const LOCAL_SLUG_MAP = {
  'country-profiles': 'compare.html',
  'know-more': 'know-more.html',
};

function resolveItem(item) {
  if (ON_UNCTAD || !item.href?.startsWith(UNCTAD_CDDE_PREFIX)) return item;
  const slug = item.href.slice(UNCTAD_CDDE_PREFIX.length);
  const localHref = LOCAL_SLUG_MAP[slug];
  if (!localHref) return item;
  return { ...item, href: localHref, external: false };
}

function scrollToY() {
  const start = window.scrollY;
  const dist = Math.round(window.innerHeight) - start + 50;
  if (!dist) return;
  const duration = 1000;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  let t0 = null;
  const step = ts => {
    if (t0 === null) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    window.scrollTo(0, start + dist * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function isCurrentPage(href) {
  if (!href || href.startsWith('#')) return false;
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const normalized = href.replace(/^\.\//, '');
  return pathname.endsWith(`/${normalized}`) || pathname.endsWith(`/${normalized.replace('.html', '')}`);
}

export default function Nav({ items = [] }) {
  return (
    <nav className="nav_container">
      {items.map(rawItem => {
        const item = resolveItem(rawItem);
        const active = isCurrentPage(item.href);
        const cls = `nav_btn${item.primary ? ' nav_btn--primary' : ''}${active ? ' nav_btn--active' : ''}`;
        if (item.href) {
          return (
            <a
              className={cls}
              href={item.href}
              key={item.label}
              rel={item.external ? 'noopener noreferrer' : undefined}
              target={item.external ? '_blank' : undefined}
            >
              {item.label}
            </a>
          );
        }
        return (
          <button className={cls} key={item.label} onClick={scrollToY} type="button">
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
