import './Intro.css';

const GROUPS = [
  { color: 'var(--un-color-green)', label: 'Agricultural products' },
  { color: 'var(--un-color-green-dark)', label: 'Raw materials' },
  { color: 'var(--un-color-blue)', label: 'Energy' },
  { color: 'var(--un-color-yellow)', label: 'Mining & metals' },
];

export default function Intro() {
  return (
    <div className="intro_strip">
      <div className="intro_strip_inner">
        <div className="intro_strip_def">
          <span className="intro_strip_badge">60%</span>
          <span className="intro_strip_text">exports = commodity-dependent</span>
        </div>
        <div className="intro_strip_sep" aria-hidden="true" />
        <div className="intro_strip_groups">
          {GROUPS.map(g => (
            <span className="intro_strip_pill" key={g.label}>
              <span className="intro_strip_dot" style={{ background: g.color }} />
              {g.label}
            </span>
          ))}
        </div>
        <a className="intro_strip_more" href="#know-more">Know more ↓</a>
      </div>
    </div>
  );
}
