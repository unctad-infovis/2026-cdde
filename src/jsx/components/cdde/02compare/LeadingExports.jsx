import { useEffect, useState } from 'react';
import loadFile from '../../../helpers/LoadFile';
import ChartHeader from '../shared/ChartHeader';
import ChartSource from '../shared/ChartSource';
import HorizBar from '../shared/HorizBar';

const GROUP_COLORS = {
  agri: '#72bf44',
  energy: '#009edb',
  mining: '#fbaf17',
  'non-dependent': '#9e9e9e'
};

export default function LeadingExports({ iso3, dominantGroup }) {
  const [allData, setAllData] = useState(null);

  useEffect(() => {
    loadFile('assets/data/cdde_leading_exports.json')
      .then(r => r?.json())
      .then(d => {
        if (d) setAllData(d);
      });
  }, []);

  const exports = allData?.[iso3] ?? null;
  const barColor = GROUP_COLORS[dominantGroup] || '#009edb';

  return (
    <div className="cdde_card">
      <ChartHeader title="Three leading commodity exports" subtitle="% of all allocated product exports · 2022–2024" />

      <div className="cdde_card_body">
        {!allData && <div className="cdde_loading" style={{ height: 120 }} />}

        {allData && !exports && <p className="cdde_no_data">Export breakdown data not available for this country.</p>}

        {exports && (
          <div className="cdde_bars">
            {exports.map(item => (
              <HorizBar key={item.label} label={item.label} pct={item.pct} color={barColor} />
            ))}
          </div>
        )}
      </div>

      <ChartSource>UNCTADstat (2025), SITC Rev. 3 classification.</ChartSource>
    </div>
  );
}
