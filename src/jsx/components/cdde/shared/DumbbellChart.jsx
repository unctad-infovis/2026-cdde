import './DumbbellChart.css';

const C_YELLOW = '#fbaf17';
const C_BLUE = '#009edb';

const ROW_H = 34;
const AXIS_H = 44;
const DOT_R = 5;
const ARROW_TIP = 7;
const STROKE_W = 2;
const TRACK_PAD_R = 12;

// xTickValues: which axis values to label (default [xMin, xMax])
// referencePct: where to draw the vertical reference line
// referenceLabel: if provided, renders a yellow badge at referencePct; otherwise just a dashed line
export default function DumbbellChart({ data, xMin, xMax, nameW = 140, badgeW = 56, svgW = 520, referencePct, referenceLabel, xTickValues }) {
  const trackW = svgW - nameW - badgeW - TRACK_PAD_R;
  const H = AXIS_H + ROW_H * data.length + 8;
  const ticks = xTickValues ?? [xMin, xMax];

  function xScale(v) {
    return nameW + ((v - xMin) / (xMax - xMin)) * trackW;
  }

  const refX = referencePct != null ? xScale(referencePct) : null;

  return (
    <svg viewBox={`0 0 ${svgW} ${H}`} className="db_svg" aria-label="Dumbbell chart">
      {/* Axis tick labels */}
      {ticks.map((v, i) => {
        const anchor = i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle';
        return (
          <text key={v} x={xScale(v)} y={14} textAnchor={anchor} className="db_axis_label">
            {v}%
          </text>
        );
      })}

      {/* Reference badge (threshold variant) */}
      {refX != null &&
        referenceLabel &&
        (() => {
          const bw = 100;
          return (
            <g>
              <rect x={refX - bw / 2} y={20} width={bw} height={18} rx={4} fill={C_YELLOW} />
              <text x={refX} y={33} textAnchor="middle" className="db_ref_label">
                {referenceLabel}
              </text>
            </g>
          );
        })()}

      {/* Reference / threshold vertical line */}
      {refX != null && <line x1={refX} y1={AXIS_H} x2={refX} y2={H} className="db_ref_line" />}

      {/* Data rows */}
      {data.map((row, i) => {
        const y = AXIS_H + i * ROW_H + ROW_H / 2;
        const color = row.change > 0 ? C_YELLOW : C_BLUE;
        const startX = xScale(row.old_pct);
        const endX = xScale(row.new_pct);
        const goingRight = endX > startX;
        const lineEnd = goingRight ? endX - ARROW_TIP : endX + ARROW_TIP;
        const ax = endX;
        const arrowPts = goingRight ? `${ax - ARROW_TIP},${y - 4} ${ax},${y} ${ax - ARROW_TIP},${y + 4}` : `${ax + ARROW_TIP},${y - 4} ${ax},${y} ${ax + ARROW_TIP},${y + 4}`;

        const bx = svgW - badgeW - TRACK_PAD_R + 4;
        const bLabel = row.change > 0 ? `+${row.change}pp` : `${row.change}pp`;
        const badgeBg = row.change > 0 ? '#fff4bf' : '#e3edf6';
        const badgeColor = row.change > 0 ? '#b06e2a' : '#005392';

        return (
          <g key={row.name}>
            <text x={nameW - 10} y={y + 4} textAnchor="end" className="db_row_name">
              {row.name}
            </text>
            <line x1={nameW} y1={y} x2={nameW + trackW} y2={y} className="db_track" />
            <line x1={startX} y1={y} x2={lineEnd} y2={y} stroke={color} strokeWidth={STROKE_W} strokeLinecap="round" />
            <polyline points={arrowPts} fill="none" stroke={color} strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={startX} cy={y} r={DOT_R} fill="#fff" stroke={color} strokeWidth={STROKE_W} />
            <rect x={bx} y={y - 10} width={badgeW - 8} height={20} rx={4} fill={badgeBg} />
            <text x={bx + (badgeW - 8) / 2} y={y + 4} textAnchor="middle" fill={badgeColor} className="db_badge_label">
              {bLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
