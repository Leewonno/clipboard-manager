import { useEffect, useState } from 'react';

import type { ClipboardItem } from '../../shared/clipboard';
import { formatAbsoluteTime } from '../utils/formatAbsoluteTime';

export default function DetailPage() {
  const [item, setItem] = useState<ClipboardItem | null>(null);

  useEffect(() => {
    window.clipboardApi.getDetailItem().then(setItem);
    // 창이 열려 있는 동안 목록에서 다른 항목을 클릭하면 이 창의 내용만 바뀐다.
    return window.clipboardApi.onDetailItemChange(setItem);
  }, []);

  if (!item) {
    return (
      <p className="px-5 py-10 text-center text-sm text-slate-400">항목을 불러오는 중입니다.</p>
    );
  }

  return (
    <section className="flex h-screen flex-col gap-3">
      <div className="flex items-center gap-2 text-xs">
        {item.sourceApp && <span className="text-slate-500">{item.sourceApp}</span>}
        <time className="ml-auto text-slate-400" dateTime={item.copiedAt}>
          {formatAbsoluteTime(item.copiedAt)}
        </time>
      </div>

      {/* 이미지는 content가 저장된 파일을 가리키는 주소라 그대로 그린다. 나머지는 원문을 보여 준다. */}
      {item.type === 'image' ? (
        <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          <img src={item.content} alt="복사한 이미지" className="mx-auto max-w-full" />
        </div>
      ) : (
        <pre className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 whitespace-pre-wrap break-all font-mono text-sm text-slate-800">
          {item.content}
        </pre>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        {item.type !== 'image' && (
          <>
            <span>{item.content.length}자</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(item.content)}
              className="ml-auto rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              다시 복사
            </button>
          </>
        )}
      </div>
    </section>
  );
}
