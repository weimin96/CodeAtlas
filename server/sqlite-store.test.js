import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProjectDatabaseSnapshot,
  readExplainCache,
  recordAskThread,
  recordCodeGraph,
  recordExplainCache,
  recordReport,
  recordScanRun,
  recordVerification
} from './sqlite-store.js';

test('sqlite mirror stores scan, report, ask, verification and graph records when node:sqlite is available', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codemap-ai-sqlite-'));
  process.env.CODEMAP_AI_SQLITE_PATH = path.join(root, 'codemap-ai.db');
  const projectDir = path.join(root, 'project');
  await fs.mkdir(projectDir);

  await recordScanRun(projectDir, { totalFiles: 2, totalSymbols: 3, files: [] });
  await recordReport(projectDir, { projectOverview: { name: 'Fixture' } });
  await recordAskThread(projectDir, { question: '为什么？', context: { currentFile: { path: 'a.ts' } }, answer: { conclusion: '因为 a.ts' } });
  await recordVerification(projectDir, { kind: 'module', id: 'm1', verificationStatus: 'verified' });
  await recordCodeGraph(projectDir, { generatedAt: '2026-07-04T00:00:00.000Z', nodes: [{ id: 'a' }], edges: [], warnings: [] });
  await recordExplainCache(projectDir, { scopeKey: 'node:a', payload: { explanation: '缓存解释' } });

  const cached = await readExplainCache(projectDir, 'node:a');
  const snapshot = await getProjectDatabaseSnapshot(projectDir);

  assert.equal(cached.explanation, '缓存解释');
  assert.equal(snapshot.scanRuns, 1);
  assert.equal(snapshot.reports, 1);
  assert.equal(snapshot.askThreads, 1);
  assert.equal(snapshot.verificationEvents, 1);
  assert.equal(snapshot.codeGraphs, 1);
});
