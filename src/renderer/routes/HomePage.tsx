import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ClipboardItem } from '../../shared/clipboard';
import ClipboardList from '../components/ClipboardList';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HomePage() {
  const [items, setItems] = useState<ClipboardItem[]>([]);

  useEffect(() => {
    // 구독을 먼저 걸어야 기록을 받아 오는 사이에 복사·삭제된 항목을 놓치지 않는다.
    const unsubscribeAdded = window.clipboardApi.onItemAdded((item) => {
      setItems((prev) => [item, ...prev]);
    });

    // 삭제는 상세창에서 일어나서, 목록은 메인이 알려 줄 때 맞춘다.
    const unsubscribeRemoved = window.clipboardApi.onItemRemoved((id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    });

    // 모두 삭제는 항목마다 알려 오지 않아서 따로 받아 비운다.
    const unsubscribeCleared = window.clipboardApi.onCleared(() => {
      setItems([]);
    });

    window.clipboardApi.getHistory().then((history) => {
      // 받아 오는 동안 먼저 도착한 항목은 그대로 두고, 겹치지 않는 것만 뒤에 잇는다.
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...history.filter((item) => !seen.has(item.id))];
      });
    });

    return () => {
      unsubscribeAdded();
      unsubscribeRemoved();
      unsubscribeCleared();
    };
  }, []);

  const handleAllDeleteItem = async () => {
    try {
      await window.clipboardApi.deleteAllItem();
    } catch (e) {
      console.error(e);
      toast.error('삭제하지 못했습니다');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Home 헤더 */}
      <div className="flex justify-between items-end">
        <h1 className="font-semibold text-slate-700 whitespace-nowrap">클립보드 매니저</h1>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-slate-400 whitespace-nowrap">총 {items.length}건</span>
          <ConfirmDialog
            triggerLabel="모두 삭제"
            triggerClassName="text-xs"
            title="항목을 모두 삭제하시겠습니까?"
            description="삭제한 항목은 복구할 수 없습니다."
            confirmLabel="삭제"
            onConfirm={handleAllDeleteItem}
          />
        </div>
      </div>
      {/* Home 클립보드 목록 */}
      <ClipboardList items={items} />
    </section>
  );
}
