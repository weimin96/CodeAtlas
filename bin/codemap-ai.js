#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import open from 'open';
import { startServer } from '../server/server.js';
import { scanProject } from '../server/scanner.js';
import { buildCodeGraph } from '../server/code-graph.js';
import { buildContextPack } from '../server/context-pack.js';
import { createAccessToken, isLoopbackHost, parsePort, requireNetworkFlag } from './cli-options.js';

if (process.argv[2] === 'pack') {
  await runPack(process.argv.slice(3));
  process.exit(0);
}

const program = new Command();

program
  .name('codemap-ai')
  .description('Start codemap-ai workbench for a local project folder')
  .argument('[projectDir]', 'project folder to inspect', '.')
  .option('-p, --port <port>', 'port to listen on', '3000')
  .option('--host <host>', 'host to bind', '127.0.0.1')
  .option('--allow-network', 'allow binding to a non-loopback host')
  .option('--no-open', 'do not open browser')
  .parse(process.argv);

const opts = program.opts();
const projectDir = path.resolve(program.args[0] || '.');
let port;
let accessToken = '';
try {
  port = parsePort(opts.port);
  requireNetworkFlag(opts.host, Boolean(opts.allowNetwork));
  accessToken = isLoopbackHost(opts.host) ? '' : createAccessToken();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

try {
  const server = await startServer({ projectDir, port, host: opts.host, accessToken });
  const url = `http://${opts.host}:${server.port}${accessToken ? `?token=${accessToken}` : ''}`;
  console.log(`\ncodemap-ai is running.`);
  console.log(`Project: ${projectDir}`);
  if (accessToken) console.warn('Network access is enabled. Keep the URL token private.');
  console.log(`URL:     ${url}\n`);
  if (opts.open !== false) await open(url);
} catch (error) {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
}

async function runPack(argv) {
  const packProgram = new Command();
  packProgram
    .name('codemap-ai pack')
    .description('Build an AI-friendly context pack without starting the web UI')
    .argument('[projectDir]', 'project folder to inspect', '.')
    .option('--format <format>', 'output format: markdown or json', 'markdown')
    .option('--max-chars <chars>', 'maximum context characters', '120000')
    .option('-o, --output <file>', 'write output to a file instead of stdout')
    .parse(argv, { from: 'user' });

  const opts = packProgram.opts();
  const format = String(opts.format || 'markdown').toLowerCase();
  if (!['markdown', 'json'].includes(format)) throw new Error('Invalid pack --format value.');
  const maxChars = Number(opts.maxChars);
  if (!Number.isFinite(maxChars) || maxChars <= 0) throw new Error('Invalid pack --max-chars value.');

  const projectDir = path.resolve(packProgram.args[0] || '.');
  const scan = await scanProject(projectDir);
  const codeGraph = await buildCodeGraph({ root: projectDir, scan });
  const contextPack = await buildContextPack({ root: projectDir, scan, codeGraph, maxChars });
  const output = format === 'json'
    ? JSON.stringify(buildPackJson({ projectDir, scan, codeGraph, contextPack }), null, 2)
    : contextPack.markdown;

  if (opts.output) {
    await fs.mkdir(path.dirname(path.resolve(opts.output)), { recursive: true });
    await fs.writeFile(path.resolve(opts.output), output, 'utf8');
    return;
  }
  process.stdout.write(output);
  if (!output.endsWith('\n')) process.stdout.write('\n');
}

function buildPackJson({ projectDir, scan, codeGraph, contextPack }) {
  return {
    projectDir,
    generatedAt: contextPack.generatedAt,
    scan: {
      totalFiles: scan.totalFiles,
      totalDirs: scan.totalDirs,
      totalSymbols: scan.totalSymbols,
      skippedFiles: scan.skippedFiles || [],
      summary: scan.summary,
      repoMap: scan.repoMap
    },
    codeGraph: {
      totals: codeGraph.totals,
      warnings: codeGraph.warnings
    },
    contextPack: {
      mode: contextPack.mode,
      target: contextPack.target,
      budget: contextPack.budget,
      files: contextPack.files,
      skippedFiles: contextPack.skippedFiles || [],
      chunks: contextPack.chunks,
      graphContext: {
        relatedPaths: contextPack.graphContext?.relatedPaths || [],
        warnings: contextPack.graphContext?.warnings || []
      }
    }
  };
}
