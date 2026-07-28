import type { ClipboardApi } from '../../preload';

declare global {
  interface Window {
    /** preload가 contextBridge로 노출한 API다. */
    clipboardApi: ClipboardApi;
  }
}
