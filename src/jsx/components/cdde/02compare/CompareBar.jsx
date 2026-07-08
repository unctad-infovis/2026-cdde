import CountrySearch from '../shared/CountrySearch';
import './CompareBar.css';

export default function CompareBar({ countries, compareList, onCompareChange }) {
  const handleChange = (idx, iso3) => {
    const next = [...compareList];
    next[idx] = iso3 || null;
    onCompareChange(next);
  };

  return (
    <div className="cb_bar">
      <span className="cb_label">COMPARE</span>
      {[0, 1, 2].map((idx, i) => (
        <div key={idx} className="cb_slot_group">
          {i > 0 && <span className="cb_vs">VS</span>}
          <CountrySearch countries={countries} value={compareList[idx]} onChange={iso3 => handleChange(idx, iso3)} placeholder="Select economy…" />
        </div>
      ))}
    </div>
  );
}
