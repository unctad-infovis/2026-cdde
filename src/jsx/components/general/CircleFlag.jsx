import basePath from './../../helpers/BasePath';

export default function CircleFlag({ countryCode, height = 24, width, className }) {
  const size = width ?? height;
  return <img alt={countryCode.toUpperCase()} className={className} height={height} src={`${basePath()}assets/img/flags/${countryCode.toLowerCase()}.svg`} style={{ borderRadius: '50%', display: 'inline-block', height, width: size }} width={size} />;
}
