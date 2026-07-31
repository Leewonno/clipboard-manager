/**
 * electron-winstaller의 install 스크립트(select-7z-arch.js)는 호스트 arch에 맞는
 * 7-Zip을 vendor/7z.exe로 복사한다. 호스트가 Windows라는 가정이라, arm64 Mac에서는
 * ARM64용 Windows PE가 선택된다. macOS의 Wine은 x86/x86-64 PE만 실행할 수 있어
 * Squirrel이 nupkg를 압축할 때 "ShellExecuteEx failed: File not found"로 죽는다.
 *
 * arm64 macOS에서는 x64 7-Zip으로 되돌려 준다.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  process.exit(0);
}

let vendor;
try {
  const require = createRequire(import.meta.url);
  vendor = join(dirname(require.resolve('electron-winstaller/package.json')), 'vendor');
} catch {
  // Windows 빌드를 하지 않는 환경에서는 설치되어 있지 않을 수 있다.
  process.exit(0);
}

for (const [from, to] of [
  ['7z-x64.exe', '7z.exe'],
  ['7z-x64.dll', '7z.dll'],
]) {
  const source = join(vendor, from);
  if (!existsSync(source)) {
    console.warn(`[fix-winstaller-7z] ${from} 없음, 건너뜀`);
    continue;
  }
  copyFileSync(source, join(vendor, to));
}

console.log('[fix-winstaller-7z] vendor/7z.exe를 x64 빌드로 교체');
