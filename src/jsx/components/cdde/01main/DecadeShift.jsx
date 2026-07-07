import basePath from './../../../helpers/BasePath';
import './DecadeShift.css';

export default function DecadeShift({
  children,
  eyebrow,
  panel_description,
  panel_eyebrow,
  panel_title,
  photo_credit = 'Unsplash',
  spotlight,
  title,
}) {
  return (
    <section className="ds_section">
      {/* Light text area */}
      <div className="ds_light">
        <div className="ds_light_inner">
          <div className="ds_header_row">
            <div className="ds_header_main">
              {eyebrow && (
                <div className="ds_eyebrow">
                  <span className="ds_eyebrow_line" />
                  <span className="ds_eyebrow_text">{eyebrow}</span>
                </div>
              )}
              <h2 className="ds_title">{title}</h2>
            </div>
            {spotlight && (
              <p className="ds_spotlight">{spotlight}</p>
            )}
          </div>

          <hr className="ds_divider" />

          <div className="ds_body">{children}</div>
        </div>
      </div>

      {/* Dark image panel — a horizontal slice of the hero image */}
      <div
        className="ds_panel"
        style={{ '--ds-bg': `url(${basePath()}assets/img/2026-cdde_hero_tmp.jpg)` }}
      >
        <div className="ds_panel_inner">
          {panel_eyebrow && (
            <div className="ds_panel_eyebrow">
              <span className="ds_panel_eyebrow_line" />
              <span className="ds_panel_eyebrow_text">{panel_eyebrow}</span>
            </div>
          )}
          <h3 className="ds_panel_title">{panel_title}</h3>
          {panel_description && (
            <p className="ds_panel_description">{panel_description}</p>
          )}
          {photo_credit && (
            <span className="ds_photo_credit">Photo · {photo_credit}</span>
          )}
        </div>
      </div>
    </section>
  );
}
