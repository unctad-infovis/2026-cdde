import ButtonShare from '@unctad-infovis/general-tools/components/ButtonShare.jsx';
import basePath from '@unctad-infovis/general-tools/helpers/BasePath.js';
import Nav from './../shared/Nav.jsx';
import RollingNumber from './../shared/RollingNumber.jsx';
import './Header.css';

export default function Header({ nav, stats, subtitle, title, title_highlight }) {
  function renderTitle() {
    if (!title_highlight || !title.includes(title_highlight)) return title;
    const [before, after] = title.split(title_highlight);
    return (
      <>
        {before}
        <br />
        <span className="header_title_highlight">{title_highlight}</span>
        {after}
      </>
    );
  }

  return (
    <div className="header_container" style={{ '--hero-bg-url': `url(${basePath()}assets/img/2026-cdde_hero_tmp.jpg)` }}>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="hero-photo-grade" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1.00 0.00 0.00 0 0  0.00 0.97 0.00 0 0  0.00 0.00 1.13 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      <div className="header_grain" aria-hidden="true" />
      <div className="header_content">
        <h1 className="header_title">{renderTitle()}</h1>
        <ButtonShare url={typeof window !== 'undefined' ? window.location.href : ''} defaultOpen position="static" iconBg="rgba(0,0,0,0.45)" iconHoverBg="rgba(251, 175, 23, 0.75)" iconColor="#fff" iconHoverColor="#000" size={36} />
        <p className="header_subtitle">{subtitle}</p>

        {stats?.length > 0 && (
          <div className="header_stats">
            {stats.map(s => (
              <div className="header_stat" key={s.label}>
                <RollingNumber value={s.value} className="header_stat_value" />
                <span className="header_stat_label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {nav?.length > 0 && <Nav items={nav} />}
      </div>
    </div>
  );
}
