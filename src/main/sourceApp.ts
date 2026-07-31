// ===============================================
// 복사 실행한 어플리케이션 이름 불러오기
// ===============================================

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { clipboard } from 'electron';

const execFileAsync = promisify(execFile);

/**
 * 출처를 클립보드에 직접 적어 주는 앱이 쓰는 포맷 (nspasteboard.org 관례)
 * 값은 "com.google.Chrome" 같은 번들 ID -> 지키는 앱이 많지는 않지만 있으면 가장 정확
 */
const SOURCE_FORMAT = 'org.nspasteboard.source';

// -----------------------------------------------
// macOS
// -----------------------------------------------

/**
 * macOS 기본 내장 도구(권한 프롬프트 없이 앱 정보를 읽음)
 * GUI로 실행된 앱은 PATH가 최소한만 잡혀서 절대 경로로 부름
 */
const LSAPPINFO = '/usr/bin/lsappinfo';

/**
 * "LSDisplayName"="Finder" -> "Finder" 이름만 떼어 냄
 */
const parseDisplayName = (stdout: string): string | null =>
  stdout.trim().match(/^"LSDisplayName"="(.+)"$/)?.[1] || null;

const lsappinfo = async (...args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync(LSAPPINFO, args, { timeout: 1000 });
  return stdout;
};

/**
 * 번들 ID를 화면에 보여 줄 이름으로 바꿈
 * 조회에 실패하면 마지막 마디로 ("com.google.Chrome" → "Chrome")
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

/** macOS에서 지금 최전면에 있는 앱 이름 */
const readMacFrontmostAppName = async (): Promise<string | null> => {
  try {
    // 최전면 앱은 ASN(Application Serial Number)으로 나와서 이름을 한 번 더 물어봐야 함
    const asn = (await lsappinfo('front')).trim();
    if (!asn) {
      return null;
    }
    return parseDisplayName(await lsappinfo('info', '-only', 'name', asn));
  } catch {
    return null;
  }
};

// -----------------------------------------------
// Windows
// -----------------------------------------------

/** macOS의 lsappinfo처럼, PATH를 믿지 않고 절대 경로로 부름 */
const POWERSHELL = `${process.env.SystemRoot || 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;

/**
 * 최전면 창의 프로세스를 찾아 보여 줄 이름을 출력하는 스크립트
 *
 * Windows에는 최전면 앱을 알려 주는 내장 명령이 없어서 user32.dll을 직접 부른다.
 * 창 제목(MainWindowTitle)은 문서 이름까지 섞여 나와서, 실행 파일에 적힌 설명
 * (FileDescription: "Google Chrome" 같은 값)을 먼저 쓰고 없으면 프로세스 이름으로 떨어진다.
 */
const FRONTMOST_APP_SCRIPT = `
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -Name Win -Namespace Clip -MemberDefinition '
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowThreadProcessId(IntPtr window, out int processId);
'
$window = [Clip.Win]::GetForegroundWindow()
if ($window -eq [IntPtr]::Zero) { exit }

# $pid는 PowerShell이 쓰는 이름이라 다른 이름을 써야 한다.
$owner = 0
[void][Clip.Win]::GetWindowThreadProcessId($window, [ref]$owner)
if ($owner -eq 0) { exit }

$process = Get-Process -Id $owner -ErrorAction SilentlyContinue
if (-not $process) { exit }

$name = $null
# 권한이 더 높은 프로세스는 MainModule을 못 읽어서 감싸 둔다.
try { $name = $process.MainModule.FileVersionInfo.FileDescription } catch {}
if ([string]::IsNullOrWhiteSpace($name)) { $name = $process.ProcessName }

Write-Output $name
`;

/**
 * 인용부호가 많은 스크립트는 명령줄을 거치며 깨지기 쉬워서 -EncodedCommand로 넘긴다.
 * PowerShell은 UTF-16LE base64만 받는다.
 */
const ENCODED_FRONTMOST_APP_SCRIPT = Buffer.from(FRONTMOST_APP_SCRIPT, 'utf16le').toString(
  'base64',
);

/** Windows에서 지금 최전면에 있는 앱 이름 */
const readWindowsFrontmostAppName = async (): Promise<string | null> => {
  try {
    const { stdout } = await execFileAsync(
      POWERSHELL,
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        ENCODED_FRONTMOST_APP_SCRIPT,
      ],
      // Add-Type이 C# 코드를 그때그때 컴파일해서 첫 호출이 특히 느리다.
      { timeout: 5000, windowsHide: true },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
};

// -----------------------------------------------
// Linux
// -----------------------------------------------

/**
 * X11 창 속성을 읽는 도구. 배포판에 따라 없을 수도 있어서 실패하면 그냥 포기한다.
 * (Wayland에서는 다른 앱 정보를 볼 수 없어 아예 부르지 않는다)
 */
const XPROP = 'xprop';

/** "_NET_ACTIVE_WINDOW(WINDOW): window id # 0x3c00007" -> "0x3c00007" */
const parseWindowId = (stdout: string): string | null => {
  const id = stdout.match(/#\s*(0x[0-9a-f]+)/i)?.[1];
  return !id || /^0x0+$/i.test(id) ? null : id;
};

/**
 * `WM_CLASS(STRING) = "navigator", "Firefox"` -> "Firefox"
 * 앞쪽은 인스턴스 이름이고 뒤쪽이 앱 이름이라 마지막 값을 쓴다.
 */
const parseWmClass = (stdout: string): string | null => {
  const values = stdout.match(/WM_CLASS\(STRING\) = (.+)/)?.[1] ?? '';
  const appName = values.match(/"([^"]*)"/g)?.pop() ?? '';
  return appName.replaceAll('"', '') || null;
};

/** "Gnome-terminal" -> "Gnome Terminal" 처럼 창 클래스 이름을 읽기 좋게 다듬는다. */
const prettifyWmClass = (wmClass: string): string =>
  wmClass
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const xprop = async (...args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync(XPROP, args, { timeout: 1000 });
  return stdout;
};

/** Linux(X11)에서 지금 최전면에 있는 앱 이름 */
const readLinuxFrontmostAppName = async (): Promise<string | null> => {
  // Wayland는 보안상 다른 앱의 창 정보를 내주지 않는다. XWayland로 뜬 세션은 x11로 잡힌다.
  if (process.env.XDG_SESSION_TYPE === 'wayland') {
    return null;
  }

  try {
    // 창 목록에서 활성 창 id를 먼저 받고, 그 창의 클래스를 다시 물어봐야 한다.
    const windowId = parseWindowId(await xprop('-root', '_NET_ACTIVE_WINDOW'));
    if (!windowId) {
      return null;
    }

    const wmClass = parseWmClass(await xprop('-id', windowId, 'WM_CLASS'));
    return wmClass ? prettifyWmClass(wmClass) : null;
  } catch {
    return null;
  }
};

// -----------------------------------------------

/**
 * 복사한 앱 이름을 리턴 / 알 수 없으면 null
 * 어느 OS든 "지금 최전면에 있는 앱"으로 추정하는 것이라, 복사 직후 앱을 바로 바꾸면 어긋날 수 있다.
 */
export const readSourceApp = async (): Promise<string | null> => {
  // 출처를 적어 주는 관례는 macOS 쪽에만 있어서 여기서만 먼저 확인한다.
  if (process.platform === 'darwin') {
    const declared = clipboard.read(SOURCE_FORMAT).trim();
    return declared ? resolveBundleId(declared) : readMacFrontmostAppName();
  }

  if (process.platform === 'win32') {
    return readWindowsFrontmostAppName();
  }

  if (process.platform === 'linux') {
    return readLinuxFrontmostAppName();
  }

  return null;
};
