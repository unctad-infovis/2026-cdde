export default function StatList({ items, columns = 2 }) {
  return (
    <div className={`stl_grid${columns === 1 ? ' stl_grid--single' : ''}`}>
      {items.map(item => (
        <div key={item.label} className="stl_item">
          <span className="stl_label">{item.label}</span>
          <span className="stl_value">{item.value ?? '–'}</span>
          {item.note && <span className="stl_note">{item.note}</span>}
        </div>
      ))}
    </div>
  );
}
