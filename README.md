# Project Fast Onboarding

本地项目快速接管工作台。通过 npm 安装后，用命令指定一个本地项目目录，浏览器里查看项目地图、核心链路、代码预览、风险雷达，并基于当前文件/选中代码追问 AI。

## 技术栈

- CLI / Server: Node.js + Express
- Frontend: Vite + React + TypeScript
- UI: Tailwind CSS + shadcn/ui 风格组件
- Icons: lucide-react
- Diagram: Mermaid
- Code Preview: Monaco Editor via `@monaco-editor/react`
- AI: Vercel AI SDK (`ai`)
  - OpenAI: `@ai-sdk/openai`
  - OpenAI-compatible: `@ai-sdk/openai-compatible`
  - Ollama: `ollama-ai-provider-v2`

## 安装

```bash
npm install -g ./project-fast-onboarding-0.2.0.tgz
```

或者发布到 npm 后：

```bash
npm install -g project-fast-onboarding
```

## 使用

```bash
pfo /path/to/your/project
```

指定端口：

```bash
pfo /path/to/your/project --port 8088
```

不自动打开浏览器：

```bash
pfo /path/to/your/project --no-open
```

默认地址：

```text
http://127.0.0.1:7890
```

## AI 配置

打开页面右侧/左侧的 AI 配置区，填写：

### OpenAI-compatible

```text
Provider: OpenAI Compatible
Base URL: https://api.openai.com/v1
Model: gpt-4.1-mini 或其他模型
API Key: sk-...
```

也支持环境变量：

```bash
OPENAI_API_KEY=xxx OPENAI_MODEL=gpt-4.1-mini pfo /path/to/project
```

### Ollama

```bash
ollama serve
ollama pull qwen2.5-coder:7b
```

页面填写：

```text
Provider: Ollama
Base URL: http://127.0.0.1:11434/api
Model: qwen2.5-coder:7b
API Key: 留空
```

## 初版能力

- 扫描本地项目目录。
- 自动识别关键文件、入口候选、模块候选。
- AI 生成项目概览、入口、模块、核心链路、风险、阅读路线、Mermaid 图。
- 三栏 UI：左侧项目地图，中间 Monaco 代码预览，右侧上下文追问。
- 追问会绑定当前文件、当前选中代码行、当前链路、当前风险。
- 支持 OpenAI-compatible 和 Ollama。

## 设计取向

这个工具不是普通 AI coding assistant，而是“项目接管工作台”：

1. 先生成第一版地图。
2. 再点击链路查看代码。
3. 然后围绕当前文件/函数/风险追问。
4. 最后由人基于代码和断点验证。

## 当前限制

- 暂未实现 Tree-sitter AST 级符号索引。
- 暂未实现精确调用图。
- 暂未持久化历史分析报告。
- 暂未支持多人协作或远程仓库托管。

下一版建议：Tree-sitter 符号索引、调用方/被调用方搜索、追问结果反写到报告、SQLite 本地历史库。
