# 项目优化进度

## 2026-07-04
- 读取 planning-with-files，恢复 task_plan/progress/findings。
- 最新用户清单拆分为阶段 23-28。
- 当前已完成上一轮大量基础项：Playwright、ESLint、数据实体确认、codeatlas CLI、TS AST Code Graph、SQLite 镜像、Cytoscape 画布。
- 阶段 23 开始：目标是补 Code Graph 范围切换、边类型过滤、warning 搜索、邻居高亮和业务回链。
- 阶段 23 完成：CodeGraphPage 增加 all/module/flow/file/symbol 范围切换、contains/defines/imports/calls/warnings-only 过滤、按文件/函数/模块/warning 搜索、直接/调用方/被调用方/import/2-hop 高亮，以及模块/链路/风险业务回链。
- 阶段 23 验证通过：tsc --noEmit、vite build、Playwright e2e。
