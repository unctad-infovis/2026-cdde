import basePath from './../../helpers/BasePath';

export default function CircleFlag({ countryCode, height = 24, width, className }) {
  const size = width ?? height;
  return <img alt={countryCode.toUpperCase()} className={`cdde_circle_flag${className ? ` ${className}` : ''}`} height={height} src={`${basePath()}assets/img/flags/${countryCode.toLowerCase()}.svg`} style={{ height, width: size }} width={size} />;
}
