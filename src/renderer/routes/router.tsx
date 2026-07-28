import { createHashRouter } from 'react-router';

import DetailPage from './DetailPage';
import HomePage from './HomePage';
import RootLayout from './RootLayout';

/**
 * 패키징된 앱은 file:// 스킴에서 실행되므로 history API 기반 라우터는 쓸 수 없다.
 * 해시 라우터를 쓰면 경로가 URL 해시에 담기므로 메인 프로세스에서
 * `loadFile(indexPath, { hash: '/some-route' })`로 창마다 진입 화면을 지정할 수 있다.
 */
export const router = createHashRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: '/detail', Component: DetailPage },
    ],
  },
]);
