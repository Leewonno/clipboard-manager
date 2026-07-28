const relativeTimeFormat = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/** ISO 시각을 "방금 전", "3분 전"처럼 지금 기준 상대 시간 문구로 바꾼다. */
export function formatRelativeTime(isoDate: string, now: Date = new Date()) {
  const elapsedSeconds = Math.round((now.getTime() - new Date(isoDate).getTime()) / 1000);

  if (elapsedSeconds < MINUTE) return '방금 전';
  if (elapsedSeconds < HOUR)
    return relativeTimeFormat.format(-Math.floor(elapsedSeconds / MINUTE), 'minute');
  if (elapsedSeconds < DAY)
    return relativeTimeFormat.format(-Math.floor(elapsedSeconds / HOUR), 'hour');
  return relativeTimeFormat.format(-Math.floor(elapsedSeconds / DAY), 'day');
}
