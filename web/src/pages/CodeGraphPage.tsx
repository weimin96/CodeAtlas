import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, FileCode2, GitFork, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, SectionTitle, StatCard } from '@/components/PageBlocks';
import type { CodeGraph, CodeGraphNode } from '@/types';

export function CodeGraphPage({ graph, loading, onLoadGraph, onOpenFile }: {
  graph: CodeGraph | null;
  loading: string;
  onLoadGraph: () => void;
  onOpenFile: (path: string, line?: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (!graph && loading !== 'code-graph') onLoadGraph();
  }, [graph, loading, onLoadGraph]);

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const selectedNode = nodes.find((node) => node.id === selectedId) || nodes[0] || null;
  const visibleNodes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const candidates = nodes.filter((node) => node.type !== 'directory');
    if (!keyword) return candidates.slice(0, 80);
    return candidates.filter((node) => `${node.name} ${node.path || ''}`.toLowerCase().includes(keyword)).slice(0, 80);
  }, [nodes, query]);
  const relatedEdges = selectedNode ? edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).slice(0, 80) : [];

  if (!graph) return <div className="space-y-4">
    <SectionTitle title="代码图谱" description="基于 JS/TS 静态扫描构建文件、符号、导入和调用关系。" />
    <EmptyState text={loading === 'code-graph' ? '代码图谱加载中' : '暂无代码图谱'} />
  </div>;

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-4">
      <SectionTitle title="代码图谱" description="用于检查导入关系、近似调用关系和解析告警。" />
      <Button variant="outline" size="sm" onClick={onLoadGraph} disabled={loading === 'code-graph'}>重新生成</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      <StatCard icon={<Boxes size={18} />} label="节点" value={graph.totals.nodes} hint="目录、文件、符号" />
      <StatCard icon={<GitFork size={18} />} label="关系" value={graph.totals.edges} hint="contains / defines / imports / calls" tone="purple" />
      <StatCard icon={<FileCode2 size={18} />} label="JS/TS 文件" value={graph.totals.files} hint={graph.languageScope.join(' / ')} tone="green" />
      <StatCard icon={<AlertTriangle size={18} />} label="解析告警" value={graph.totals.warnings} hint="未解析导入或调用" tone={graph.totals.warnings ? 'amber' : 'slate'} />
    </div>

    <div className="grid gap-4 lg:grid-cols-[420px,1fr]">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">节点搜索</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="搜索文件或符号" />
          </div>
        </CardHeader>
        <CardContent className="max-h-[560px] space-y-2 overflow-auto">
          {visibleNodes.map((node) => <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`w-full rounded-lg border p-3 text-left ${selectedNode?.id === node.id ? 'border-blue-200 bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-slate-950">{node.name}</span>
              <NodeBadge node={node} />
            </div>
            {node.path && <div className="mt-1 truncate font-mono text-xs text-slate-500">{node.path}{node.startLine ? `:${node.startLine}` : ''}</div>}
          </button>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">关系视图</CardTitle></CardHeader>
        <CardContent>
          {!selectedNode && <EmptyState text="选择左侧节点查看关系" />}
          {selectedNode && <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="text-base font-semibold text-slate-950">{selectedNode.name}</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{selectedNode.id}</div>
              {selectedNode.path && <Button className="mt-3" variant="outline" size="sm" onClick={() => onOpenFile(selectedNode.path || '', selectedNode.startLine)}>打开代码</Button>}
            </div>
            <div className="space-y-2">
              {relatedEdges.map((edge) => <GraphEdgeRow key={`${edge.source}-${edge.target}-${edge.type}-${edge.line || ''}`} edge={edge} nodes={nodes} selectedId={selectedNode.id} />)}
              {!relatedEdges.length && <EmptyState text="该节点暂无直接关系" />}
            </div>
          </div>}
        </CardContent>
      </Card>
    </div>
  </div>;
}

function NodeBadge({ node }: { node: CodeGraphNode }) {
  const variant = node.type === 'file' ? 'secondary' : node.type === 'directory' ? 'outline' : 'default';
  return <Badge variant={variant}>{node.type}</Badge>;
}

function GraphEdgeRow({ edge, nodes, selectedId }: { edge: CodeGraph['edges'][number]; nodes: CodeGraphNode[]; selectedId: string }) {
  const isOutgoing = edge.source === selectedId;
  const other = nodes.find((node) => node.id === (isOutgoing ? edge.target : edge.source));
  return <div className="flex items-start gap-3 rounded-lg border p-3">
    <Badge variant={edge.type === 'calls' ? 'default' : 'outline'}>{edge.type}</Badge>
    <div className="min-w-0 flex-1">
      <div className="text-sm text-slate-700">{isOutgoing ? '指向' : '来自'} <span className="font-semibold text-slate-950">{other?.name || (isOutgoing ? edge.target : edge.source)}</span></div>
      {other?.path && <div className="mt-1 truncate font-mono text-xs text-slate-500">{other.path}{edge.line ? `:${edge.line}` : ''}</div>}
    </div>
  </div>;
}
