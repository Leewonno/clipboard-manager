/**
 * @file generateInstallerNsh.js
 * @description Electron NSIS 설치 설정을 위한 installer.nsh 파일을 생성합니다.
 * electron-builder의 nsis.include 옵션에서 사용되며,
 * 설치 디렉토리를 강제로 지정하고 설치 환경을 초기화합니다.
 *
 * @usage
 *   node scripts/generateInstallerNsh.js
 *
 * @see https://www.electron.build/nsis
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM에서 __dirname, __filename을 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 사용자 정의 설치 경로
const INSTALL_PATH = "C:\\\\Program Files (x86)\\\\Tilon\\\\Station";

// NSIS 매크로 작성
const content = `
RequestExecutionLevel admin
CRCCheck off
!include "WinMessages.nsh"
!include "LogicLib.nsh"

!macro preInit 
  ; 강제 프로세스 종료
  nsExec::ExecToLog 'taskkill /F /IM Station.exe'
  Sleep 1000

  ; 기존 설치 제거
  IfFileExists "$INSTDIR\\Uninstall Station.exe" 0 +3
    ExecWait '"$INSTDIR\\Uninstall Station.exe" /S'
    Sleep 2000
!macroend
    
!macro customInit 
  ; 설치 경로 설정
  SetOverwrite try
  StrCpy $INSTDIR "C:\\Program Files (x86)\\Tilon\\Station"
!macroend
`;

// 저장 경로
const outputPath = path.join(__dirname, "..", "build", "installer.nsh");

// 생성
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content.trim(), "utf8");

console.log("[installer.nsh] 사용자 정의 설치 경로 설정 완료 →", INSTALL_PATH);
