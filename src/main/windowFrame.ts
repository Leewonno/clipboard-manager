// ===============================================
// 타이틀 바를 플랫폼별로 나눠 쓰는 부분
// ===============================================

import { BrowserWindow, type IpcMainInvokeEvent, ipcMain } from 'electron';
import { IPC_CHANNEL } from '../shared/ipc';

/**
 * macOS는 기본 타이틀 바가 깔끔해서 그대로 쓰고, 그 밖(Windows)에서는 직접 만든 타이틀 바를 쓴다.
 * 렌더러도 같은 기준으로 갈라져야 해서 preload가 이 값을 다시 계산해 노출한다.
 */
export const usesCustomTitleBar = process.platform !== 'darwin';

/**
 * 창을 만들 때 넣는 옵션
 * `titleBarStyle: 'hidden'`은 `frame: false`와 달리 창 테두리를 남겨서 크기 조절과 스냅이 그대로 동작
 */
export const titleBarWindowOptions = usesCustomTitleBar
  ? ({ titleBarStyle: 'hidden' } as const)
  : {};

/** 창 버튼을 누른 렌더러가 들어 있는 창이다. 창마다 따로 다룰 필요가 없어 보낸 쪽을 되짚는다. */
const senderWindow = (event: IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender);

export const registerWindowControlHandlers = () => {
  ipcMain.handle(IPC_CHANNEL.windowMinimize, (event) => {
    senderWindow(event)?.minimize();
  });

  ipcMain.handle(IPC_CHANNEL.windowToggleMaximize, (event) => {
    const window = senderWindow(event);
    if (!window) return;

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNEL.windowClose, (event) => {
    senderWindow(event)?.close();
  });

  ipcMain.handle(
    IPC_CHANNEL.windowIsMaximized,
    (event) => senderWindow(event)?.isMaximized() ?? false,
  );
};

/**
 * 최대화 버튼 아이콘이 상태를 따라가야 해서 창 쪽 변화를 렌더러에 흘려보낸다.
 * 타이틀 바를 직접 그리지 않는 플랫폼에서는 들을 사람이 없어 걸지 않는다.
 */
export const forwardWindowStateEvents = (window: BrowserWindow) => {
  if (!usesCustomTitleBar) return;

  const send = () => {
    if (window.isDestroyed()) return;
    window.webContents.send(IPC_CHANNEL.windowMaximizedChanged, window.isMaximized());
  };

  window.on('maximize', send);
  window.on('unmaximize', send);
};
