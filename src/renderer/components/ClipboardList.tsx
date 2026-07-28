import type { ClipboardItem } from '../../shared/clipboard';
import ClipboardListItem from './ClipboardListItem';

interface ClipboardListProps {
  items: ClipboardItem[];
}

export default function ClipboardList({ items }: ClipboardListProps) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">복사한 항목이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <ClipboardListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
