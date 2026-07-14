import basePath from '../../../helpers/BasePath';
import Nav from './Nav.jsx';
import './MiniHeader.css';

export default function MiniHeader({ title, title_highlight, nav }) {
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
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="hero-photo-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1.00 0.00 0.00 0 0  0.00 0.97 0.00 0 0  0.00 0.00 1.13 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      <div className="mh_content">
        <h1 className="mh_title">{renderTitle()}</h1>
        {nav?.length > 0 && <Nav items={nav} />}
      </div>
    </div>
  );
}
