import { useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import { AskPanel } from '@/components/AskPanel';
import { CodeWorkspace } from '@/components/CodeWorkspace';
import { ProjectSidebar } from '@/components/ProjectSidebar';
import { WorkbenchHeader } from '@/components/WorkbenchHeader';
import { useWorkbenchData } from '@/hooks/useWorkbenchData';
import type { FlowStep, SymbolInfo } from '@/types';

export default function App() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const workbench = useWorkbenchData();

  const editorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorSelection((event) => {
      const startLine = event.selection.startLineNumber;
      const endLine = event.selection.endLineNumber;
      workbench.setSelection({ startLine: Math.min(startLine, endLine), endLine: Math.max(startLine, endLine) });
    });
  };

  function exportContextPack() {
    window.location.href = '/api/context-pack?format=markdown';
  }

  function exportRepoMap() {
    window.location.href = '/api/repo-map?download=1';
  }

  function openFlowStep(step: FlowStep) {
    if (!step.path) return;
    void workbench.openFile(step.path, step.startLine);
  }

  function openSymbol(symbol: SymbolInfo) {
    workbench.setCurrentSymbol(symbol);
    workbench.setSelection({ startLine: symbol.startLine, endLine: symbol.endLine });
    editorRef.current?.revealLineInCenter(symbol.startLine);
    editorRef.current?.setPosition({ lineNumber: symbol.startLine, column: 1 });
    editorRef.current?.setSelection({
      startLineNumber: symbol.startLine,
      startColumn: 1,
      endLineNumber: symbol.endLine,
      endColumn: 1
    });
    editorRef.current?.focus();
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <WorkbenchHeader
        projectDir={workbench.payload?.projectDir}
        totalFiles={workbench.payload?.scan?.totalFiles || 0}
        totalSymbols={workbench.payload?.scan?.totalSymbols || 0}
        mappedFiles={workbench.payload?.scan?.repoMap?.importantFiles?.length || 0}
        loading={workbench.loading}
        onExportRepoMap={exportRepoMap}
        onRescan={workbench.rescan}
        onAnalyze={workbench.analyze}
      />

      <div className="grid flex-1 min-h-0 grid-cols-[360px_minmax(520px,1fr)_420px] gap-0">
        <ProjectSidebar
          payload={workbench.payload}
          report={workbench.report}
          config={workbench.config}
          loading={workbench.loading}
          onConfigChange={workbench.setConfig}
          onSaveConfig={workbench.saveConfig}
          onSelectFlow={workbench.setActiveFlow}
          onOpenFlowStep={openFlowStep}
          onOpenFile={workbench.openFile}
          onSelectRisk={workbench.setActiveRisk}
        />
        <CodeWorkspace
          report={workbench.report}
          activeFlow={workbench.activeFlow}
          currentFile={workbench.currentFile}
          currentSymbol={workbench.currentSymbol}
          selection={workbench.selection}
          search={workbench.search}
          results={workbench.results}
          files={workbench.files}
          currentFileSymbols={workbench.currentFileSymbols}
          onSearch={workbench.runSearch}
          onOpenFile={workbench.openFile}
          onOpenStep={openFlowStep}
          onOpenSymbol={openSymbol}
          onEditorMount={editorMount}
        />
        <AskPanel
          report={workbench.report}
          currentFile={workbench.currentFile}
          currentSymbol={workbench.currentSymbol}
          activeFlow={workbench.activeFlow}
          activeRisk={workbench.activeRisk}
          selection={workbench.selection}
          question={workbench.question}
          answer={workbench.answer}
          loading={workbench.loading}
          onQuestionChange={workbench.setQuestion}
          onAsk={workbench.ask}
          onExportContextPack={exportContextPack}
          onOpenFile={workbench.openFile}
        />
      </div>
    </div>
  );
}
