import { cn } from '@/lib/utils';

export function BrandMark({ className }: { compact?: boolean; className?: string }) {
  return <div className={cn('flex shrink-0 items-center', className)} aria-label="codemap-ai">
    <img src="/brand/codemap-ai-logo.svg" alt="" className="h-10 w-10 rounded-xl shadow-sm" />
  </div>;
}
