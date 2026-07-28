const absoluteTimeFormat = new Intl.DateTimeFormat('ko', {
  dateStyle: 'long',
  timeStyle: 'medium',
});

/** ISO 시각을 "2026년 7월 28일 오후 6:41:12"처럼 전체 날짜 문구로 바꾼다. */
export function formatAbsoluteTime(isoDate: string) {
  return absoluteTimeFormat.format(new Date(isoDate));
}
