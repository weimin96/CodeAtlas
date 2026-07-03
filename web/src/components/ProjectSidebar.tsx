import { GitBranch, Route, ShieldAlert } from 'lucide-react';
import { AiConfigCard } from '@/components/AiConfigCard';
import { ActionItem } from '@/components/common/ActionItem';
import { Overview } from '@/components/WorkbenchPanels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AiConfig, CoreFlow, FlowStep, ProjectPayload, Report } from '@/types';

type RiskItem = Report['risks'][number];

export function ProjectSidebar({
  payload,
  report,
  config,
  loading,
  onConfigChange,
  onSaveConfig,
  onSelectFlow,
  onOpenFlowStep,
  onOpenFile,
  onSelectRisk
}: {
  payload: ProjectPayload | null;
  report: Report | null;
  config: AiConfig;
  loading: string;
  onConfigChange: (config: AiConfig) => void;
  onSaveConfig: () => void;
  onSelectFlow: (flow: CoreFlow) => void;
  onOpenFlowStep: (step: FlowStep) => void;
  onOpenFile: (path: string, line?: number) => void;
  onSelectRisk: (risk: RiskItem) => void;
}) {
  return <aside className="border-r overflow-y-auto p-3 space-y-3">
    <Overview report={report} confidenceVariant={confidenceVariant} />
    <AiConfigCard config={config} loading={loading} onChange={onConfigChange} onSave={onSaveConfig} />
    <FlowList report={report} onSelectFlow={onSelectFlow} onOpenFlowStep={onOpenFlowStep} />
    <RepoMapList payload={payload} onOpenFile={onOpenFile} />
    <RiskList report={report} onSelectRisk={onSelectRisk} onOpenFile={onOpenFile} />
  </aside>;
}

function FlowList({ report, onSelectFlow, onOpenFlowStep }: {
  report: Report | null;
  onSelectFlow: (flow: CoreFlow) => void;
  onOpenFlowStep: (step: FlowStep) => void;
}) {
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Route size={16} />核心链路</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      {report?.flows?.map((flow, idx) => (
        <ActionItem key={flow.id || idx} className="rounded-lg p-3" onClick={() => { onSelectFlow(flow); const first = flow.steps?.[0]; if (first) onOpenFlowStep(first); }}>
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm">{flow.name}</div>
            <Badge variant={confidenceVariant(flow.confidence) as any}>{flow.confidence}</Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{flow.kind || 'unknown'}</span>
            <span>·</span>
            <span>{flow.steps?.length || 0} steps</span>
            <span>·</span>
            <span>{flow.priority}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{flow.trigger}</div>
        </ActionItem>
      ))}
      {!report?.flows?.length && <div className="text-xs text-muted-foreground">尚未识别核心链路。</div>}
    </CardContent>
  </Card>;
}

function RepoMapList({ payload, onOpenFile }: { payload: ProjectPayload | null; onOpenFile: (path: string) => void }) {
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><GitBranch size={16} />Repo Map</CardTitle></CardHeader>
    <CardContent className="space-y-2 text-xs">
      {payload?.scan?.repoMap?.importantFiles?.slice(0, 8).map((file) => (
        <ActionItem key={file.path} onClick={() => onOpenFile(file.path)}>
          <div className="truncate font-mono">{file.path}</div>
          <div className="text-[10px] text-muted-foreground">{file.priority} · score {file.importance} · {file.symbols.length} symbols</div>
        </ActionItem>
      ))}
    </CardContent>
  </Card>;
}

function RiskList({ report, onSelectRisk, onOpenFile }: {
  report: Report | null;
  onSelectRisk: (risk: RiskItem) => void;
  onOpenFile: (path: string, line?: number) => void;
}) {
  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert size={16} />风险雷达</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      {report?.risks?.map((risk, idx) => (
        <ActionItem key={idx} className="rounded-lg p-3" onClick={() => { onSelectRisk(risk); if (risk.path) onOpenFile(risk.path, risk.startLine); }}>
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-sm">{risk.title}</div>
            <Badge variant={riskVariant(risk.level) as any}>{risk.level}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{risk.reason}</div>
        </ActionItem>
      ))}
    </CardContent>
  </Card>;
}

function confidenceVariant(c?: string) {
  return c === 'fact' ? 'success' : c === 'guess' ? 'warning' : 'outline';
}

function riskVariant(level?: string) {
  return level === 'high' ? 'destructive' : level === 'medium' ? 'warning' : 'secondary';
}
