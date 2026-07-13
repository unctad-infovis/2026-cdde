import { depColor, NO_DATA_FILL } from '../shared/cdde-constants';
import './CountryList.css';

export default function CountryList({ countries, selected, onSelect }) {
  return (
    <div className="cl_panel">
      <div className="cl_panel_header">
        <span className="cl_count">
          <strong>{countries.length}</strong> member States
        </span>
        <span className="cl_sort">Sorted A→Z</span>
      </div>

      <div className="cl_grid">
        {countries.map(c => {
          const isSelected = selected?.iso3 === c.iso3;
          return (
            <button type="button" key={c.iso3} className={`cl_tile${isSelected ? ' cl_tile--selected' : ''}`} onClick={() => onSelect(c)}>
              <span className="cl_tile_name">{c.name}</span>
              <span className="cl_tile_dep">
                <span className="cl_dot" style={{ background: c.export_dependence != null ? depColor(c.export_dependence) : NO_DATA_FILL }} />
                {c.export_dependence != null ? `${c.export_dependence.toFixed(1)}%` : 'No data'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
