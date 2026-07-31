import { createHashRouter } from 'react-router';

import AboutPage from './AboutPage';
import DetailPage from './DetailPage';
import HomePage from './HomePage';
import RootLayout from './RootLayout';

/**
 * `loadFile(indexPath, { hash: '/some-route' })`로 창마다 진입 화면을 지정
 */
export const router = createHashRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: '/detail', Component: DetailPage },
      { path: '/about', Component: AboutPage },
    ],
  },
]);
