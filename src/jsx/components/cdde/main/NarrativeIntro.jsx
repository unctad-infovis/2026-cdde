import RollingNumber from './../shared/RollingNumber.jsx';
import './NarrativeIntro.css';

export default function NarrativeIntro({ cards = [], def_attribution, def_badge, def_title, description, description2, title }) {
  const hasDefinition = !!(def_title && def_badge);

  return (
    <div className="ni_container">
      <div className={`ni_hero${hasDefinition ? ' ni_hero--split' : ''}`}>
        <div className="ni_hero_inner">
          {/* Left — big picture */}
          <div className="ni_hero_content">
            <div className="ni_section_label">
              <span className="ni_section_label_line" />
              The big picture
            </div>
            <h2 className="ni_title">{title}</h2>
            <p className="ni_desc">{description}</p>
            {description2 && <p className="ni_desc">{description2}</p>}
          </div>

          {/* Right — definition */}
          {hasDefinition && (
            <div className="ni_def">
              <div className="ni_def_eyebrow">
                <span className="ni_def_eyebrow_line" />
                Concepts &amp; context
              </div>
              <h3 className="ni_def_title">{def_title}</h3>
              <p className="ni_def_statement">
                UNCTAD defines a country as commodity&#8209;dependent when more than <span className="ni_def_badge">{def_badge}</span> of its merchandise export value is derived from commodities.
              </p>
              {def_attribution && <p className="ni_def_attribution">{def_attribution}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="ni_cards">
        {cards.map((card, idx) => (
          <div className="ni_card cdde_reveal" key={card.label} style={{ transitionDelay: `${idx * 150}ms` }}>
            <p className="ni_card_label">{card.label}</p>
            <RollingNumber value={card.value} className="ni_card_value" />
            <p className="ni_card_desc">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
