import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import { scanProject } from './scanner.js';

const execFileAsync = promisify(execFile);

async function createProject(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codemap-ai-scan-'));
  for (const [relPath, content] of Object.entries(files)) {
    const absolute = path.join(root, relPath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content, 'utf8');
  }
  return root;
}

test('scanProject honors gitignore negation inside ignored directories', async () => {
  const root = await createProject({
    '.gitignore': 'dist/\n!dist/keep.js\n',
    'dist/ignored.js': 'export const ignored = true;\n',
    'dist/keep.js': 'export const keep = true;\n'
  });

  const scan = await scanProject(root);
  const paths = scan.files.map((file) => file.path);

  assert.ok(paths.includes('dist/keep.js'));
  assert.equal(paths.includes('dist/ignored.js'), false);
});

test('scanProject supports maxFiles limit', async () => {
  const root = await createProject({
    'a.ts': 'export const a = 1;\n',
    'b.ts': 'export const b = 1;\n',
    'c.ts': 'export const c = 1;\n'
  });
  const scan = await scanProject(root, { maxFiles: 2 });
  assert.equal(scan.totalFiles, 2);
  assert.ok(scan.skippedFiles.some((file) => file.reason === 'maxFiles'));
});

test('scanProject reuses persistent symbol cache entries', async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codemap-ai-symbol-cache-'));
  const previousCacheDir = process.env.CODEMAP_AI_CACHE_DIR;
  process.env.CODEMAP_AI_CACHE_DIR = cacheDir;
  const root = await createProject({
    'src/app.ts': 'export function start() { return true; }\n'
  });

  try {
    const first = await scanProject(root, { useGit: false });
    const second = await scanProject(root, { useGit: false });

    assert.equal(first.cacheStats.symbolCacheMisses, 1);
    assert.equal(second.cacheStats.symbolCacheHits, 1);
    assert.equal(second.symbols[0].name, 'start');
  } finally {
    if (previousCacheDir === undefined) delete process.env.CODEMAP_AI_CACHE_DIR;
    else process.env.CODEMAP_AI_CACHE_DIR = previousCacheDir;
  }
});

test('scanProject prefers git file candidates when available', async (t) => {
  try {
    await execFileAsync('git', ['--version']);
  } catch (_error) {
    t.skip('git is not available');
    return;
  }
  const root = await createProject({
    '.gitignore': 'ignored.ts\n',
    'tracked.ts': 'export const tracked = true;\n',
    'untracked.ts': 'export const untracked = true;\n',
    'ignored.ts': 'export const ignored = true;\n'
  });
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['add', '.gitignore', 'tracked.ts'], { cwd: root });

  const scan = await scanProject(root);
  const paths = scan.files.map((file) => file.path).sort();

  assert.deepEqual(paths, ['.gitignore', 'tracked.ts', 'untracked.ts']);
});

test('scanProject skips git tracked symlinks', async (t) => {
  try {
    await execFileAsync('git', ['--version']);
  } catch (_error) {
    t.skip('git is not available');
    return;
  }

  const externalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codemap-ai-external-'));
  const externalFile = path.join(externalDir, 'outside.ts');
  await fs.writeFile(externalFile, 'export const outside = true;\n', 'utf8');
  const root = await createProject({
    'src/app.ts': 'export const app = true;\n'
  });
  const linkPath = path.join(root, 'external-link.ts');
  try {
    await fs.symlink(externalFile, linkPath, 'file');
  } catch (_error) {
    t.skip('symlink is not available');
    return;
  }
  await execFileAsync('git', ['init'], { cwd: root });
  await execFileAsync('git', ['config', 'core.symlinks', 'true'], { cwd: root });
  await execFileAsync('git', ['add', 'src/app.ts', 'external-link.ts'], { cwd: root });
  const { stdout } = await execFileAsync('git', ['ls-files', '-s', 'external-link.ts'], { cwd: root });
  if (!stdout.startsWith('120000 ')) {
    t.skip('git symlink tracking is not available');
    return;
  }

  const scan = await scanProject(root, { useGit: true });

  assert.equal(scan.files.some((file) => file.path === 'external-link.ts'), false);
  assert.ok(scan.skippedFiles.some((file) => file.path === 'external-link.ts' && file.reason === 'symlink'));
});
