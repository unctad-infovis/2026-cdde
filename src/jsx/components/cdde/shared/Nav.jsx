import './Nav.css';

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

export default function Nav({ items = [] }) {
  return (
    <nav className="nav_container">
      {items.map(item =>
        item.href
          ? (
            <a className={`nav_btn${item.primary ? ' nav_btn--primary' : ''}`} href={item.href} key={item.label}>
              {item.label}
            </a>
          )
          : (
            <button className={`nav_btn${item.primary ? ' nav_btn--primary' : ''}`} key={item.label} onClick={scrollToY} type="button">
              {item.label}
            </button>
          )
      )}
    </nav>
  );
}
