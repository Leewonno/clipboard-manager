import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { clipboard } from 'electron';

const execFileAsync = promisify(execFile);

/**
 * 출처를 클립보드에 직접 적어 주는 앱이 쓰는 포맷 (nspasteboard.org 관례)
 * 값은 "com.google.Chrome" 같은 번들 ID -> 지키는 앱이 많지는 않지만 있으면 가장 정확
 */
const SOURCE_FORMAT = 'org.nspasteboard.source';

/**
 * macOS 기본 내장 도구(권한 프롬프트 없이 앱 정보를 읽음)
 * GUI로 실행된 앱은 PATH가 최소한만 잡혀서 절대 경로로 부름
 */
const LSAPPINFO = '/usr/bin/lsappinfo';

/**
 * "LSDisplayName"="Finder" -> "Finder" 이름만 떼어 낸다.
 */
const parseDisplayName = (stdout: string): string | null =>
  stdout.trim().match(/^"LSDisplayName"="(.+)"$/)?.[1] || null;

const lsappinfo = async (...args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync(LSAPPINFO, args, { timeout: 1000 });
  return stdout;
};

/**
 * 번들 ID를 화면에 보여 줄 이름으로 바꿈
 * 조회에 실패하면 마지막 마디로 때운다("com.google.Chrome" → "Chrome").
 */
const resolveBundleId = async (bundleId: string): Promise<string> => {
  try {
    const name = parseDisplayName(await lsappinfo('info', '-only', 'name', bundleId));
    if (name) {
      return name;
    }
  } catch {
    // 아래 폴백으로
  }
  return bundleId.split('.').pop() || bundleId;
};

/** 지금 최전면에 있는 앱 이름이다. */
const readFrontmostAppName = async (): Promise<string | null> => {
  try {
    // 최전면 앱은 ASN(Application Serial Number)으로 나와서 이름을 한 번 더 물어봐야 한다.
    const asn = (await lsappinfo('front')).trim();
    if (!asn) {
      return null;
    }

    return parseDisplayName(await lsappinfo('info', '-only', 'name', asn));
  } catch {
    return null;
  }
};

/**
 * 복사한 앱 이름을 / 알 수 없으면 null
 * Windows·Linux는 네이티브 호출이 필요해서 아직 null
 */
export const readSourceApp = async (): Promise<string | null> => {
  if (process.platform !== 'darwin') {
    return null;
  }

  const declared = clipboard.read(SOURCE_FORMAT).trim();
  if (declared) {
    return resolveBundleId(declared);
  }

  return readFrontmostAppName();
};
