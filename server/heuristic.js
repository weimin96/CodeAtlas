import path from 'node:path';

export function buildHeuristicReport(scan) {
  const stack = scan.summary.stack;
  const entrypoints = scan.keyFiles
    .filter((f) => /入口|配置|README/.test(f.role) || f.priority === 'P0')
    .slice(0, 18)
    .map((f) => ({
      name: path.basename(f.path),
      path: f.path,
      kind: f.role,
      confidence: 'guess',
      evidence: `根据路径和文件名识别：${f.path}`
    }));

  const modules = inferModules(scan.files);
  const flows = buildFlows(entrypoints, modules);
  const mermaid = buildMermaid(entrypoints, modules);

  return {
    generatedBy: 'heuristic',
    projectOverview: {
      name: path.basename(scan.root),
      type: stack.length ? stack.join(' + ') : '未知项目类型',
      techStack: stack,
      startup: inferStartup(scan.files),
      confidence: stack.length ? 'guess' : 'unknown',
      summary: '这是基于目录、配置文件和关键路径的快速预览。配置 AI 后可生成更可靠的项目地图、链路剧本和风险清单。'
    },
    entrypoints,
    modules,
    flows,
    risks: [
      {
        title: 'AI 尚未分析代码语义',
        level: 'medium',
        path: scan.keyFiles[0]?.path || '',
        reason: '当前报告只基于启发式扫描，无法确认实际调用链和业务状态流转。',
        verify: '配置 AI 后执行“开始分析”，再点击核心链路逐条验证。'
      }
    ],
    readingPlan: [
      { timebox: '0-10 分钟', goal: '确认项目类型和启动方式', files: scan.keyFiles.slice(0, 4).map((f) => f.path), output: '知道项目怎么跑' },
      { timebox: '10-25 分钟', goal: '确认入口和路由', files: entrypoints.slice(0, 6).map((f) => f.path), output: '入口地图' },
      { timebox: '25-45 分钟', goal: '查看业务层和数据层', files: scan.keyFiles.filter((f) => /业务|数据/.test(f.role)).slice(0, 8).map((f) => f.path), output: '核心链路候选' }
    ],
    unknowns: ['真实业务目标需要 README、接口、页面或领域模型确认。', '核心调用链需要 AI 分析或人工断点验证。', '风险点需要结合运行路径和测试确认。'],
    mermaid
  };
}

function inferStartup(files) {
  const paths = new Set(files.map((f) => f.path));
  if (paths.has('package.json')) return '查看 package.json 的 scripts。';
  if (paths.has('docker-compose.yml') || paths.has('docker-compose.yaml')) return '可能通过 docker compose 启动。';
  if (paths.has('go.mod')) return '可能通过 go run ./... 或项目 main 包启动。';
  if (paths.has('pyproject.toml') || paths.has('requirements.txt')) return '可能通过 Python 入口或框架命令启动。';
  return '未识别，需要查看 README 或入口文件。';
}

function inferModules(files) {
  const buckets = new Map();
  for (const file of files) {
    const parts = file.path.split('/');
    const key = parts.length > 1 ? parts.slice(0, Math.min(parts.length - 1, 2)).join('/') : '.';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(file);
  }
  return [...buckets.entries()]
    .map(([name, fs]) => ({
      name,
      paths: [name],
      responsibility: guessResponsibility(name, fs),
      priority: fs.some((f) => f.priority === 'P0') ? 'P0' : fs.some((f) => f.priority === 'P1') ? 'P1' : 'P3',
      confidence: 'guess',
      evidence: `${fs.length} 个文件，典型文件：${fs.slice(0, 3).map((f) => f.path).join(', ')}`
    }))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 18);
}

function priorityRank(p) {
  return ({ P0: 0, P1: 1, P2: 2, P3: 3 })[p] ?? 9;
}

function guessResponsibility(name, files) {
  const p = name.toLowerCase();
  const roles = [...new Set(files.map((f) => f.role))].slice(0, 3).join('、');
  if (/api|routes|controllers|handlers/.test(p)) return '请求入口、路由或控制器。';
  if (/services?|usecases?|domain/.test(p)) return '核心业务逻辑。';
  if (/models?|schema|db|database|prisma|repositories?/.test(p)) return '数据模型或持久化访问。';
  if (/components?|pages?|views?/.test(p)) return '前端页面或组件。';
  if (/jobs?|workers?|queue/.test(p)) return '异步任务或队列处理。';
  return roles || '待确认职责。';
}

function buildFlows(entrypoints, modules) {
  const primaryEntry = entrypoints.find((e) => /入口|路由|api|routes/i.test(e.kind + e.path)) || entrypoints[0];
  const serviceModule = modules.find((m) => /业务|service|usecase|domain/i.test(m.responsibility + m.name));
  const dataModule = modules.find((m) => /数据|db|model|schema|repository|prisma/i.test(m.responsibility + m.name));
  const steps = [];
  if (primaryEntry) steps.push({ order: 1, path: primaryEntry.path, symbol: '', description: '候选请求/系统入口', confidence: 'guess' });
  if (serviceModule) steps.push({ order: 2, path: serviceModule.paths[0], symbol: '', description: '候选业务处理层', confidence: 'guess' });
  if (dataModule) steps.push({ order: 3, path: dataModule.paths[0], symbol: '', description: '候选数据读写层', confidence: 'guess' });
  return [{
    name: '候选主流程',
    trigger: '用户请求 / 页面操作 / 系统任务',
    priority: 'P0',
    confidence: 'guess',
    steps,
    dataReads: [],
    dataWrites: [],
    externalCalls: [],
    breakpoints: steps.map((s) => s.path).filter(Boolean),
    notes: ['需要 AI 或断点验证真实调用顺序。']
  }];
}

function buildMermaid(entrypoints, modules) {
  const lines = ['flowchart TD', '  A[用户/系统触发]'];
  const first = entrypoints[0]?.path || '入口文件';
  lines.push(`  A --> B["${escapeMermaid(first)}"]`);
  const service = modules.find((m) => /业务|service|usecase|domain/i.test(m.responsibility + m.name));
  const data = modules.find((m) => /数据|db|model|schema|repository|prisma/i.test(m.responsibility + m.name));
  if (service) lines.push(`  B --> C["${escapeMermaid(service.name)}"]`);
  if (data) lines.push(`  C --> D[("${escapeMermaid(data.name)}")]`);
  return lines.join('\n');
}

function escapeMermaid(text) {
  return String(text).replace(/"/g, "'").slice(0, 80);
}
