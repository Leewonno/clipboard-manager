/**
 * 이 파일은 vite가 자동으로 로드하며 "렌더러" 컨텍스트에서 실행된다.
 * Electron의 "메인"과 "렌더러" 컨텍스트 차이는 아래 문서를 참고한다.
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * 렌더러에서는 Node.js 통합이 꺼져 있으므로 `electron` 모듈을 직접
 * import 할 수 없다. 메인 프로세스의 기능이 필요하면 preload의
 * contextBridge로 노출한 API를 통해 접근한다.
 *
 * https://electronjs.org/docs/tutorial/security
 */

import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다. index.html을 확인해 주세요.');
}

createRoot(container).render(<App />);
