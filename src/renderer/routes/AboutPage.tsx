import { useEffect, useState } from 'react';
import type { SystemInfo } from '../../shared/systemInfo';

/** process.platform 값은 사용자에게 낯설어서 아는 이름으로 바꿔 보여 준다. */
const PLATFORM_LABEL: Record<string, string> = {
  darwin: 'macOS',
  win32: 'Windows',
  linux: 'Linux',
};

/** 메모리는 바이트로 넘어와서 GB로 줄여 보여 준다. */
const formatMemory = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

/** 한 줄에 항목 이름과 값을 놓는다. 값이 길면 줄바꿈 대신 넘치는 쪽을 자른다. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="truncate text-slate-700" title={value}>
        {value}
      </dd>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xs font-semibold text-slate-500">{title}</h2>
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
        {children}
      </dl>
    </div>
  );
}

export default function AboutPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    window.appApi.getSystemInfo().then(setInfo);
  }, []);

  if (!info) {
    return (
      <p className="px-5 py-10 text-center text-sm text-slate-400">정보를 불러오는 중입니다.</p>
    );
  }

  const platform = PLATFORM_LABEL[info.platform] ?? info.platform;

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <h1 className="font-semibold text-slate-700">클립보드 매니저</h1>
        <p className="text-xs text-slate-400">버전 {info.appVersion}</p>
      </header>

      <InfoSection title="접속 기기">
        <InfoRow label="운영체제" value={`${platform} ${info.osVersion}`} />
        <InfoRow label="기기 이름" value={info.hostname} />
        <InfoRow label="사용자" value={info.username} />
        <InfoRow label="프로세서" value={info.cpuModel} />
        <InfoRow label="코어" value={`${info.cpuCount}코어 (${info.arch})`} />
        <InfoRow label="메모리" value={formatMemory(info.totalMemory)} />
        <InfoRow label="디스플레이" value={`${info.displayCount}대`} />
      </InfoSection>

      <InfoSection title="실행 환경">
        <InfoRow label="Electron" value={info.electronVersion} />
        <InfoRow label="Chromium" value={info.chromeVersion} />
        <InfoRow label="Node.js" value={info.nodeVersion} />
      </InfoSection>
    </section>
  );
}
