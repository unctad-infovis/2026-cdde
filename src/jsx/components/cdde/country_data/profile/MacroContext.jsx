import { useEffect, useState } from 'react';
import loadFile from '../../../../helpers/LoadFile';
import ChartHeader from '../../shared/ChartHeader';
import ChartMeta from '../../shared/ChartMeta';
import StatList from '../../shared/StatList';

function fmtGdp(millions) {
  if (millions == null) return null;
  if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(1)} tn`;
  if (millions >= 1_000) return `$${(millions / 1_000).toFixed(1)} bn`;
  return `$${Math.round(millions)} mn`;
}

function fmtPerCapita(usd) {
  if (usd == null) return null;
  return `$${Math.round(usd).toLocaleString('en-US')}`;
}

export default function MacroContext({ iso3, title, subtitle, description, source, note }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_macro_context.json')
      .then(r => r?.json())
      .then(d => { if (d) setAllData(d); });
  }, []);

  const d = allData?.[iso3] ?? null;

  const items = d ? [
    { label: 'GDP', value: fmtGdp(d.gdp), note: 'Constant 2020 USD' },
    { label: 'GDP per capita', value: fmtPerCapita(d.gdp_per_capita), note: 'Constant 2020 USD' },
  ] : [];

  return (
    <div className="cdde_card">
      <ChartHeader title={title} subtitle={subtitle} description={description} />
      {!allData && <div className="cdde_loading" style={{ height: 120 }} />}
      {allData && !d && <p className="cdde_no_data">Macro data not available for this country.</p>}
      {d && <StatList items={items} columns={1} key={iso3} />}
      <ChartMeta source={source} note={note} sourceKey={['Constant GDP', 'Population']} />
    </div>
  );
}
