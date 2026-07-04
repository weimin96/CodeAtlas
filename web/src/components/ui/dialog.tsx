import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6" onMouseDown={() => onOpenChange(false)}>
    <div role="dialog" aria-modal="true" className="w-full max-w-2xl" onMouseDown={(event) => event.stopPropagation()}>
      {children}
    </div>
  </div>;
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('overflow-hidden rounded-xl border bg-white shadow-xl', className)}>{children}</div>;
}

export function DialogHeader({ title, description, onClose }: { title: string; description?: string; onClose: () => void }) {
  return <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
    <div>
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="关闭弹窗">
      <X size={16} />
    </Button>
  </div>;
}

export function DialogBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex items-center justify-end gap-2 border-t bg-slate-50 px-6 py-4', className)}>{children}</div>;
}
