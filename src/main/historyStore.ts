import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type { ClipboardItem, ClipboardItemType } from '../shared/clipboard';
import { hasImage, pruneImages } from './imageStore';

/** 연속으로 복사할 때 매번 디스크를 건드리지 않도록 이만큼 모았다가 한 번에 쓴다. */
const SAVE_DEBOUNCE_MS = 500;

const historyPath = () => path.join(app.getPath('userData'), 'history.json');

/** 쓰다 만 파일이 그대로 남지 않게 임시 파일에 먼저 쓰고 이름만 바꾼다. */
const tempPath = () => `${historyPath()}.tmp`;

const ITEM_TYPES: ClipboardItemType[] = ['text', 'link', 'image', 'file'];

/** 사람이 열어 고칠 수 있는 파일이라, 모양이 맞는 항목만 통과시킨다. */
const isClipboardItem = (value: unknown): value is ClipboardItem => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.content === 'string' &&
    typeof item.copiedAt === 'string' &&
    ITEM_TYPES.includes(item.type as ClipboardItemType)
  );
};

/**
 * 저장해 둔 기록 읽기 (사용되지 않는 이미지 파일도 함께 정리)
 * 기록을 읽는 김에 짝이 맞지 않는 이미지 파일도 함께 정리한다.
 */
export const loadHistory = async (): Promise<ClipboardItem[]> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await fsp.readFile(historyPath(), 'utf-8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('기록을 읽지 못해 새로 시작합니다.', error);
    }
    return [];
  }

  const items = Array.isArray(parsed) ? parsed.filter(isClipboardItem) : [];

  // 이미지는 본문이 별도 파일이라, 파일이 없어졌으면 기록도 버린다.
  const alive = await Promise.all(
    items.map(async (item) => item.type !== 'image' || (await hasImage(item.id))),
  );
  const history = items.filter((_, index) => alive[index]);

  await pruneImages(history);

  return history;
};

/** 가장 최근에 넘겨받은 기록이다. 실제 쓰기는 이 값을 그때그때 직렬화한다. */
let latest: ClipboardItem[] = [];

/** 마지막 저장 이후로 바뀐 게 있는지다. */
let dirty = false;

let saveTimer: NodeJS.Timeout | null = null;

/** 앞의 쓰기가 끝난 뒤에 다음 쓰기가 가도록 줄을 세운다. 임시 파일이 겹쳐 쓰이지 않게 한다. */
let writing: Promise<void> = Promise.resolve();

const writeNow = async () => {
  const target = historyPath();
  const temp = tempPath();

  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(temp, JSON.stringify(latest));
  await fsp.rename(temp, target);
};

/**
 * 기록을 저장 예약한다. 짧은 사이에 여러 번 불러도 마지막 상태 한 번만 쓴다.
 * 넘겨받은 배열은 호출한 쪽이 계속 고치기 때문에 그 시점 상태로 떠 둔다.
 */
export const scheduleSave = (history: ClipboardItem[]) => {
  latest = history.slice();
  dirty = true;

  if (saveTimer) {
    return;
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;

    if (!dirty) {
      return;
    }
    dirty = false;

    writing = writing
      .then(writeNow)
      .catch((error) => console.error('기록을 저장하지 못했습니다.', error));
  }, SAVE_DEBOUNCE_MS);
};

/**
 * 앱이 꺼지기 직전에 남은 저장을 마무리한다.
 * 종료를 붙잡아 둘 수 없어서, 여기서만 동기로 쓴다.
 */
export const flushHistory = () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  if (!dirty) {
    return;
  }
  dirty = false;

  try {
    const target = historyPath();
    const temp = tempPath();

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(temp, JSON.stringify(latest));
    fs.renameSync(temp, target);
  } catch (error) {
    console.error('종료 직전 기록을 저장하지 못했습니다.', error);
  }
};
