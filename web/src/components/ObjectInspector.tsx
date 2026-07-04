import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ObjectInspectorTab = 'overview' | 'explain' | 'why-connected' | 'warnings' | 'code';

export interface ObjectInspectorTabItem {
  id: ObjectInspectorTab;
  label?: string;
  content: ReactNode;
  disabled?: boolean;
}

export function ObjectInspector({
  objectType,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange
}: {
  objectType: 'module' | 'flow' | 'risk' | 'node' | 'symbol' | 'entity';
  title: string;
  subtitle?: string;
  tabs: ObjectInspectorTabItem[];
  activeTab: ObjectInspectorTab;
  onTabChange: (tab: ObjectInspectorTab) => void;
}) {
  const active = tabs.find((tab) => tab.id === activeTab && !tab.disabled) || tabs.find((tab) => !tab.disabled);
  return <Card>
    <CardHeader className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{title}</CardTitle>
          {subtitle && <div className="mt-1 truncate text-xs text-slate-500">{subtitle}</div>}
        </div>
        <Badge variant="outline">{objectType}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => <Button key={tab.id} type="button" size="sm" variant={active?.id === tab.id ? 'default' : 'outline'} disabled={tab.disabled} onClick={() => onTabChange(tab.id)}>{tab.label || tabLabel(tab.id)}</Button>)}
      </div>
    </CardHeader>
    <CardContent>{active?.content}</CardContent>
  </Card>;
}

function tabLabel(tab: ObjectInspectorTab) {
  return ({ overview: '概览', explain: '解释', 'why-connected': '为什么有关', warnings: '告警', code: '代码' })[tab];
}
