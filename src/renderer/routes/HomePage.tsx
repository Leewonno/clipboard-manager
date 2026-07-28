import { useEffect, useState } from 'react';

import type { ClipboardItem } from '../../shared/clipboard';
import ClipboardList from '../components/ClipboardList';

export default function HomePage() {
  const [items, setItems] = useState<ClipboardItem[]>([]);

  useEffect(() => {
    // 구독을 먼저 걸어야 기록을 받아 오는 사이에 복사된 항목을 놓치지 않는다.
    const unsubscribe = window.clipboardApi.onItemAdded((item) => {
      setItems((prev) => [item, ...prev]);
    });

    window.clipboardApi.getHistory().then((history) => {
      // 받아 오는 동안 먼저 도착한 항목은 그대로 두고, 겹치지 않는 것만 뒤에 잇는다.
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...history.filter((item) => !seen.has(item.id))];
      });
    });

    return unsubscribe;
  }, []);

  return (
    <section className="flex flex-col gap-4">
      {/* Home 헤더 */}
      <div className="flex justify-between items-end">
        <h1 className="font-semibold text-slate-700">클립보드</h1>
        <span className="text-xs text-slate-400">총 {items.length}건</span>
      </div>
      {/* Home 클립보드 목록 */}
      <ClipboardList items={items} />
    </section>
  );
}
