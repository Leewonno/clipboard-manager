// ===============================================
// PC 시스템 정보 불러오기
// ===============================================

import os from 'node:os';
import { app, screen } from 'electron';
import type { SystemInfo } from '../shared/systemInfo';

/**
 * 앱 정보 창에 뿌릴 실행 환경을 한 번에 모은다.
 * `screen`은 앱이 ready된 뒤에만 쓸 수 있어서, 창을 만들 때가 아니라 렌더러가 요청할 때 부른다.
 */
export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus();

  return {
    platform: process.platform,
    // os.release()는 macOS에서 커널 버전(25.5.0)이 나와서 이쪽을 쓴다.
    osVersion: process.getSystemVersion(),
    arch: process.arch,
    hostname: os.hostname(),
    username: os.userInfo().username,
    cpuModel: cpus[0]?.model ?? '알 수 없음',
    cpuCount: cpus.length,
    totalMemory: os.totalmem(),
    displayCount: screen.getAllDisplays().length,
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
  };
}
