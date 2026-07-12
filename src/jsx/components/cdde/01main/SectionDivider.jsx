import basePath from './../../../helpers/BasePath';
import './SectionDivider.css';

export default function SectionDivider({ children, eyebrow, panel_description, panel_eyebrow, panel_title, photo_credit = 'Unsplash', spotlight, title }) {
  return (
    <section className="sd_section cdde_reveal">
      {/* Light text area */}
      <div className="sd_light">
        <div className="sd_light_inner">
          <div className="sd_header_row">
            <div className="sd_header_main">
              {eyebrow && (
                <div className="sd_eyebrow">
                  <span className="sd_eyebrow_line" />
                  <span className="sd_eyebrow_text">{eyebrow}</span>
                </div>
              )}
              <h2 className="sd_title">{title}</h2>
            </div>
            {spotlight && <p className="sd_spotlight">{spotlight}</p>}
          </div>

          <hr className="sd_divider" />

          <div className="sd_body">{children}</div>
        </div>
      </div>

      {/* Dark image panel — only shown when panel_title is provided */}
      {panel_title && (
        <div className="sd_panel" style={{ '--sd-bg': `url(${basePath()}assets/img/2026-cdde_hero_tmp.jpg)` }}>
          <div className="sd_panel_inner">
            {panel_eyebrow && (
              <div className="sd_panel_eyebrow">
                <span className="sd_panel_eyebrow_line" />
                <span className="sd_panel_eyebrow_text">{panel_eyebrow}</span>
              </div>
            )}
            <h3 className="sd_panel_title">{panel_title}</h3>
            {panel_description && <p className="sd_panel_description">{panel_description}</p>}
            {photo_credit && <span className="sd_photo_credit">Photo · {photo_credit}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
