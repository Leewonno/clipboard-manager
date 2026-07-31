import type { ClipboardItem } from '../../shared/clipboard';
import { formatRelativeTime } from '../utils/formatRelativeTime';

interface ClipboardListItemProps {
  item: ClipboardItem;
}

export default function ClipboardListItem({ item }: ClipboardListItemProps) {
  // 창 생성은 메인 프로세스만 할 수 있어서 preload가 열어 준 IPC 창구로 요청
  const openDetailWindow = () => {
    window.clipboardApi.openDetailWindow(item);
  };

  return (
    <li>
      <button
        type="button"
        onClick={openDetailWindow}
        className="w-full flex flex-col gap-1.5 cursor-pointer rounded-lg border border-slate-100 bg-white px-5 py-4 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2 text-xs">
          {item.sourceApp && <span className="text-slate-400">{item.sourceApp}</span>}
          <time className="ml-auto text-slate-300" dateTime={item.copiedAt}>
            {formatRelativeTime(item.copiedAt)}
          </time>
        </div>
        <div className="text-sm text-slate-800">
          {item.type === 'image' ? (
            <div className="w-full flex justify-center">
              <img src={item.content} alt="복사된 이미지" />
            </div>
          ) : (
            <p className="line-clamp-3 break-all">{item.content}</p>
          )}
        </div>
      </button>
    </li>
  );
}
