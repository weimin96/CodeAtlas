export type Confidence = 'fact' | 'guess' | 'unknown';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface ScanFile {
  path: string;
  type: 'file';
  role: string;
  priority: Priority;
  language: string;
  text: boolean;
  size: number;
}

export interface Report {
  generatedBy: 'ai' | 'heuristic' | string;
  projectOverview: {
    name?: string;
    type?: string;
    techStack?: string[];
    startup?: string;
    confidence?: Confidence;
    summary?: string;
  };
  entrypoints: Array<{ name: string; path: string; kind: string; confidence: Confidence; evidence?: string }>;
  modules: Array<{ name: string; paths: string[]; responsibility: string; priority: Priority; confidence: Confidence; evidence?: string }>;
  flows: Array<{
    name: string;
    trigger: string;
    priority: Priority;
    confidence: Confidence;
    steps: Array<{ order: number; path: string; symbol?: string; startLine?: number; endLine?: number; description: string; confidence?: Confidence }>;
    dataReads?: string[];
    dataWrites?: string[];
    externalCalls?: string[];
    breakpoints?: string[];
    notes?: string[];
  }>;
  risks: Array<{ title: string; level: 'high' | 'medium' | 'low'; path?: string; startLine?: number; endLine?: number; reason: string; verify: string }>;
  readingPlan: Array<{ timebox: string; goal: string; files: string[]; output: string }>;
  unknowns: string[];
  mermaid?: string;
}
