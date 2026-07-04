import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from './server.js';

async function createProject(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codemap-ai-server-'));
  for (const [relPath, content] of Object.entries(files)) {
    const absolute = path.join(root, relPath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, content, 'utf8');
  }
  return root;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.listener.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function getProject(server) {
  const response = await fetch(`http://127.0.0.1:${server.port}/api/project`);
  assert.equal(response.status, 200);
  return await response.json();
}

test('startServer keeps project cache inside each server instance', async () => {
  const firstRoot = await createProject({ 'first.md': 'first project' });
  const secondRoot = await createProject({ 'second.md': 'second project' });
  const firstServer = await startServer({ projectDir: firstRoot, port: 0, host: '127.0.0.1', serveWeb: false });
  const secondServer = await startServer({ projectDir: secondRoot, port: 0, host: '127.0.0.1', serveWeb: false });

  try {
    const first = await getProject(firstServer);
    const second = await getProject(secondServer);
    const firstPaths = first.scan.files.map((file) => file.path);
    const secondPaths = second.scan.files.map((file) => file.path);

    assert.deepEqual(firstPaths, ['first.md']);
    assert.deepEqual(secondPaths, ['second.md']);
    assert.equal(first.projectDir, firstRoot);
    assert.equal(second.projectDir, secondRoot);
  } finally {
    await closeServer(firstServer);
    await closeServer(secondServer);
  }
});
