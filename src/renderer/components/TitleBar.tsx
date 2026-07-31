import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** 창 버튼 셋이 크기와 배치를 공유한다. */
const CONTROL_BUTTON_CLASS =
  'flex h-8 w-11 items-center justify-center text-slate-600 transition-colors';

type TitleBarProps = {
  /** 바 왼쪽에 놓을 창 이름이다. */
  title: string;

  /** 최대화가 의미 없는 창(상세창)에서는 버튼을 감춘다. */
  showMaximize?: boolean;
};

/**
 * Windows에서 기본 타이틀 바 대신 쓰는 바다. macOS는 기본 타이틀 바를 그대로 쓰므로 이 바를 그리지 않는다.
 * 그릴지 말지는 RootLayout이 `window.windowApi.usesCustomTitleBar`로 정한다.
 */
export default function TitleBar({ title, showMaximize = true }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // 최대화된 채로 다시 열릴 수 있어서 구독만으로는 첫 아이콘을 맞출 수 없다.
    window.windowApi.isMaximized().then(setIsMaximized);
    return window.windowApi.onMaximizedChange(setIsMaximized);
  }, []);

  return (
    // 끌기 영역은 Chromium이 요소의 레이아웃 사각형으로 계산해 OS에 넘긴다.
    // sticky·fixed처럼 흐름에서 빠지면 그 사각형이 실제 그려진 위치와 어긋나서, 위치를 건드리지 않는다.
    // 대신 RootLayout이 본문만 스크롤시켜서 이 바가 스크롤을 타지 않게 한다.
    // user-select를 끄지 않으면 창을 끌 때 글자가 잡힌다.
    <header className="app-drag flex h-8 shrink-0 select-none items-center justify-between border-b border-slate-200 bg-white">
      <span className="truncate px-3 text-xs text-slate-500">{title}</span>

      <div className="app-no-drag flex">
        <button
          type="button"
          onClick={() => window.windowApi.minimize()}
          aria-label="최소화"
          className={`${CONTROL_BUTTON_CLASS} hover:bg-slate-100`}
        >
          <Minus className="size-3.5" />
        </button>

        {showMaximize && (
          <button
            type="button"
            onClick={() => window.windowApi.toggleMaximize()}
            aria-label={isMaximized ? '이전 크기로 복원' : '최대화'}
            className={`${CONTROL_BUTTON_CLASS} hover:bg-slate-100`}
          >
            {isMaximized ? <Copy className="size-3" /> : <Square className="size-3" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => window.windowApi.close()}
          aria-label="닫기"
          className={`${CONTROL_BUTTON_CLASS} hover:bg-red-600 hover:text-white`}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </header>
  );
}
