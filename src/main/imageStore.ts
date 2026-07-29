// ===============================================
// 이미지 파일 CRUD
// ===============================================

import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, net, protocol } from 'electron';
import type { ClipboardItem } from '../shared/clipboard';

/**
 * 이미지를 렌더러에 보여 줄 때 쓰는 사설 스킴
 * 개발 중에는 화면이 http://localhost에서 뜨는데 거기서는 file:// 이미지가 막혀서, 스킴을 직접 하나 판다.
 */
const SCHEME = 'clip-image';

/** standard 스킴이라 URL이 `스킴://호스트/경로`로 파싱 */
const HOST = 'local';

/** 이미지 본문이 쌓이는 폴더 / app.getPath는 ready 전에는 못 부르는 경우가 있어 그때그때 계산 */
const imagesDir = () => path.join(app.getPath('userData'), 'images');

const fileNameOf = (id: string) => `${id}.png`;

const imagePathOf = (fileName: string) => path.join(imagesDir(), fileName);

/** 렌더러가 <img src>에 그대로 넣을 수 있는 주소 */
export const imageUrl = (id: string) => `${SCHEME}://${HOST}/${fileNameOf(id)}`;

/**
 * 스킴에 권한을 붙여 등록 / ready 전에 한 번만 호출해야 해서 감시 시작과 분리
 * standard가 없으면 URL이 제대로 쪼개지지 않고, secure가 없으면 화면에서 안전하지 않은 리소스로 막힘
 */
export const registerImageScheme = () => {
  protocol.registerSchemesAsPrivileged([
    { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
};

/** `clip-image://local/<id>.png` 요청을 이미지 폴더 안의 파일로 연결 (ready 뒤에 호출) */
export const handleImageProtocol = () => {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    // 파일명만 남겨 `../`로 폴더 밖을 넘겨다보는 요청을 잘라 낸다.
    const filePath = imagePathOf(path.basename(decodeURIComponent(pathname)));

    if (path.dirname(filePath) !== imagesDir()) {
      return Promise.resolve(new Response('bad request', { status: 400 }));
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
};

/** 이미지를 파일로 남기고 렌더러가 그릴 수 있는 주소를 돌려준다. */
export const saveImage = async (id: string, png: Buffer): Promise<string> => {
  await fsp.mkdir(imagesDir(), { recursive: true });
  await fsp.writeFile(imagePathOf(fileNameOf(id)), png);
  return imageUrl(id);
};

/** 목록에서 밀려난 이미지를 지우기 */
export const removeImage = (id: string) => fsp.rm(imagePathOf(fileNameOf(id)), { force: true });

/**
 * 이미지를 전부 지운다. 기록을 통째로 비울 때 쓴다.
 * 파일을 하나씩 훑지 않고 폴더째 지운다. 폴더는 다음 saveImage가 다시 만든다.
 */
export const removeAllImages = () => fsp.rm(imagesDir(), { recursive: true, force: true });

/** 기록은 남아 있는데 본문 파일이 사라졌는지 확인 */
export const hasImage = (id: string) =>
  fsp
    .access(imagePathOf(fileNameOf(id)))
    .then(() => true)
    .catch(() => false);

/**
 * 어느 기록도 참조하지 않는 이미지 파일 정리 (시작할 때 한 번 훑음)
 */
export const pruneImages = async (history: ClipboardItem[]) => {
  const keep = new Set(
    history.filter((item) => item.type === 'image').map((item) => fileNameOf(item.id)),
  );

  // 폴더가 아직 없으면 지울 것도 없다.
  const fileNames = await fsp.readdir(imagesDir()).catch(() => [] as string[]);

  await Promise.all(
    fileNames
      .filter((fileName) => !keep.has(fileName))
      .map((fileName) => fsp.rm(imagePathOf(fileName), { force: true })),
  );
};
