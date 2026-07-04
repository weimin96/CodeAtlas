# codemap-ai 品牌资源

## 资源文件

| 资源 | 路径 | 用途 |
|---|---|---|
| Logo | `web/public/brand/codemap-ai-logo.svg` | README 顶部、favicon、系统图标、紧凑空间 |
| React 组件 | `web/src/components/BrandMark.tsx` | 系统内复用品牌展示 |

## 视觉规则

- 主背景使用深海军蓝到紫黑渐变：`#07111F` / `#0E1B3D` / `#120A2D`。
- 主笔画使用冷白、浅青和浅紫：`#F8FAFF` / `#B9F4FF` / `#A78BFA`。
- 图谱强调色使用青色、蓝色和紫色：`#22D3EE` / `#60A5FA` / `#A78BFA`。
- Logo 由代码括号、地图网格和调用图节点组合，表达“从代码生成项目地图”。
- 当前不再使用文字 logo；README 和系统顶部只展示图形 logo。
- 在浅色页面使用时，保留 SVG 内置深色底，不要直接裁切成透明图形。

## 系统使用

顶部品牌区使用：

```tsx
import { BrandMark } from '@/components/BrandMark';

<BrandMark />
```

## README 使用

```html
<p align="center">
  <img src="./web/public/brand/codemap-ai-logo.svg" alt="codemap-ai logo" width="96" />
</p>
```

## 当前命名状态

产品展示名、README 标题、系统顶部品牌和主 CLI 已统一为 `codemap-ai`。npm 包名为 `@codemapai/codemap-ai`。
