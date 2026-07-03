import path from 'node:path';

const MAX_FLOWS = 5;

export function buildCoreFlows(scan) {
  const files = (scan.files || []).filter((file) => file.text);
  const flows = [
    buildCliStartupFlow(files),
    buildApiRequestFlow(files),
    buildAiAnalysisFlow(files),
    buildAskFlow(files),
    buildFrontendFlow(files),
    buildAsyncWorkerFlow(files)
  ].filter(Boolean);

  const unique = [];
  const seen = new Set();
  for (const flow of flows) {
    const key = flow.steps.map((step) => step.path).join('>');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(flow);
  }

  return unique.slice(0, MAX_FLOWS);
}

export function buildFlowsMermaid(flows) {
  if (!flows?.length) return 'flowchart TD\n  A[触发] --> B[待识别入口]';
  const lines = ['flowchart TD', '  START[用户或系统触发]'];
  flows.forEach((flow, index) => {
    const flowId = `F${index + 1}`;
    lines.push(`  START --> ${flowId}["${escapeMermaid(flow.name)}"]`);
    const firstStep = flow.steps?.[0];
    if (firstStep?.path) lines.push(`  ${flowId} --> ${flowId}S1["${escapeMermaid(firstStep.path)}"]`);
  });
  return lines.join('\n');
}

function buildCliStartupFlow(files) {
  const cli = pickFile(files, [
    (file) => /^bin\//.test(file.path.toLowerCase()),
    (file) => /(^|\/)(cli|main|index|pfo)\.(js|ts|mjs|cjs)$/.test(file.path.toLowerCase())
  ]);
  if (!cli) return null;

  const server = pickFile(files, [(file) => /server\/(server|app|index)\.(js|ts|mjs|cjs)$/.test(file.path.toLowerCase())]);
  const config = pickFile(files, [(file) => /config-store|config\.(js|ts|json)$|package\.json/.test(file.path.toLowerCase())]);
  const scanner = pickFile(files, [(file) => /scanner\.(js|ts)$/.test(file.path.toLowerCase())]);

  return makeFlow({
    id: 'cli-startup',
    kind: 'cli',
    name: 'CLI 启动链路',
    trigger: '用户在命令行执行项目 CLI',
    priority: 'P0',
    steps: [
      step(cli, pickSymbol(cli, ['program', 'parse', 'pfo']), '解析命令行参数并确定项目目录'),
      step(config, pickSymbol(config, ['readConfig', 'resolveConfig']), '读取配置和模型参数'),
      step(server, pickSymbol(server, ['startServer', 'createServer']), '启动本地 Web 服务'),
      step(scanner, pickSymbol(scanner, ['scanProject']), '首次访问项目接口时扫描代码库')
    ],
    dataReads: ['package.json / pfo.config.json / 环境变量'],
    dataWrites: ['本地配置文件可能由配置接口写入'],
    externalCalls: [],
    notes: ['启动后实际扫描通常由浏览器请求触发。']
  });
}

function buildApiRequestFlow(files) {
  const route = pickFile(files, [
    (file) => /server\/(server|app|index)\.(js|ts|mjs|cjs)$/.test(file.path.toLowerCase()),
    (file) => /(^|\/)(routes?|api|controllers?|handlers?)\//.test(file.path.toLowerCase())
  ]);
  if (!route) return null;

  const scanner = pickFile(files, [(file) => /scanner\.(js|ts)$/.test(file.path.toLowerCase())]);
  const repoMap = pickFile(files, [(file) => /repo-map\.(js|ts)$/.test(file.path.toLowerCase())]);
  const contextPack = pickFile(files, [(file) => /context-pack\.(js|ts)$/.test(file.path.toLowerCase())]);

  return makeFlow({
    id: 'project-api',
    kind: 'api',
    name: '项目扫描 API 链路',
    trigger: '浏览器请求 /api/project 或 /api/rescan',
    priority: 'P0',
    steps: [
      step(route, pickSymbol(route, ['startServer']), 'Express 路由接收项目扫描请求'),
      step(scanner, pickSymbol(scanner, ['scanProject']), '遍历项目文件并提取符号'),
      step(repoMap, pickSymbol(repoMap, ['buildRepoMap']), '根据优先级和符号构建 Repo Map'),
      step(contextPack, pickSymbol(contextPack, ['buildContextPack']), '后续分析时按预算选择上下文文件')
    ],
    dataReads: ['项目目录文件树', '.gitignore', 'pfo.ignore'],
    dataWrites: ['服务进程内存缓存 cache.scan / cache.report'],
    externalCalls: [],
    notes: ['该链路描述扫描与缓存路径，不代表 AI 分析已执行。']
  });
}

function buildAiAnalysisFlow(files) {
  const server = pickFile(files, [(file) => /server\/(server|app|index)\.(js|ts|mjs|cjs)$/.test(file.path.toLowerCase())]);
  const contextPack = pickFile(files, [(file) => /context-pack\.(js|ts)$/.test(file.path.toLowerCase())]);
  const ai = pickFile(files, [(file) => /(^|\/)ai\.(js|ts)$/.test(file.path.toLowerCase())]);
  if (!server || !ai) return null;

  return makeFlow({
    id: 'ai-analysis',
    kind: 'api',
    name: 'AI 分析链路',
    trigger: '用户点击“开始 AI 分析”并请求 /api/analyze',
    priority: 'P0',
    steps: [
      step(server, pickSymbol(server, ['startServer']), '分析接口合并配置并准备上下文'),
      step(contextPack, pickSymbol(contextPack, ['buildContextPack']), '生成 Context Pack 和本次使用文件清单'),
      step(ai, pickSymbol(ai, ['analyzeWithAI']), '调用模型生成项目地图、链路和风险'),
      step(server, pickSymbol(server, ['normalizeReport']), '规范化 AI 返回结构并写入报告缓存')
    ],
    dataReads: ['Repo Map', 'Context Pack 选中文件', 'AI 配置'],
    dataWrites: ['cache.contextPack', 'cache.report'],
    externalCalls: ['AI Provider API / Ollama 本地接口'],
    notes: ['AI 输出必须是 JSON，失败时由接口错误路径返回。']
  });
}

function buildAskFlow(files) {
  const server = pickFile(files, [(file) => /server\/(server|app|index)\.(js|ts|mjs|cjs)$/.test(file.path.toLowerCase())]);
  const ai = pickFile(files, [(file) => /(^|\/)ai\.(js|ts)$/.test(file.path.toLowerCase())]);
  if (!server || !ai) return null;

  return makeFlow({
    id: 'context-ask',
    kind: 'api',
    name: '上下文追问链路',
    trigger: '用户围绕当前文件、选区、符号、链路或风险提交追问',
    priority: 'P1',
    steps: [
      step(server, pickSymbol(server, ['startServer']), '追问接口校验问题并合并配置'),
      step(server, pickSymbol(server, ['enrichContext']), '读取当前文件、选区和符号代码片段'),
      step(ai, pickSymbol(ai, ['askWithAI']), '调用模型生成绑定上下文的回答')
    ],
    dataReads: ['当前文件内容', '选中行', '当前符号', '当前链路', '当前风险'],
    dataWrites: [],
    externalCalls: ['AI Provider API / Ollama 本地接口'],
    notes: ['证据不足时回答应明确不确定并给出下一步查看文件。']
  });
}

function buildFrontendFlow(files) {
  const main = pickFile(files, [(file) => /web\/src\/main\.(tsx|ts|jsx|js)$/.test(file.path.toLowerCase())]);
  const app = pickFile(files, [(file) => /web\/src\/app\.(tsx|ts|jsx|js)$/.test(file.path.toLowerCase())]);
  if (!main && !app) return null;

  const mermaid = pickFile(files, [(file) => /mermaid.*\.(tsx|ts|jsx|js)$/.test(file.path.toLowerCase())]);
  const types = pickFile(files, [(file) => /web\/src\/types\.ts$/.test(file.path.toLowerCase())]);

  return makeFlow({
    id: 'frontend-entry',
    kind: 'page',
    name: '前端工作台入口链路',
    trigger: '浏览器打开本地工作台页面',
    priority: 'P1',
    steps: [
      step(main, pickSymbol(main, ['main']), '挂载 React 应用'),
      step(app, pickSymbol(app, ['App']), '加载项目数据并组织三栏工作台'),
      step(mermaid, pickSymbol(mermaid, ['MermaidPanel']), '渲染项目图或链路图'),
      step(types, pickSymbol(types, ['Report']), '约束前后端报告数据结构')
    ],
    dataReads: ['/api/project', '/api/file', '/api/analyze', '/api/ask'],
    dataWrites: ['React 组件状态：payload、report、currentFile、activeFlow'],
    externalCalls: [],
    notes: ['前端只读取本地服务接口，不直接访问用户项目文件系统。']
  });
}

function buildAsyncWorkerFlow(files) {
  const worker = pickFile(files, [
    (file) => /(^|\/)(jobs?|workers?|queue|consumers?)\//.test(file.path.toLowerCase()),
    (file) => /(^|\/)(worker|job|consumer|queue)\.(js|ts|py|go|java)$/.test(file.path.toLowerCase())
  ]);
  if (!worker) return null;

  const service = pickFile(files, [(file) => /services?|usecases?|domain/.test(file.path.toLowerCase())]);
  const data = pickFile(files, [(file) => /repositories?|dao|models?|schema|database|db|prisma/.test(file.path.toLowerCase())]);

  return makeFlow({
    id: 'async-worker',
    kind: 'worker',
    name: '异步任务链路',
    trigger: '定时任务、队列消息或后台 worker 触发',
    priority: 'P1',
    steps: [
      step(worker, pickSymbol(worker, ['handler', 'worker', 'job', 'consumer', 'process']), '任务入口接收调度或消息'),
      step(service, pickSymbol(service), '执行业务处理'),
      step(data, pickSymbol(data), '读取或写入持久化数据')
    ],
    dataReads: ['任务参数 / 队列消息', data?.path].filter(Boolean),
    dataWrites: [data?.path].filter(Boolean),
    externalCalls: [],
    notes: ['需结合运行配置确认调度来源和重试策略。']
  });
}

function makeFlow({ id, kind, name, trigger, priority, steps, dataReads, dataWrites, externalCalls, notes }) {
  const normalizedSteps = steps
    .filter((item) => item?.path)
    .map((item, index) => ({ ...item, order: index + 1, confidence: item.confidence || 'guess' }));
  const breakpoints = normalizedSteps
    .filter((item) => item.path)
    .map((item) => item.symbol ? `${item.path}:${item.symbol}` : item.startLine ? `${item.path}:L${item.startLine}` : item.path);

  return {
    id,
    kind,
    name,
    trigger,
    priority,
    confidence: 'guess',
    steps: normalizedSteps,
    dataReads: dataReads || [],
    dataWrites: dataWrites || [],
    externalCalls: externalCalls || [],
    breakpoints,
    notes: notes || [],
    unknowns: ['启发式链路需要通过代码跳转、断点或运行日志验证。'],
    mermaid: buildFlowchart(name, normalizedSteps),
    sequenceDiagram: buildSequenceDiagram(name, normalizedSteps)
  };
}

function step(file, symbol, description) {
  if (!file) return null;
  return {
    path: file.path,
    symbol: symbol?.name || '',
    startLine: symbol?.startLine,
    endLine: symbol?.endLine,
    description,
    confidence: 'guess'
  };
}

function pickFile(files, predicates) {
  for (const predicate of predicates) {
    const matched = files
      .filter(predicate)
      .sort((a, b) => scoreFlowFile(b) - scoreFlowFile(a) || a.path.localeCompare(b.path))[0];
    if (matched) return matched;
  }
  return null;
}

function scoreFlowFile(file) {
  let score = 0;
  if (file.priority === 'P0') score += 100;
  if (file.priority === 'P1') score += 70;
  if (file.priority === 'P2') score += 30;
  score += Math.min((file.symbols?.length || 0) * 4, 40);
  if (file.size < 100_000) score += 10;
  if (/test|spec|mock|fixture/.test(file.path.toLowerCase())) score -= 50;
  return score;
}

function pickSymbol(file, preferredNames = []) {
  const symbols = file?.symbols || [];
  if (!symbols.length) return null;
  const preferred = preferredNames
    .map((name) => symbols.find((symbol) => symbol.name.toLowerCase().includes(name.toLowerCase())))
    .find(Boolean);
  if (preferred) return preferred;
  return symbols.find((symbol) => ['function', 'method', 'class'].includes(symbol.kind)) || symbols[0];
}

function buildFlowchart(name, steps) {
  if (!steps.length) return `flowchart TD\n  A["${escapeMermaid(name)}"]`;
  const lines = ['flowchart TD'];
  steps.forEach((item, index) => {
    const id = `S${index + 1}`;
    const label = item.symbol ? `${item.symbol}\\n${item.path}` : item.path;
    lines.push(`  ${id}["${escapeMermaid(label)}"]`);
    if (index > 0) lines.push(`  S${index} --> ${id}`);
  });
  return lines.join('\n');
}

function buildSequenceDiagram(name, steps) {
  if (steps.length < 2) return '';
  const lines = ['sequenceDiagram', `  title ${escapeMermaid(name)}`];
  steps.forEach((item, index) => {
    const current = participantName(index);
    lines.push(`  participant ${current} as ${escapeMermaid(shortPath(item.path))}`);
  });
  for (let index = 0; index < steps.length - 1; index += 1) {
    lines.push(`  ${participantName(index)}->>${participantName(index + 1)}: ${escapeMermaid(steps[index + 1].description)}`);
  }
  return lines.join('\n');
}

function participantName(index) {
  return `P${index + 1}`;
}

function shortPath(filePath) {
  const parts = filePath.split('/');
  if (parts.length <= 2) return filePath;
  return path.posix.join(parts[parts.length - 2], parts[parts.length - 1]);
}

function escapeMermaid(text) {
  return String(text)
    .replace(/\\/g, '/')
    .replace(/"/g, "'")
    .replace(/[<>]/g, '')
    .slice(0, 96);
}
