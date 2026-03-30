import {
  PageBlueprint,
  SubPageBlueprint,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import TimeLapseIcon from '@material-ui/icons/Timelapse';

import { rootRouteRef } from './routes';

const timeSaverPage = PageBlueprint.make({
  params: {
    path: '/time-saver',
    title: 'Template Metrics',
    routeRef: rootRouteRef,
  },
});

const allStatsSubPage = SubPageBlueprint.make({
  name: 'all-stats',
  params: {
    path: 'all-stats',
    title: 'All Stats',
    loader: () =>
      import('./components/AllStatsSubPage/AllStatsSubPage').then(m => (
        <m.AllStatsSubPage />
      )),
  },
});

const byTeamSubPage = SubPageBlueprint.make({
  name: 'by-team',
  params: {
    path: 'by-team',
    title: 'By Team',
    loader: () =>
      import('./components/ByTeamSubPage/ByTeamSubPage').then(m => (
        <m.ByTeamSubPage />
      )),
  },
});

const byTemplateSubPage = SubPageBlueprint.make({
  name: 'by-template',
  params: {
    path: 'by-template',
    title: 'By Template',
    loader: () =>
      import('./components/ByTemplateSubPage/ByTemplateSubPage').then(m => (
        <m.ByTemplateSubPage />
      )),
  },
});

/**
 * The Time Saver plugin for the new Backstage frontend system.
 *
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'time-saver',
  title: 'Time Saver',
  icon: <TimeLapseIcon fontSize="inherit" />,
  extensions: [
    timeSaverPage,
    allStatsSubPage,
    byTeamSubPage,
    byTemplateSubPage,
  ],
  routes: {
    root: rootRouteRef,
  },
});
