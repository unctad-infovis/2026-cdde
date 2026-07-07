import './KnowMore.css';

export default function KnowMore() {
  return (
    <section className="km_section" id="know-more">
      <div className="km_inner">
        <div className="km_eyebrow">
          <span className="km_eyebrow_line" />
          Year in review · 2022–2024
        </div>
        <p className="km_review_note">
          Data series updated annually after final UNCTADstat trade statistics are released in the last quarter.
        </p>
        <p className="km_review_body">
          This snapshot draws on <strong>UNCTADstat trade statistics for the 2022–2024 reference period</strong>,
          the latest three-year window for which consolidated international trade data is available. Each
          indicator is computed for all 191 UNCTAD member States and benchmarked against the 60%
          commodity-dependence threshold.
        </p>
        <p className="km_review_body">
          Read the article as a guided tour: start with the headline figure, see how dependence breaks down
          by country group and development level, find the world map of where commodity dependence runs
          deepest, then dig into the regional concentration of global commodity exports.
        </p>
      </div>
    </section>
  );
}
