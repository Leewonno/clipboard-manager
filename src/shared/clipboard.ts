/** 클립보드에 복사된 항목의 종류다. */
export type ClipboardItemType = 'text' | 'link' | 'image' | 'file';

/** 목록에 렌더링하는 클립보드 기록 한 건이다. */
export interface ClipboardItem {
  id: string;
  type: ClipboardItemType;
  /**
   * 목록에 보여줄 내용이다.
   * 이미지는 본문이 커서 따로 파일로 저장하고, 여기에는 그 파일을 가리키는 `clip-image://` 주소만 담는다.
   */
  content: string;
  /** 복사가 일어난 앱 이름이다. 출처를 알 수 없으면 undefined다. */
  sourceApp?: string | null;
  /** 복사 시각(ISO 8601). */
  copiedAt: string;
}
