import './CountryList.css';

function dotColor(pct) {
  if (pct > 80) return '#a71f36';
  if (pct > 60) return '#fbaf17';
  return '#009edb';
}

export default function CountryList({ countries, selected, onSelect }) {
  return (
    <div className="cl_panel">
      <div className="cl_panel_header">
        <span className="cl_count">
          <strong>{countries.length}</strong> member States · click a tile
        </span>
        <span className="cl_sort">Sorted A→Z</span>
      </div>

      <div className="cl_grid">
        {countries.map(c => {
          const isSelected = selected?.iso3 === c.iso3;
          return (
            <button
              key={c.iso3}
              className={`cl_tile${isSelected ? ' cl_tile--selected' : ''}`}
              onClick={() => onSelect(c)}
            >
              <span className="cl_tile_name">{c.name}</span>
              <span className="cl_tile_dep">
                <span className="cl_dot" style={{ background: dotColor(c.export_dependence) }} />
                {c.export_dependence.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
