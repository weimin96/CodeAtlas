# 项目优化发现

## Code Graph 当前状态
- 已有 TS AST 提取 imports/calls，并有 Cytoscape 画布。
- 现有图谱页仍以全项目节点列表为主，缺范围切换、边过滤、warning-only、邻居高亮和业务回链。
- 现有 Explain tab 是前端本地解释 + session cache，不会查 SQLite，也不会调用 AI。
- SQLite 已建 explain_cache 表，但尚未被 Explain tab 使用。

## 实现约束
- 先做前端可用性收口，避免重写图谱引擎。
- 范围切换通过现有 report 模块、链路、风险和当前文件信息做子图过滤。
- Graph-aware Context Pack 后续通过服务端引入图谱摘要和邻居文件，不承诺类型级精确调用图。
