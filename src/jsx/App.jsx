import { useEffect, useRef } from 'react';
import Article from '../Main.mdx';

// cdde/main
import CommodityGroups from './components/cdde/main/CommodityGroups.jsx';
import CommodityPrices from './components/cdde/main/CommodityPrices.jsx';
import DependenceByGroup from './components/cdde/main/DependenceByGroup.jsx';
import DependenceByLevel from './components/cdde/main/DependenceByLevel.jsx';
import DependenceMap from './components/cdde/main/DependenceMap.jsx';
import DependenceMovers from './components/cdde/main/DependenceMovers.jsx';
import ExportsByRegion from './components/cdde/main/ExportsByRegion.jsx';
import Header from './components/cdde/main/Header.jsx';
import KnowMore from './components/cdde/know_more/KnowMore.jsx';
import NarrativeIntro from './components/cdde/main/NarrativeIntro.jsx';
import SectionDivider from './components/cdde/main/SectionDivider.jsx';
import StatusChangers from './components/cdde/main/StatusChangers.jsx';
import Nav from './components/cdde/shared/Nav.jsx';
import BackToTop from './components/general/BackToTop.jsx';

import './../styles/styles.css';
import './components/cdde/shared/cdde-patterns.css';

const components = {
  BackToTop,
  BigPicture: NarrativeIntro,
  CommodityGroups,
  CommodityPrices,
  DecadeShift: SectionDivider,
  DependenceByGroup,
  DependenceByLevel,
  DependenceMap,
  DependenceMovers,
  ExportsByRegion,
  Header,
  KnowMore,
  Nav,
  ThresholdCrossers: StatusChangers
};

const App = ({ meta }) => {
  const appRef = useRef(null);
  window.appRef = appRef;

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
    return () => {
      observer.disconnect();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="app" ref={appRef}>
      <Article components={components} meta={meta} />
    </div>
  );
};

export default App;
