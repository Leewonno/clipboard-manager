/** 메인 · 렌더러가 함께 쓰는 IPC 채널 이름이다. 문자열 오타를 막으려고 한곳에 모아 둔다. */
export const IPC_CHANNEL = {
  /** 렌더러 → 메인. 항목 하나를 자식창(상세 화면)으로 연다. */
  openDetailWindow: 'clipboard:open-detail-window',

  /** 자식창 렌더러 → 메인. 자신이 보여줄 항목을 받아 온다. */
  getDetailItem: 'clipboard:get-detail-item',

  /** 메인 → 자식창 렌더러. 이미 열린 자식창이 다른 항목으로 바뀌었음을 알린다. */
  detailItemChanged: 'clipboard:detail-item-changed',

  /** 렌더러 → 메인. 지금까지 쌓인 클립보드 기록을 최신순으로 받아 온다. */
  getHistory: 'clipboard:get-history',

  /** 메인 → 렌더러. 새로 복사된 항목이 생겼음을 알린다. */
  clipboardItemAdded: 'clipboard:item-added',

  /** 자식 -> 메인. 삭제할 항목이 생겼음을 알린다. */
  deleteItem: 'clipboard:delete-item',

  deleteAllItem: 'clipboard:delete-all-item',

  /** 메인 → 렌더러. 기록 하나가 지워졌음을 알린다. 페이로드는 지워진 항목의 id다. */
  clipboardItemRemoved: 'clipboard:item-removed',

  /** 메인 → 렌더러. 기록이 통째로 비워졌음을 알린다. 페이로드는 없다. */
  clipboardCleared: 'clipboard:cleared',

  /** 렌더러 → 메인. 직접 만든 타이틀 바의 최소화 버튼이다. */
  windowMinimize: 'window:minimize',

  /** 렌더러 → 메인. 최대화와 복원을 번갈아 한다. */
  windowToggleMaximize: 'window:toggle-maximize',

  /** 렌더러 → 메인. 직접 만든 타이틀 바의 닫기 버튼이다. */
  windowClose: 'window:close',

  /** 렌더러 → 메인. 버튼 아이콘을 처음 그릴 때 필요한 최대화 여부를 받아 온다. */
  windowIsMaximized: 'window:is-maximized',

  /** 메인 → 렌더러. 최대화 여부가 바뀌었음을 알린다. 페이로드는 최대화 여부다. */
  windowMaximizedChanged: 'window:maximized-changed',

  /** 렌더러 → 메인. 이미지를 OS 기본 뷰어로 연다. */
  openImage: 'clipboard:open-image',

  /** 렌더러 → 메인. 앱 정보를 보여 주는 자식창을 연다. */
  openAboutWindow: 'app:open-about-window',

  /** 앱 정보 창 렌더러 → 메인. 앱 버전과 이 PC의 사양을 받아 온다. */
  getSystemInfo: 'app:get-system-info',
} as const;
