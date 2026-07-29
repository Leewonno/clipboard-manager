// ===============================================
// 공통 컨펌 컴포넌트
// ===============================================

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel = '확인',
  onConfirm,
}: ConfirmDialogProps) {
  // AlertDialogAction은 Base UI의 Close가 아니라 그냥 버튼이라, 열림 상태를 직접 쥐고 닫아 준다.
  const [isOpen, setOpen] = useState(false);

  const handleConfirm = async () => {
    setOpen(false);
    await onConfirm();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className={cn(
              'rounded-md whitespace-nowrap border border-slate-200 px-3 py-1.5 text-red-600 transition-colors hover:border-slate-300 hover:bg-slate-50',
              triggerClassName,
            )}
          />
        }
      >
        {triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
