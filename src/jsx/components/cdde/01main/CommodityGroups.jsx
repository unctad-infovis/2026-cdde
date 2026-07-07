import './CommodityGroups.css';

const GROUPS = [
  { color: 'var(--un-color-green)',      label: 'Agricultural products', note: 'Food and raw materials' },
  { color: 'var(--un-color-green-dark)', label: 'Raw materials',         note: 'Part of agricultural group' },
  { color: 'var(--un-color-blue)',       label: 'Energy',                note: 'Oil, gas, coal' },
  { color: 'var(--un-color-yellow)',     label: 'Mining & metals',       note: 'Ores and precious metals' },
];

export default function CommodityGroups({ methodology_url }) {
  return (
    <div className="cg_wrap">
      <div className="cg_inner">
        <div className="cg_groups">
          {GROUPS.map(g => (
            <div className="cg_group" key={g.label}>
              <span className="cg_dot" style={{ background: g.color }} />
              <span className="cg_name">{g.label}</span>
              <span className="cg_note">{g.note}</span>
            </div>
          ))}
        </div>
        <p className="cg_footer">
          Three broad groups, with agricultural disaggregated into food and raw materials.
          {methodology_url && (
            <> <a className="cg_link" href={methodology_url}>Full statistical composition →</a></>
          )}
        </p>
      </div>
    </div>
  );
}
