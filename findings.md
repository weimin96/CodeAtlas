# 整改发现记录

## 基线
- 仓库当前工作区干净。
- package.json 提供 `npm run typecheck` 作为前端类型检查命令。
- AppShell 已改为顶部导航。
- Report 已有 analysisQuality、dataModel、evidenceIndex 类型和 normalizer 兜底。
- ModuleDetailPage 已落地。

## 建议来源要点
- P0 已完成：顶部导航、ModuleDetailPage、报告 schema 增加 analysisQuality/dataModel/evidence、分阶段 AI 分析。
- P1 继续处理：FlowDetailPage、RiskDetailPanel、Context Pack mode、Ask 结构化返回。
- 展示层应从“页面上摆结果”升级为“带证据的项目理解导航”。
