import RollingNumber from './../shared/RollingNumber.jsx';
import './BigPicture.css';

export default function BigPicture({ cards = [], def_attribution, def_badge, def_title, description, description2, title }) {
  const hasDefinition = !!(def_title && def_badge);

  return (
    <div className="bigpicture_container">
      <div className={`bigpicture_hero${hasDefinition ? ' bigpicture_hero--split' : ''}`}>
        {/* Left — big picture */}
        <div className="bigpicture_hero_content">
          <div className="bigpicture_section_label">
            <span className="bigpicture_section_label_line" />
            The big picture
          </div>
          <h2 className="bigpicture_title">{title}</h2>
          <p className="bigpicture_desc">{description}</p>
          {description2 && <p className="bigpicture_desc">{description2}</p>}
        </div>

        {/* Right — definition */}
        {hasDefinition && (
          <div className="bigpicture_def">
            <div className="bigpicture_def_eyebrow">
              <span className="bigpicture_def_eyebrow_line" />
              Concepts &amp; context
            </div>
            <h3 className="bigpicture_def_title">{def_title}</h3>
            <p className="bigpicture_def_statement">
              A country is commodity-dependent when more than <span className="bigpicture_def_badge">{def_badge}</span> of its merchandise export value comes from commodities.
            </p>
            {def_attribution && <p className="bigpicture_def_attribution">{def_attribution}</p>}
          </div>
        )}
      </div>

      <div className="bigpicture_cards cdde_reveal">
        {cards.map(card => (
          <div className="bigpicture_card" key={card.label}>
            <p className="bigpicture_card_label">{card.label}</p>
            <RollingNumber value={card.value} className="bigpicture_card_value" />
            <p className="bigpicture_card_desc">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
