import useIsVisible from '../../../helpers/UseIsVisible';

export default function StatList({ items, columns = 2 }) {
  const [visRef, isVisible] = useIsVisible(0.15);

  return (
    <div className={`stl_grid${columns === 1 ? ' stl_grid--single' : ''}`} ref={visRef}>
      {items.map((item, i) => (
        <div
          key={item.label}
          className="stl_item"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'none' : 'translateY(10px)',
            transition: isVisible
              ? `opacity 0.5s ease ${0.25 + i * 0.15}s, transform 0.5s ease ${0.25 + i * 0.15}s`
              : 'none',
          }}
        >
          <span className="stl_label">{item.label}</span>
          <span className="stl_value">{item.value ?? '–'}</span>
          {item.note && <span className="stl_note">{item.note}</span>}
        </div>
      ))}
    </div>
  );
}
