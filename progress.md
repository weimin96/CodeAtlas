# 项目 P2 优化进度

## 2026-07-04
- 用户提出 P2 优化：通用 Inspector、首页 warnings、画布显示范围/排序、避免 Explain All。
- 已将任务拆为阶段 29-33，并确认每阶段单独提交。
- 阶段 29 完成：新增 ObjectInspector 通用组件，支持 module/flow/risk/node/symbol/entity 对象类型与 overview/explain/why-connected/warnings/code tabs；代码图谱页已迁移到该组件。
- 阶段 29 验证通过：tsc --noEmit、vite build、npm run lint。
