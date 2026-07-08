import { useRef } from 'react';

import Article from '../Article.mdx';

// General
// import BackToTop from './components/general/BackToTop.jsx';
// import ChartDataWrapper from './components/general/ChartDataWrapper.jsx';
// import Image from './components/general/Image.jsx';
// import ProgressBar from './components/general/ProgressBar.jsx';
// import Quote from './components/general/Quote.jsx';

// cdde/01main
import BigPicture from './components/cdde/01main/BigPicture.jsx';
import Header from './components/cdde/01main/Header.jsx';
import Intro from './components/cdde/01main/Intro.jsx';
import CommodityGroups from './components/cdde/01main/CommodityGroups.jsx';
import KnowMore from './components/cdde/01main/KnowMore.jsx';
import Nav from './components/cdde/shared/Nav.jsx';
import DependenceByLevel from './components/cdde/01main/DependenceByLevel.jsx';
import DecadeShift from './components/cdde/01main/DecadeShift.jsx';
import DependenceMovers from './components/cdde/01main/DependenceMovers.jsx';
import CommodityPrices from './components/cdde/01main/CommodityPrices.jsx';
import ThresholdCrossers from './components/cdde/01main/ThresholdCrossers.jsx';
import DependenceMap from './components/cdde/01main/DependenceMap.jsx';
import ExportsByRegion from './components/cdde/01main/ExportsByRegion.jsx';
import DependenceByGroup from './components/cdde/01main/DependenceByGroup.jsx';

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
  // BackToTop,
  // ChartDataWrapper,
  // Image,
  // ProgressBar,
  // Quote,
};

const App = ({ meta }) => {
  const appRef = useRef();

  // useEffect(() => {
  //   const elements = appRef.current.querySelectorAll('.container_chapter p, .container_chapter ul, .container_chapter ol, .container_chapter h3, .container_chapter blockquote');

  //   // Options for the observer (when the p tag is 50% in the viewport)
  //   const options = {
  //     threshold: 0.5 // Trigger when 50% of the paragraph is visible
  //   };

  //   // Callback function for when the intersection occurs
  //   const observerCallback = entries => {
  //     entries.forEach(entry => {
  //       if (entry.isIntersecting) {
  //         // Add the visible class when the element is in view
  //         entry.target.classList.add('visible');
  //       }
  //     });
  //   };

  //   // Create an IntersectionObserver instance with the callback and options
  //   const observer = new IntersectionObserver(observerCallback, options);

  //   // Observe each paragraph
  //   for (const el of elements) {
  //     observer.observe(el);
  //   }
  //   setTimeout(() => {
  //     window.dispatchEvent(new Event('scroll'));
  //   }, 500); // A short delay ensures the DOM is ready
  // }, []);

  window.appRef = appRef;

  return (
    <div
      className="app"
      style={{
        // '--main-color': 'var(--un-color-green-dark)',
        // '--secondary-color': 'var(--un-color-green-text)'
      }}
      ref={appRef}
    >
      <Article components={components} meta={meta} />
    </div>
  );
};

export default App;
