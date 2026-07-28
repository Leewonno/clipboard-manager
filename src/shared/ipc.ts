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
} as const;
