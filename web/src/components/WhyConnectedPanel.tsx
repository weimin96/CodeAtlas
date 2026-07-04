import { GitFork } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CodeReference } from '@/types';

export function WhyConnectedPanel({
  title,
  description,
  source,
  target,
  evidence,
  onOpenFile
}: {
  title: string;
  description: string;
  source: string;
  target: string;
  evidence: CodeReference[];
  onOpenFile?: (reference: CodeReference) => void;
}) {
  const topEvidence = evidence.filter((item) => item.path).slice(0, 5);
  return <Card className="border-blue-100 bg-blue-50/30">
    <CardContent className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><GitFork size={16} className="text-blue-700" />{title}</div>
        <Badge variant="outline">Why Connected</Badge>
      </div>
      <div className="text-sm leading-6 text-slate-700">{description}</div>
      <div className="rounded-lg border bg-white p-3 text-sm">
        <div className="font-medium text-slate-950">{source}</div>
        <div className="my-1 text-xs text-slate-400">↓ 通过代码路径 / 证据 / 报告对象关联</div>
        <div className="font-medium text-slate-950">{target}</div>
      </div>
      <div className="space-y-2">
        {topEvidence.map((reference) => <div key={`${reference.path}-${reference.startLine || ''}`} className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3">
          <div className="min-w-0">
            <div className="truncate font-mono text-xs font-semibold text-slate-950">{reference.path}{reference.startLine ? `:${reference.startLine}` : ''}</div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{reference.reason || '代码证据'}</div>
          </div>
          {onOpenFile && <Button size="sm" variant="outline" onClick={() => onOpenFile(reference)}>打开</Button>}
        </div>)}
        {!topEvidence.length && <div className="rounded-lg border bg-white p-3 text-sm text-slate-500">暂无可定位代码证据。</div>}
      </div>
    </CardContent>
  </Card>;
}
