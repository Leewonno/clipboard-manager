// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import type { ClipboardItem } from '../shared/clipboard';
import { IPC_CHANNEL } from '../shared/ipc';

/** 렌더러에 열어 주는 최소한의 창구다. 렌더러는 electron 모듈을 직접 쓸 수 없다. */
const clipboardApi = {
  /** 항목 하나를 자식창으로 연다. */
  openDetailWindow: (item: ClipboardItem): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNEL.openDetailWindow, item),

  /** 자식창이 자신이 보여줄 항목을 받아 온다. 아직 없으면 null이다. */
  getDetailItem: (): Promise<ClipboardItem | null> => ipcRenderer.invoke(IPC_CHANNEL.getDetailItem),

  /** 이미 열려 있는 자식창에서 보여줄 항목이 바뀔 때 호출된다. 해제 함수를 돌려준다. */
  onDetailItemChange: (listener: (item: ClipboardItem) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, item: ClipboardItem) => listener(item);
    ipcRenderer.on(IPC_CHANNEL.detailItemChanged, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.detailItemChanged, handler);
  },

  /** 지금까지 쌓인 클립보드 기록을 최신순으로 받아 온다. */
  getHistory: (): Promise<ClipboardItem[]> => ipcRenderer.invoke(IPC_CHANNEL.getHistory),

  /** 새로 복사된 항목이 생길 때마다 호출된다. 해제 함수를 돌려준다. */
  onItemAdded: (listener: (item: ClipboardItem) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, item: ClipboardItem) => listener(item);
    ipcRenderer.on(IPC_CHANNEL.clipboardItemAdded, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.clipboardItemAdded, handler);
  },
};

export type ClipboardApi = typeof clipboardApi;

contextBridge.exposeInMainWorld('clipboardApi', clipboardApi);
