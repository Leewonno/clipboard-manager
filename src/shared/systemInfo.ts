/**
 * 앱 정보 창이 보여 주는 실행 환경 정보다.
 * `os`·`app`·`screen`은 메인에서만 쓸 수 있어서, 메인이 모아 IPC로 넘긴다.
 */
export interface SystemInfo {
  /** 'darwin' | 'win32' | 'linux' */
  platform: string;
  /** OS 버전이다. 커널 버전인 `os.release()`와 달라서 macOS도 사람이 아는 번호로 나온다. */
  osVersion: string;
  /** 'arm64' | 'x64' */
  arch: string;
  /** PC 이름 */
  hostname: string;
  /** OS 로그인 계정 */
  username: string;
  cpuModel: string;
  /** 논리 코어 수 */
  cpuCount: number;
  /** 전체 물리 메모리(바이트)다. 보기 좋은 단위로 바꾸는 건 렌더러가 한다. */
  totalMemory: number;
  /** 연결된 모니터 수 */
  displayCount: number;
  /** package.json의 version이다. */
  appVersion: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}
