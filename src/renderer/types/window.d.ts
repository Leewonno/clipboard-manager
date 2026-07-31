import type { AppApi, ClipboardApi, WindowApi } from '../../preload';

declare global {
  interface Window {
    /** preload가 contextBridge로 노출한 API다. */
    clipboardApi: ClipboardApi;

    /** 창 최소화·최대화·닫기와 플랫폼 분기용 창구다. */
    windowApi: WindowApi;

    /** 앱 정보 창과 실행 환경 정보용 창구다. */
    appApi: AppApi;
  }
}
