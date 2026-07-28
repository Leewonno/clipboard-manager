import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import started from 'electron-squirrel-startup';
import type { ClipboardItem } from '../shared/clipboard';
import { IPC_CHANNEL } from '../shared/ipc';
import {
  getClipboardHistory,
  startClipboardWatcher,
  stopClipboardWatcher,
} from './clipboardWatcher';
import { flushHistory } from './historyStore';
import { handleImageProtocol, registerImageScheme } from './imageStore';

// Windows에서 설치/제거 시 바로가기 생성/삭제를 처리한다.
if (started) {
  app.quit();
}

// 이미지용 사설 스킴은 ready 전에 등록해야 해서 여기서 부른다.
registerImageScheme();

/** 상세 화면(자식창)이다. 항목을 클릭할 때마다 새로 띄우지 않고 하나를 재사용한다. */
let detailWindow: BrowserWindow | null = null;

/** 자식창이 보여줄 항목이다. 창이 뜬 뒤 렌더러가 IPC로 읽어 간다. */
let detailItem: ClipboardItem | null = null;

/**
 * 렌더러 화면을 창에 로드한다.
 * 라우터가 해시 라우터라서 개발 서버든 패키징된 파일이든 해시로 진입 화면을 지정할 수 있다.
 */
const loadRenderer = (window: BrowserWindow, hash: string) => {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${hash}`);
  } else {
    window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      hash,
    });
  }
};

const createWindow = () => {
  // 브라우저 창을 생성한다.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 그리고 앱의 index.html을 로드한다.
  loadRenderer(mainWindow, '/');

  // 개발자 도구를 연다.
  mainWindow.webContents.openDevTools();
};

/** 클릭한 항목을 자식창에 띄운다. 이미 열려 있으면 내용만 바꾸고 앞으로 가져온다. */
const openDetailWindow = (parent: BrowserWindow | null, item: ClipboardItem) => {
  detailItem = item;

  if (detailWindow && !detailWindow.isDestroyed()) {
    detailWindow.webContents.send(IPC_CHANNEL.detailItemChanged, item);
    detailWindow.focus();
    return;
  }

  detailWindow = new BrowserWindow({
    width: 600,
    height: 400,
    // 부모를 지정하면 자식창이 항상 부모 위에 뜨고 부모가 닫힐 때 함께 닫힌다.
    parent: parent ?? undefined,
    // true면 부모창을 막는 모달창이 된다.
    modal: false,
    // 로드가 끝나기 전 빈 화면이 깜빡이지 않도록 ready-to-show에서 띄운다.
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  detailWindow.once('ready-to-show', () => detailWindow?.show());
  detailWindow.on('closed', () => {
    detailWindow = null;
    detailItem = null;
  });

  loadRenderer(detailWindow, '/detail');
};

const registerIpcHandlers = () => {
  ipcMain.handle(IPC_CHANNEL.openDetailWindow, (event, item: ClipboardItem) => {
    openDetailWindow(BrowserWindow.fromWebContents(event.sender), item);
  });

  ipcMain.handle(IPC_CHANNEL.getDetailItem, () => detailItem);

  ipcMain.handle(IPC_CHANNEL.getHistory, () => getClipboardHistory());
};

// 이 메서드는 Electron의 초기화가 끝나고 브라우저 창을
// 생성할 준비가 되었을 때 호출된다.
// 일부 API는 이 이벤트가 발생한 이후에만 사용할 수 있다.
app.on('ready', () => {
  handleImageProtocol();
  registerIpcHandlers();
  createWindow();
  startClipboardWatcher();
});

// 앱이 완전히 종료되기 전에 감시 타이머를 정리하고, 아직 못 쓴 기록을 마저 저장한다.
app.on('will-quit', () => {
  stopClipboardWatcher();
  flushHistory();
});

// macOS를 제외하고, 모든 창이 닫히면 앱을 종료한다. macOS에서는
// 사용자가 Cmd + Q로 명시적으로 종료하기 전까지 앱과 메뉴 바가
// 활성 상태로 남아 있는 것이 일반적이다.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // OS X에서는 독 아이콘을 클릭했을 때 열려 있는 창이 없으면
  // 앱의 창을 다시 생성하는 것이 일반적이다.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 이 파일에는 앱의 나머지 메인 프로세스 코드를 작성할 수 있다.
// 별도의 파일로 분리한 뒤 여기서 import 해도 된다.
