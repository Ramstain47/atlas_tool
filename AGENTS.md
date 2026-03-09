# Codex Tool - 图鉴数值配置工具

## Project Overview

这是一个基于 React + Vite 构建的**游戏图鉴数值配置工具**，用于帮助游戏开发者配置和管理物品/图鉴系统的属性数值。主要功能包括：

- 多系统管理：支持创建多个图鉴系统（如"摸鱼宝库"等）
- 品质层级配置：支持 1-6 星品质，可配置数量、最大堆叠、权重
- 属性管理：全局属性库管理，支持挂载属性到具体图鉴条目
- 自动分配计算：基于权重和限制条件自动计算属性数值
- 存档系统：支持最多 20 个存档槽位
- 数据导出：支持导出 CSV 格式的配置数据

## Technology Stack

- **前端框架**: React 19.2.0 (使用 Hooks，无类组件)
- **构建工具**: Vite 7.3.1
- **开发语言**: JavaScript (JSX)，未使用 TypeScript
- **状态管理**: React 原生 Hooks (useState, useEffect, useCallback, useMemo)
- **样式方案**: 内联样式 (Inline Styles) + 主题常量集中管理
- **数据持久化**: localStorage
- **代码规范**: ESLint 9.x + react-hooks 插件
- **外部依赖**: 
  - `xlsx` ^0.18.5 - 用于 Excel 导出功能

## Project Structure

```
src/
├── components/
│   ├── layout/          # 页面布局组件
│   │   ├── TopNav.jsx          # 顶部导航栏（系统切换、存档操作）
│   │   ├── SystemConfig.jsx    # 系统配置面板（品质设置、生成按钮）
│   │   ├── DataGrid.jsx        # 中央数据表格（图鉴列表、属性编辑）
│   │   └── AttrPanel.jsx       # 右侧属性面板（属性挂载、计算配置）
│   ├── modals/          # 弹窗组件
│   │   ├── AddQualityModal.jsx    # 添加品质层级
│   │   ├── AttrManagerModal.jsx   # 属性管理器（全局属性 CRUD）
│   │   ├── ExportModal.jsx        # 导出确认
│   │   ├── LoadManagerModal.jsx   # 读档管理器
│   │   ├── NewSystemModal.jsx     # 新建系统
│   │   ├── SaveManagerModal.jsx   # 存档管理器
│   │   └── SelectAttrModal.jsx    # 从属性库选择属性
│   └── ui/              # 通用 UI 组件
│       ├── Inp.jsx          # 输入框组件
│       ├── MiniBar.jsx      # 迷你进度条
│       ├── Modal.jsx        # 通用弹窗容器
│       ├── Pill.jsx         # 标签/药丸组件
│       └── QBadge.jsx       # 品质徽章
├── constants/           # 常量定义
│   ├── app.js           # 默认属性、Storage Keys、系统默认值
│   └── theme.js         # 颜色主题、字体配置
├── hooks/               # 自定义 React Hooks
│   ├── useGlobalAttrs.js    # 全局属性状态管理
│   ├── useSaveSlots.js      # 存档槽位状态管理
│   ├── useSystems.js        # 系统数据核心业务逻辑
│   └── useToast.js          # Toast 通知
├── utils/               # 工具函数
│   ├── compute.js       # 核心数值计算算法
│   ├── format.js        # 数值格式化、ID 生成
│   └── storage.js       # localStorage 封装
├── App.jsx              # 主应用组件（组合所有模块）
├── main.jsx             # 应用入口
└── index.css            # 全局基础样式
```

## Build and Development Commands

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## Key Concepts

### 1. 系统 (System)
代表一个完整的图鉴系统，包含：
- `id`: 唯一标识
- `name`: 系统名称（如"摸鱼宝库"）
- `code`: ID 前缀（如"101"，用于生成条目 ID）
- `qualities`: 品质层级配置数组
- `items`: 图鉴条目数组
- `attrPool`: 当前系统可用的属性池
- `attrConfigs`: 各属性的计算配置（limit/unit/mode）
- `manualOverrides`: 手动覆盖的数值

### 2. 品质 (Quality)
```javascript
{ star: 3, count: 20, maxStack: 10, weight: 1 }
// star: 星级 (1-6)
// count: 该品质条目数量
// maxStack: 单条目最大堆叠数
// weight: 权重（用于数值分配计算）
```

### 3. 条目 ID 格式
```
{sysCode}{star}{seq}
// 例如: 10103001
// 101 = 系统 code
// 03 = 3 星
// 001 = 序号
```

### 4. 属性值类型
```javascript
valueType: 1  // 整数（原始值）
valueType: 2  // 万分比 (val/10000)，显示为百分比
valueType: 3  // 小数 (val/100)，显示为两位小数
```

### 5. 计算模式
- **limit**: 属性总上限值
- **unit**: 最小单位（用于取整）
- **mode**: 取整方式 ("round" | "ceil" | "floor")

计算逻辑见 `src/utils/compute.js`

## Code Style Guidelines

### 主题使用
所有颜色必须从 `constants/theme.js` 导入：
```javascript
import { T, F } from "./constants/theme";

// T.bg.app - 背景色
// T.text.primary - 主要文字色
// T.accent.blue - 强调色
// F.mono - 等宽字体
```

### 注释规范
文件头部使用装饰性注释：
```javascript
// ══════════════════════════════════════════════════════════
//  功能描述
// ══════════════════════════════════════════════════════════
```

### 命名规范
- 组件: PascalCase (如 `TopNav.jsx`)
- Hooks: camelCase 前缀 use (如 `useSystems.js`)
- 工具函数: camelCase (如 `computeAttribute`)
- 常量: UPPER_SNAKE_CASE (如 `MAX_SAVE_SLOTS`)

### 状态管理
- 复杂状态逻辑封装在 custom hooks 中
- 组件内部只保留 UI 状态
- 使用 `useCallback` 缓存事件处理器
- 使用 `useMemo` 缓存计算结果

## Data Persistence

### localStorage Keys
- `codex_global_attrs`: 全局属性列表
- `codex_systems`: 所有系统数据
- `codex_save_slots`: 存档槽位数据（最多 20 个）

### 自动保存
- 系统和全局属性修改后自动保存到 localStorage
- 存档需要用户手动点击"存档"按钮

## Testing

本项目**未配置测试框架**。如需添加测试，建议：
- 单元测试：Jest + React Testing Library
- E2E 测试：Playwright

重点测试模块：
- `utils/compute.js` - 数值计算算法
- `utils/format.js` - ID 生成和格式化

## Deployment

### 构建输出
```bash
npm run build
```
输出到 `dist/` 目录，包含：
- 静态资源（JS/CSS，带 hash）
- `index.html` - 入口文件

### 部署方式
1. **静态托管**: 将 `dist/` 内容上传到任意静态托管服务
2. **本地运行**: 直接打开 `dist/index.html`（需要正确配置 base URL）

### 注意事项
- 应用使用 `type="module"` 的 script 标签
- 所有路由都是前端路由（单页应用）
- 确保服务器配置支持 SPA（404 返回 index.html）

## Security Considerations

- 所有数据存储在浏览器 localStorage 中，无后端服务
- 导出功能生成客户端 CSV 文件，不会上传服务器
- 输入验证在客户端进行，生产环境如需后端需重新验证

## Common Tasks

### 添加新的属性值类型
1. 修改 `constants/app.js` 中的 `DEFAULT_GLOBAL_ATTRS`
2. 修改 `utils/format.js` 中的 `formatValue` 函数

### 修改主题颜色
编辑 `constants/theme.js` 中的 `T` 对象。

### 添加新的弹窗
1. 在 `components/modals/` 创建组件
2. 使用 `components/ui/Modal.jsx` 作为容器
3. 在 `App.jsx` 中添加状态控制和渲染

### 修改核心计算算法
编辑 `utils/compute.js` 中的 `computeAttribute` 函数，注意：
- 保持函数纯函数特性
- 返回格式需兼容现有调用方
