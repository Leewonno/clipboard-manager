import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, clipboard } from 'electron';
import type { ClipboardItem, ClipboardItemType } from '../shared/clipboard';
import { IPC_CHANNEL } from '../shared/ipc';
import { loadHistory, scheduleSave } from './historyStore';
import { removeAllImages, removeImage, saveImage } from './imageStore';
import { readSourceApp } from './sourceApp';

// 클립보드 복사 체크 간격
const POLL_INTERVAL_MS = 1000;

/** 메모리에 들고 있을 최대 기록 수다. 넘치면 오래된 것부터 버린다. */
const MAX_HISTORY = 200;

/**
 * 비밀번호 관리자 같은 앱이 "이건 기록하지 말라"고 표시할 때 쓰는 포맷
 * OS마다 이름이 달라서 둘 다 확인
 */
const CONCEALED_FORMATS = [
  'org.nspasteboard.ConcealedType',
  'ExcludeClipboardContentFromMonitorProcessing',
];

/** 최신순 기록 */
const history: ClipboardItem[] = [];

/** 저장해 둔 기록을 다 읽어 왔는지다. 렌더러가 그전에 목록을 물어보면 이걸 기다렸다 답한다. */
let hydration: Promise<void> = Promise.resolve();

/** 직전에 읽은 클립보드의 지문이다. 같은 값이면 새 기록으로 치지 않는다. */
let lastSignature: string | null = null;

let pollTimer: NodeJS.Timeout | null = null;

/**
 * 한 번 읽어 낸 클립보드의 스냅샷이다.
 * 이미지는 본문을 별도 파일로 저장해야 해서, 주소가 정해지기 전까지 PNG 원본을 들고 있는다.
 */
type ClipboardSnapshot = {
  /** 직전 값과 같은지 비교하는 용도. 이미지는 내용이 커서 해시로 줄여 둔다. */
  signature: string;
} & (
  | { type: Exclude<ClipboardItemType, 'image'>; content: string }
  | { type: 'image'; png: Buffer }
);

const isLink = (text: string) => /^https?:\/\/\S+$/.test(text.trim());

/**
 * Finder에서 복사한 파일의 경로를 읽는다.
 * 파일 복사는 OS마다 포맷이 전혀 달라서 지금은 macOS만 처리하고, 그 외에서는 텍스트로 떨어진다.
 */
const readFilePath = (): string | null => {
  if (process.platform !== 'darwin') {
    return null;
  }

  const fileUrl = clipboard.read('public.file-url').trim();
  if (!fileUrl) {
    return null;
  }

  try {
    return fileURLToPath(fileUrl);
  } catch {
    return null;
  }
};

/** 기록해도 되는 내용인지 확인한다. 표시가 없는 앱도 많아서 완벽하게 걸러지지는 않는다. */
const isConcealed = () => {
  const formats = clipboard.availableFormats();
  return CONCEALED_FORMATS.some((format) => formats.includes(format) || clipboard.has(format));
};

/**
 * 지금 클립보드에 있는 내용을 읽는다. 기록할 것이 없으면 null이다.
 *
 * 이미지를 복사해도 텍스트가 같이 실려 오는 경우(웹에서 이미지 복사 등)가 있어서
 * 파일 → 텍스트 → 이미지 순으로 확인해 결과를 예측 가능하게 둔다.
 */
const readSnapshot = (): ClipboardSnapshot | null => {
  if (isConcealed()) {
    return null;
  }

  const filePath = readFilePath();
  if (filePath) {
    return { type: 'file', content: filePath, signature: `file:${filePath}` };
  }

  const text = clipboard.readText();
  if (text.trim()) {
    const type: ClipboardItemType = isLink(text) ? 'link' : 'text';
    return { type, content: text, signature: `${type}:${text}` };
  }

  const image = clipboard.readImage();
  if (!image.isEmpty()) {
    const png = image.toPNG();
    return {
      type: 'image',
      png,
      signature: `image:${createHash('sha1').update(png).digest('hex')}`,
    };
  }

  return null;
};

/** 열려 있는 모든 창에 기록이 바뀌었음을 알린다. 구독하지 않는 창은 그냥 무시한다. */
const broadcast = (channel: string, payload: unknown) => {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
};

/** MAX_HISTORY를 넘긴 만큼 잘라 내면서, 딸려 있던 이미지 파일도 같이 치운다. */
const dropOverflow = () => {
  for (const dropped of history.splice(MAX_HISTORY)) {
    if (dropped.type === 'image') {
      removeImage(dropped.id).catch((error) => {
        console.error('오래된 이미지를 지우지 못했습니다.', error);
      });
    }
  }
};

const pollOnce = async () => {
  const snapshot = readSnapshot();

  if (!snapshot || snapshot.signature === lastSignature) {
    return;
  }

  // 앱 이름을 기다리는 사이에 다음 폴링이 같은 내용을 또 잡지 않도록 지문을 먼저 갱신한다.
  lastSignature = snapshot.signature;
  const copiedAt = new Date().toISOString();
  const id = randomUUID();

  // 불러오기가 끝나기 전에 저장하면 지난 기록을 통째로 덮어쓰게 된다.
  await hydration;

  const item: ClipboardItem = {
    id,
    type: snapshot.type,
    // 이미지는 본문을 파일로 빼고, 그 파일을 가리키는 주소만 기록에 담는다.
    content: snapshot.type === 'image' ? await saveImage(id, snapshot.png) : snapshot.content,
    sourceApp: await readSourceApp(),
    copiedAt,
  };

  history.unshift(item);
  dropOverflow();

  scheduleSave(history);
  broadcast(IPC_CHANNEL.clipboardItemAdded, item);
};

/** 최신순 기록을 돌려준다. 렌더러가 처음 켜질 때 한 번 받아 간다. */
export const getClipboardHistory = async (): Promise<ClipboardItem[]> => {
  await hydration;
  return history;
};

/**
 * 기록 하나를 지운다. 이미지면 본문 파일도 같이 치운다.
 * 이미 없는 id면 아무것도 하지 않고 false를 돌려준다.
 */
export const deleteClipboardItem = async (id: string): Promise<boolean> => {
  await hydration;

  const index = history.findIndex((item) => item.id === id);
  if (index === -1) {
    return false;
  }

  const [removed] = history.splice(index, 1);
  if (removed.type === 'image') {
    await removeImage(removed.id);
  }

  scheduleSave(history);
  // 지운 항목을 목록에 그대로 두지 않도록 열려 있는 창에 함께 알린다.
  broadcast(IPC_CHANNEL.clipboardItemRemoved, id);

  return true;
};

/**
 * 기록을 모두 지운다. 이미지 본문 파일도 폴더째 함께 치운다.
 * 이미 비어 있으면 아무것도 하지 않고 false를 돌려준다.
 */
export const deleteClipboardAllItem = async (): Promise<boolean> => {
  await hydration;

  if (history.length === 0) {
    return false;
  }

  // 감시 중인 배열을 그대로 써야 해서 새 배열로 바꾸지 않고 길이만 0으로 만든다.
  history.length = 0;
  await removeAllImages();

  scheduleSave(history);
  // 목록을 통째로 비워야 해서 항목마다 알리지 않고 한 번만 알린다.
  broadcast(IPC_CHANNEL.clipboardCleared, undefined);

  return true;
};

/** 클립보드 감시를 시작한다. app이 ready된 뒤에 호출해야 한다. */
export const startClipboardWatcher = () => {
  if (pollTimer) {
    return;
  }

  // 지난번에 저장해 둔 기록을 되살린다. MAX_HISTORY를 줄인 채로 켰다면 여기서 정리된다.
  hydration = loadHistory()
    .then((saved) => {
      history.push(...saved);
      dropOverflow();
    })
    .catch((error) => {
      console.error('저장해 둔 기록을 불러오지 못했습니다.', error);
    });

  // 앱을 켜기 전부터 클립보드에 있던 내용은 기록하지 않도록 지문만 먼저 맞춰 둔다.
  lastSignature = readSnapshot()?.signature ?? null;

  pollTimer = setInterval(() => {
    // 앱 이름 조회 때문에 비동기라, 한 번 실패해도 타이머가 멈추지 않게 여기서 받아 낸다.
    pollOnce().catch((error) => {
      console.error('클립보드를 읽지 못했습니다.', error);
    });
  }, POLL_INTERVAL_MS);
};

export const stopClipboardWatcher = () => {
  if (!pollTimer) {
    return;
  }

  clearInterval(pollTimer);
  pollTimer = null;
};
