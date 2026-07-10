import { createRoot } from 'react-dom/client';

import meta from './../meta.json';
import AppKnowMore from './AppKnowMore.jsx';
import UNCTADSiteHeader from './components/general/UNCTADSiteHeader.jsx';

const showSiteHeader = meta.show_site_header && !window.location.hostname.includes('unctad.org');

const container = document.getElementById(`app-root-${__PROJECT_NAME__}`);
const root = createRoot(container);
root.render(
  showSiteHeader ? (
    <UNCTADSiteHeader>
      <AppKnowMore meta={meta} />
    </UNCTADSiteHeader>
  ) : (
    <AppKnowMore meta={meta} />
  )
);
