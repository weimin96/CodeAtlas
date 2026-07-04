import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { scanProject } from './scanner.js';

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
