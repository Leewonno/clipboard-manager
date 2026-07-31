// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import type { ClipboardItem } from '../shared/clipboard';
import { IPC_CHANNEL } from '../shared/ipc';
import type { SystemInfo } from '../shared/systemInfo';

/** 렌더러에 열어 주는 최소한의 창구 / 렌더러는 electron 모듈을 직접 쓸 수 없다. */
const clipboardApi = {
  /** 항목 하나를 자식창으로 */
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

  /** 기록 하나를 지운다. 이미지면 본문 파일도 함께 지워진다. */
  deleteItem: (id: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.deleteItem, id),

  /** 기록을 모두 지운다. 이미지 본문 파일도 함께 지워진다. */
  deleteAllItem: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.deleteAllItem),

  /** 새로 복사된 항목이 생길 때마다 호출된다. 해제 함수를 돌려준다. */
  onItemAdded: (listener: (item: ClipboardItem) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, item: ClipboardItem) => listener(item);
    ipcRenderer.on(IPC_CHANNEL.clipboardItemAdded, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.clipboardItemAdded, handler);
  },

  /** 기록 하나가 지워질 때마다 지워진 id로 호출된다. 해제 함수를 돌려준다. */
  onItemRemoved: (listener: (id: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, id: string) => listener(id);
    ipcRenderer.on(IPC_CHANNEL.clipboardItemRemoved, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.clipboardItemRemoved, handler);
  },

  /** 기록이 통째로 비워질 때마다 호출된다. 해제 함수를 돌려준다. */
  onCleared: (listener: () => void): (() => void) => {
    const handler = () => listener();
    ipcRenderer.on(IPC_CHANNEL.clipboardCleared, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.clipboardCleared, handler);
  },

  /** 이미지를 OS 기본 뷰어로 연다. 실패 사유를 돌려준다(성공이면 빈 문자열). */
  openImage: (id: string): Promise<string> => ipcRenderer.invoke(IPC_CHANNEL.openImage, id),
};

/** 창 자체를 다루는 창구다. 클립보드와 관심사가 달라 따로 노출한다. */
const windowApi = {
  /**
   * 렌더러가 타이틀 바를 직접 그려야 하는 플랫폼인지다.
   * 메인의 `usesCustomTitleBar`와 같은 기준이어야 한다. 한쪽만 바꾸면 타이틀 바가 겹치거나 사라진다.
   */
  usesCustomTitleBar: process.platform !== 'darwin',

  minimize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.windowMinimize),

  /** 최대화와 복원을 번갈아 한다. */
  toggleMaximize: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.windowToggleMaximize),

  close: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.windowClose),

  /** 지금 최대화된 상태인지 받아 온다. 버튼 아이콘을 처음 그릴 때 쓴다. */
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNEL.windowIsMaximized),

  /** 최대화 여부가 바뀔 때마다 호출된다. 해제 함수를 돌려준다. */
  onMaximizedChange: (listener: (isMaximized: boolean) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean) =>
      listener(isMaximized);
    ipcRenderer.on(IPC_CHANNEL.windowMaximizedChanged, handler);
    return () => ipcRenderer.off(IPC_CHANNEL.windowMaximizedChanged, handler);
  },
};

/** 클립보드 기록이 아니라 앱 자체를 다루는 창구다. */
const appApi = {
  /** 앱 정보를 보여 주는 자식창을 연다. */
  openAboutWindow: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNEL.openAboutWindow),

  /** 앱 버전과 이 PC의 사양을 받아 온다. */
  getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke(IPC_CHANNEL.getSystemInfo),
};

export type ClipboardApi = typeof clipboardApi;
export type WindowApi = typeof windowApi;
export type AppApi = typeof appApi;

contextBridge.exposeInMainWorld('clipboardApi', clipboardApi);
contextBridge.exposeInMainWorld('windowApi', windowApi);
contextBridge.exposeInMainWorld('appApi', appApi);
