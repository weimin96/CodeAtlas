import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ActionItem({
  children,
  onClick,
  className
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return <button
    type="button"
    onClick={onClick}
    className={cn('w-full rounded-md border p-2 text-left text-xs transition-colors hover:bg-accent', className)}
  >
    {children}
  </button>;
}
