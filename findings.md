# 整改发现记录

## 基线
- 工作区干净，最近提交为 `0488b05 refactor: surface frontend api errors and update readme`。
- package.json 当前只有 dev/start/typecheck/pack:local，缺少 test/build/lint/e2e/prepublishOnly。
- 服务端扫描器已有 regex symbol indexer，支持 JS/TS/Python/Go/Java 符号，但没有 imports/calls 图谱。
- 前端已有 Overview、Module、Flow、Risk、Data、Code、History 页面，没有独立代码图谱页。
- AppShell PageId 当前不包含 graph，需要新增导航项。

## 本轮实现约束
- 先支持 TS/JS 图谱，不扩展全语言。
- 图谱层保持纯 ESM 和 Node 内置 API，避免引入大型依赖。
- 前端图谱先做可验证的轻量关系视图和 Inspector，不引入 Cytoscape。
- 每个完成项验证后提交一次。
