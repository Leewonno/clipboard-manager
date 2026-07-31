import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ClipboardItem } from '../../shared/clipboard';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatAbsoluteTime } from '../utils/formatAbsoluteTime';

export default function DetailPage() {
  const [item, setItem] = useState<ClipboardItem | null>(null);

  useEffect(() => {
    window.clipboardApi.getDetailItem().then(setItem);
    // 창이 열려 있는 동안 목록에서 다른 항목을 클릭하면 이 창의 내용만 바뀐다.
    return window.clipboardApi.onDetailItemChange(setItem);
  }, []);

  // 삭제에 성공하면 메인이 이 창을 닫아 준다. 실패했을 때만 화면에 남아 알림을 띄운다.
  const handleDeleteItem = async () => {
    if (!item) return;

    try {
      await window.clipboardApi.deleteItem(item.id);
    } catch (error) {
      console.error('삭제에 실패했습니다.', error);
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('복사했습니다');
  };

  if (!item) {
    return (
      <p className="px-5 py-10 text-center text-sm text-slate-400">항목을 불러오는 중입니다.</p>
    );
  }

  return (
    <section className="flex h-65 flex-col gap-2.5">
      <div className="flex items-end gap-2 text-xs">
        {item.sourceApp && <span className="text-slate-400">{item.sourceApp}</span>}
        <time className="ml-auto text-slate-300" dateTime={item.copiedAt}>
          {formatAbsoluteTime(item.copiedAt)}
        </time>
      </div>

      {/* 이미지는 content가 저장된 파일을 가리키는 주소라 그대로 그린다. 나머지는 원문을 보여 준다. */}
      {item.type === 'image' ? (
        <button
          type="button"
          onClick={() => {
            window.clipboardApi.openImage(item.id);
          }}
          className="flex items-center justify-center h-full overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <img src={item.content} alt="복사한 이미지" className="mx-auto max-w-full" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleCopy(item.content)}
          className="h-full flex text-left overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 whitespace-pre-wrap break-all text-sm text-slate-800"
        >
          {item.content}
        </button>
      )}

      <div className="flex justify-between items-center gap-2 text-xs text-slate-400">
        {/* 이미지는 content가 파일 주소라 글자 수를 세도 의미가 없다. */}
        <span>{item.type !== 'image' && `${item.content.length}자`}</span>

        <div className="flex gap-2">
          <ConfirmDialog
            triggerLabel="삭제"
            title="이 항목을 삭제하시겠습니까?"
            description="삭제한 항목은 복구할 수 없습니다."
            confirmLabel="삭제"
            onConfirm={handleDeleteItem}
          />

          {item.type !== 'image' && (
            <button
              type="button"
              onClick={() => {
                handleCopy(item.content);
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              복사
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
