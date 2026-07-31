import { Outlet, useLocation } from 'react-router';
import TitleBar from '@/components/TitleBar';
import { Toaster } from '@/components/ui/sonner';

/** 자식창으로 뜨는 경로와 그 창 이름이다. 여기 없는 경로는 메인창으로 본다. */
const CHILD_WINDOW_TITLE: Record<string, string> = {
  '/detail': '상세 보기',
  '/about': '앱 정보',
};

export default function RootLayout() {
  const { pathname } = useLocation();

  const childWindowTitle = CHILD_WINDOW_TITLE[pathname];

  // 자식창은 크기가 고정된 작은 창이라 최대화 버튼을 두지 않는다.
  const isChildWindow = childWindowTitle !== undefined;

  return (
    // 타이틀 바가 스크롤을 타면 끌기 영역이 실제 위치와 어긋난다.
    // 그래서 문서를 스크롤시키지 않고, 창 높이를 꽉 채운 뒤 본문만 스크롤시킨다.
    <div className="flex h-screen flex-col">
      {/* macOS는 기본 타이틀 바를 그대로 쓰고, Windows에서만 직접 만든 바를 그린다. */}
      {window.windowApi.usesCustomTitleBar && (
        <TitleBar title={childWindowTitle ?? '클립보드 매니저'} showMaximize={!isChildWindow} />
      )}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
      <Toaster closeButton />
    </div>
  );
}
