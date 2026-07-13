import { useEffect, useState } from 'react';
import loadFile from '../../../../helpers/LoadFile';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import StatList from '../../shared/StatList';

const EMP_YEAR = { LBN: 2023, SSD: 2023, PSE: 2022, SDN: 2022, UKR: 2021 };

function fmtPop(thousands) {
  if (thousands == null) return null;
  if (thousands >= 1_000_000) return `${(thousands / 1_000_000).toFixed(1)} billion`;
  if (thousands >= 1_000) return `${(thousands / 1_000).toFixed(1)} million`;
  return `${Math.round(thousands)} thousand`;
}

export default function SocialContext({ iso3, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_social_context.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;
  const empYear = EMP_YEAR[iso3] ?? 2024;

  const items = d ? [
    { label: 'Employment rate', value: d.emp != null ? `${d.emp}%` : null, note: `${empYear}, working-age population` },
    { label: 'Female employment', value: d.emp_female != null ? `${d.emp_female}%` : null, note: `${empYear}, working-age population` },
    { label: 'Population', value: fmtPop(d.population), note: '2024 estimate' },
    {
      label: 'Human Development Index',
      value: d.hdi_value != null ? d.hdi_value.toFixed(3) : null,
      note: d.hdi_rank != null ? `Rank ${d.hdi_rank}${d.hdi_category ? ` – ${d.hdi_category}` : ''}, 2023` : '2023',
    },
  ] : [];

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />
      {!allData && <div className="cdde_loading" style={{ height: 120 }} />}
      {allData && !d && <p className="cdde_no_data">Social data not available for this country.</p>}
      {d && <StatList items={items} key={iso3} />}
      <ChartMeta source={source} note={note} sourceKey={['Employment to population', 'Female employment', 'Human Development Index']} />
    </div>
  );
}
