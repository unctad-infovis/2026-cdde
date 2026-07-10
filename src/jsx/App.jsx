import { useEffect, useRef } from 'react';
import Article from '../Main.mdx';

// cdde/01main
import BigPicture from './components/cdde/01main/BigPicture.jsx';
import CommodityGroups from './components/cdde/01main/CommodityGroups.jsx';
import CommodityPrices from './components/cdde/01main/CommodityPrices.jsx';
import DecadeShift from './components/cdde/01main/DecadeShift.jsx';
import DependenceByGroup from './components/cdde/01main/DependenceByGroup.jsx';
import DependenceByLevel from './components/cdde/01main/DependenceByLevel.jsx';
import DependenceMap from './components/cdde/01main/DependenceMap.jsx';
import DependenceMovers from './components/cdde/01main/DependenceMovers.jsx';
import ExportsByRegion from './components/cdde/01main/ExportsByRegion.jsx';
import Header from './components/cdde/01main/Header.jsx';
import Intro from './components/cdde/01main/Intro.jsx';
import KnowMore from './components/cdde/01main/KnowMore.jsx';
import ThresholdCrossers from './components/cdde/01main/ThresholdCrossers.jsx';
import Nav from './components/cdde/shared/Nav.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const components = {
  BigPicture,
  Header,
  Intro,
  Nav,
  DependenceByLevel,
  CommodityGroups,
  DependenceMap,
  KnowMore,
  DecadeShift,
  DependenceMovers,
  ExportsByRegion,
  DependenceByGroup,
  CommodityPrices,
  ThresholdCrossers
};

const App = ({ meta }) => {
  const appRef = useRef(null);

  useEffect(() => {
    if (!appRef.current) return;
    const seen = new Set();
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    const attach = () => {
      appRef.current?.querySelectorAll('.cdde_reveal').forEach(el => {
        if (!seen.has(el)) {
          seen.add(el);
          observer.observe(el);
        }
      });
    };

    attach();
    // Re-run after data-driven components have finished their async renders
    const t = setTimeout(attach, 600);
    return () => { observer.disconnect(); clearTimeout(t); };
  }, []);

  return (
    <div className="app" ref={appRef}>
      <Article components={components} meta={meta} />
    </div>
  );
};

export default App;
