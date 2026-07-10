import useCountUp from '../../../helpers/UseCountUp';

function AnimatedNumber({ num, suffix, decimals, suffixAtEnd, className, style }) {
  const [count, ref] = useCountUp(num, { decimals, duration: 1400 });
  const done = Math.abs(count - num) < Math.pow(10, -decimals) / 2;
  return (
    <span ref={ref} className={className} style={style}>
      {count.toFixed(decimals)}{suffixAtEnd ? (done ? suffix : '') : suffix}
    </span>
  );
}

export default function RollingNumber({ value, className, style }) {
  const match = typeof value === 'string' ? value.match(/^(\d+(?:\.\d+)?)([+%]?)$/) : null;
  if (!match) return <span className={className} style={style}>{value}</span>;

  const num = parseFloat(match[1]);
  const suffix = match[2];
  const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0;

  return (
    <AnimatedNumber
      num={num}
      suffix={suffix}
      decimals={decimals}
      suffixAtEnd={suffix === '+'}
      className={className}
      style={style}
    />
  );
}
