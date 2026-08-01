# Olivia Work Platform — 项目交接指南

> 本文档供后续开发者（如豆包）快速理解项目架构、当前状态及待优化方向。

---

## 1. 项目概述

Olivia Work Platform 是一个个人工作台的 Web 应用，采用纯前端（HTML/CSS/JS）+ Node.js 静态服务器架构，支持 PWA 安装。

**核心定位**：AI 驱动的个人工作管理助手，涵盖项目管理、内容运营、英语学习、习惯打卡、复盘总结等模块。

**技术栈**：
- 前端：原生 HTML5 + CSS3 + Vanilla JavaScript（无框架）
- 后端：Node.js http 模块（纯静态服务器 + API 代理）
- 数据：localStorage 本地存储（无数据库）
- 部署：任意支持 Node.js 的平台（Render/Railway/自有服务器）

---

## 2. 文件结构

```
OliviaWorkPlantform/
├── index.html          # 主页面：侧边栏、底部导航、各模块面板、PWA安装引导、设置面板
├── styles.css          # 全局样式：桌面端 + 移动端 PWA 适配 + 深色主题
├── app.js              # 核心前端逻辑：路由、渲染、AI 调用、状态管理、PWA、设置
├── template-data.js    # 模块定义：导航、tabs、卡片数据、AI prompt
├── data.js             # 运行时数据管理：localStorage 读写
├── my-data.js          # 用户个人数据（可导入导出）
├── server.js           # Node.js 服务器：静态文件 + AI API 代理
├── sw.js               # Service Worker：离线缓存、后台更新
├── render.yaml         # Render 部署配置（Blueprint）
├── manifest.json       # PWA 配置
├── icon.svg            # PWA 图标
├── static-fallback.js   # 静态部署适配层：纯静态环境下自动走 TRAE 桥接
├── .gitignore          # Git 忽略规则
├── .env.example        # 环境变量模板
├── 部署指南.html        # 手机部署完整操作指南（Cloudflare Pages）
├── README.md           # 原项目说明
└── PROJECT_GUIDE.md    # 项目交接指南（本文档）
```

---

## 3. 核心架构

### 3.1 前端架构（app.js）

**状态管理**（全局 `state` 对象）：
```javascript
state = {
  moduleId: "dashboard",    // 当前模块
  tab: "全部",              // 当前 tab
  view: "cards",            // 视图模式：cards/table/timeline
  search: "",               // 搜索关键词
  sortBy: "默认排序",        // 排序方式
  aiChatHistory: [],        // AI 对话历史
  selectedModel: "auto",    // 选中的 AI 模型
  // ... 其他模块状态
}
```

**渲染流程**：
1. `render()` → 根据 `state.moduleId` 调用对应渲染函数
2. `renderNav()` → 侧边栏导航（AI 全能助手置顶在 dashboard 之后）
3. `renderTabs()` → 子 tab 切换
4. `renderCards()` / `renderTable()` / `renderTimeline()` → 内容区

**关键函数**：
- `renderNav()` — 导航渲染，AI 助手模块被强制置顶
- `switchModule()` — 模块切换
- `callAI()` — 统一 AI 调用入口，处理 API 调用和 TRAE 桥接 fallback
- `showAIAssistantDrawer()` — AI 助手抽屉面板

### 3.2 后端架构（server.js）

**v9.0 AI 平台代理架构**：

三层优先级：
1. **平台内置 Key**（`PLATFORM_*` 环境变量）— 运营方配置，用户零配置
2. **用户自配 Key**（`DEEPSEEK_API_KEY` 等）— 用户自行在 `.env` 中配置
3. **TRAE 桥接** — 永远可用，零配置兜底

**Provider 配置**：
```javascript
providers = {
  deepseek: { type: "openai", key: PLATFORM_DEEPSEEK_API_KEY || DEEPSEEK_API_KEY, ... },
  doubao:   { type: "openai", key: PLATFORM_ARK_API_KEY || ARK_API_KEY, ... },
  qwen:     { type: "openai", key: PLATFORM_DASHSCOPE_API_KEY || DASHSCOPE_API_KEY, ... },
  kimi:     { type: "openai", key: PLATFORM_MOONSHOT_API_KEY || MOONSHOT_API_KEY, ... },
  claude:   { type: "anthropic", key: PLATFORM_ANTHROPIC_API_KEY || ANTHROPIC_API_KEY, ... },
  openai:   { type: "openai", key: PLATFORM_OPENAI_API_KEY || OPENAI_API_KEY, ... },
  trae:     { type: "bridge", key: "", model: "trae-bridge", strengths: ["零配置", "永远可用", "平台兜底"] }
}
```

**模型调度逻辑**（`chooseProvider`）：
- 根据 `taskType`（content/product/code/office/general）选择最优模型优先级队列
- 所有队列末尾都带 `trae` 保底
- 返回第一个已配置的 provider

**关键 API 端点**：
- `GET /api/providers` — 返回可用模型列表（含 source 标识：platform/user/bridge/none）
- `POST /api/ai/generate` — 通用 AI 生成
- `POST /api/ai/chat` — 多轮对话
- `POST /api/ai/research` — 资料搜集
- `POST /api/trae/bridge` — TRAE 桥接专用
- `POST /api/content/draft` — 内容创作
- `POST /api/inspiration/analyze` — 灵感分析
- `POST /api/daily-log/analyze` — 日报分析
- `POST /api/health/food-recognize` — 食物识别（图片→卡路里）
- `POST /api/health/recommend` — 健康推荐（减脂食谱/三餐/推文）
- `POST /api/pm/generate` — PM 文档生成（PRD/竞品分析/用户故事/Checklist/路线图）
- `POST /api/notes/ai` — 知识笔记 AI 助手（归类/标签/摘要/整理）
- `POST /api/okr/ai` — OKR AI 智能拆解（目标→Objective+Key Results）
- `GET /api/settings/info` — 服务器信息（版本、时间、模型配置数）

---

## 4. AI 功能现状

### 4.1 已实现的 AI 能力

| 场景 | 入口 | 状态 |
|------|------|------|
| 通用对话 | AI 助手抽屉 → 通用对话 | ✅ 可用（TRAE 桥接兜底） |
| 行业调研 | AI 助手抽屉 → 行业调研 | ✅ 可用 |
| 公文材料 | AI 助手抽屉 → 公文材料 | ✅ 可用 |
| 自媒体文案 | AI 助手抽屉 → 自媒体文案 | ✅ 可用 |
| 图片解析 | AI 助手抽屉 → 图片解析 | ✅ 可用（描述式） |
| 英语辅助 | AI 助手抽屉 → 英语辅助 | ✅ 可用 |
| 内容创作 | 内容运营中心 → 写作室 | ✅ 可用 |
| 灵感分析 | 首页 → 收集灵感 | ✅ 可用 |
| 日报分析 | 首页 → AI 分析今日记录 | ✅ 可用 |
| 健康推荐 | 健康生活中心 → 健康推荐 | ✅ 可用 |
| PM 文档生成 | AI产品经理知识库 → AI快速生成 | ✅ 可用 |
| 笔记AI归类/摘要 | 学习成长中心 → 知识笔记 → AI助手 | ✅ 可用 |
| OKR AI 拆解 | 学习成长中心 → 目标管理 → AI 拆解目标 | ✅ 可用 |
| 设置面板 | 侧边栏 → 设置 | ✅ 可用 |

### 4.2 TRAE 桥接模式

**触发条件**：无任何 API Key 配置时，所有 AI 调用自动切换为 TRAE 桥接。

**交互流程**：
1. 用户输入需求 → 点击"生成内容"
2. 后端检测到无可用模型 → 返回 `mode: "trae-bridge"`
3. 前端渲染 TRAE 指令卡片（含完整 prompt）
4. 用户点击"📋 复制指令" → 粘贴到 TRAE 执行
5. 用户将 TRAE 返回结果粘贴到"粘贴 TRAE 的返回结果..."输入框
6. 点击"导入结果" → 保存到工作台

**优势**：零配置、永远可用、隐私安全（数据不经过第三方 API）

---

## 5. 模块清单

### 5.1 当前模块（已精简）

| 模块 | ID | 说明 |
|------|-----|------|
| 首页仪表盘 | `dashboard` | 今日概览、工作记录、快捷入口 |
| AI 全能助手 | `ai-center` | **置顶模块**，6 大 AI 场景 |
| 项目管理中心 | `project` | 项目追踪、进度管理 |
| AI产品经理知识库 | `pm-knowledge` | **v10.2 升级**：行业动态、方法论、案例库、学习路径、工具资源、AI术语表、AI快速生成(PRD/竞品/用户故事/Checklist/路线图) |
| 内容运营中心 | `content` | 写作室、选题库、发布管理（已精简） |
| 学习中心 | `learning` | **v10.4 升级**：学习任务、专注计时、知识笔记(PARA四区+AI归类/标签/摘要/整理+全文搜索+Markdown预览)、OKR目标管理(季度/月度/周目标+AI智能拆解+进度看板+独立KR进度滑块+8枚成就徽章) |
| 复盘与习惯 | `review` | 复盘、习惯打卡、数据统计 |
| 健康生活中心 | `health` | **v10.1 升级**：健康总览、饮水追踪、饮食热量(AI识别)、运动记录、睡眠管理、习惯打卡(热力图)、健康推荐(AI减脂食谱/三餐/推文) |

### 5.2 已删除的模块

- ~~漫剧编导~~
- ~~跨境电商~~
- ~~吉他练习~~
- ~~美妆护肤~~

---

## 6. 待优化清单（优先级排序）

### 🔴 高优先级

1. **AI 助手场景化增强**
   - 当前 6 个场景（通用/调研/公文/文案/图片/英语）
   - 可增加：代码辅助、数据分析、会议记录整理等
   - 涉及文件：`template-data.js`（tabs/prompts）、`app.js`（欢迎语逻辑）

2. **数据持久化升级**
   - 当前：纯 localStorage，数据量大会性能下降
   - 目标：引入 IndexedDB 或 SQLite（如需要本地部署版）

### 🟡 中优先级

3. **内容创作模块进一步精简**
   - 当前：仍保留选题库、发布管理等较复杂功能
   - 目标：聚焦「写作室」核心，其他可弱化或隐藏

4. **PWA 推送通知**
   - 当前已有：Service Worker 离线缓存、安装引导、在线状态检测
   - 可增加：任务提醒推送、番茄钟结束通知
   - 涉及文件：`sw.js`、`app.js`

### 🟢 低优先级

5. **暗黑模式**
   - CSS 变量已定义（`--bg`, `--surface` 等），但缺少切换开关和完整暗黑配色

6. **多语言支持**
   - 当前纯中文，如需国际化需重构所有文本

7. **协作功能**
   - 当前纯单机，如需多设备同步需后端数据库 + 用户系统

---

## 7. 开发指南

### 7.1 本地启动

```bash
# 安装依赖（无外部依赖，纯 Node.js 内置模块）
cd OliviaWorkPlantform

# 启动服务器
node server.js
# 或指定端口
PORT=3000 node server.js

# 访问 http://localhost:3000
```

### 7.2 配置 API Key（可选）

复制 `.env.example` 为 `.env`，填入至少一个 Key：

```bash
# 平台运营方配置（优先级最高）
PLATFORM_DEEPSEEK_API_KEY=sk-xxx
PLATFORM_ARK_API_KEY=sk-xxx

# 或用户自行配置
DEEPSEEK_API_KEY=sk-xxx
ARK_API_KEY=sk-xxx
```

**注意**：不配置任何 Key 时，系统自动使用 TRAE 桥接模式，零配置可用。

### 7.3 添加新模块

1. 在 `template-data.js` 的 `modules` 数组中添加模块定义
2. 在 `app.js` 的 `render()` 中添加对应的渲染函数
3. 在 `index.html` 中添加对应的 panel DOM（如需独立面板）
4. 在 `styles.css` 中添加对应样式

### 7.4 添加 AI 场景

1. 在 `template-data.js` 中对应模块的 `tabs` 数组添加 tab 名称
2. 在 `tabGroups` 中组织分组（如需要）
3. 在 `app.js` 的 AI 助手抽屉逻辑中添加场景欢迎语
4. 在 `server.js` 的 `classifyTask` 或场景映射中添加任务类型（如需要）

---

## 8. 关键设计决策

### 8.1 为什么不用前端框架？

项目采用原生 JS  intentional 设计：
- 零构建步骤，直接运行
- 无依赖更新负担
- 易于后续开发者理解和修改
- 适合个人工具类应用

### 8.2 为什么用 TRAE 桥接而不是直接集成？

- **零配置**：用户无需申请/购买 API Key
- **永远可用**：不受第三方服务状态影响
- **隐私安全**：敏感数据不经过外部 API
- **平台兜底**：运营方未配置 Key 时仍可用

### 8.3 为什么 localStorage 而不是数据库？

- 纯前端部署，无需后端数据库
- 数据量适中（个人工作台）
- 支持导入导出 JSON 备份
- 如需升级，可平滑迁移到 IndexedDB

---

## 9. 常见问题

**Q: 添加新 AI 模型需要改哪些地方？**
A: 
1. `server.js` 的 `providers` 对象中添加配置
2. `server.js` 的 `chooseProvider` 中调整优先级队列
3. `app.js` 的模型下拉框渲染逻辑（如需要特殊标识）

**Q: 如何修改 AI 的系统提示词？**
A: 修改 `template-data.js` 中对应模块的 `prompt` 字段，或 `server.js` 中的 `buildSystemPrompt` 函数。

**Q: 如何调整模块顺序？**
A: `app.js` 的 `renderNav()` 函数中有硬编码的置顶逻辑，修改 `orderedModules` 的排序即可。

---

## 10. 联系与迭代

- 当前版本：v10.6
- 最后更新：2026-07-30
- v10.6 改动：设置模块垂直深化 — 5 个设置面板（模型管理/数据备份/外观/缓存/关于）+ 深色主题 + 字号偏好 + 紧凑模式 + Render 部署配置
- v10.5 改动：PWA 移动端深度优化 — Service Worker 离线缓存（Cache First + Network Fallback）、PWA 安装引导横幅、在线/离线状态检测与提示
- v10.4 改动：OKR 目标管理垂直深化 — 新增 AI 智能拆解（输入大目标自动生成为 O+KR）、统计看板（总目标/进行中/已完成/平均进度）、周目标周期、KR 独立进度滑块（0-100% 精确控制）、8 枚成就徽章体系
- v10.3 改动：知识笔记 PARA 体系垂直深化 — 增强 6 项能力（PARA区说明+统计/全文搜索/Markdown实时预览/笔记跨区移动/AI归类+标签推荐/AI摘要+整理）
- v10.2 改动：AI产品经理知识库垂直深化 — 新增 AI快速生成 tab（PRD/竞品分析/用户故事/需求评审Checklist/产品路线图），5 个 AI 场景 + 5 张模板卡片
- v10.1 改动：健康生活模块垂直深化 — 新增健康推荐面板（AI 减脂食谱 / 一日三餐搭配 / 健康推文推荐），集成「一只白」「邪修减肥」等热门减脂博主风格
- v10.0 改动：健康生活模块垂直深化 — 新增健康总览仪表盘、运动记录追踪、睡眠管理、习惯打卡热力图（共 6 个 tab）
- v9.0 改动：AI 平台代理架构（内置 Key + TRAE 桥接兜底）、AI 助手独立模块、移动端 PWA 优化

### v10.3 新增功能：知识笔记 PARA 体系增强

在原有 PARA 四区（Projects/Areas/Resources/Archives）基础上，新增 6 项核心能力：

| 能力 | 说明 |
|------|------|
| PARA 区说明 + 统计 | 每个 tab 显示中文说明和笔记数量徽章，顶部显示全局统计 |
| 全文搜索 | 搜索笔记标题、内容、标签，实时过滤当前 PARA 区笔记 |
| Markdown 实时预览 | 编辑/预览双 tab 切换，预览 pane 渲染 Markdown 格式 |
| 笔记跨区移动 | 编辑器下拉选择 PARA 区，保存后自动切换到目标区 |
| AI 归类 + 标签推荐 | AI 分析笔记内容，推荐 PARA 归类（含原因）和标签，一键应用 |
| AI 摘要 + 整理 | AI 生成单条笔记摘要/要点/行动建议，或批量整理全部笔记的归类和标签 |

**PARA 体系定义**：
- **Projects** — 有明确目标和截止日期的项目
- **Areas** — 需要持续维护的责任领域
- **Resources** — 感兴趣的主题和参考资料
- **Archives** — 已完成或不再活跃的内容

**AI 功能入口**：
- `🏷️ AI归类+标签` — 分析当前编辑器中的笔记，推荐 PARA 归类和标签
- `📋 AI摘要` — 生成笔记摘要、关键要点、行动建议
- `🤖 AI整理` — 批量分析全部笔记，给出归类调整和标签优化建议

**涉及文件**：
- `template-data.js`：更新 learning 模块 intro 和 prompt
- `index.html`：升级知识笔记面板（搜索栏、统计栏、编辑/预览 tab、PARA 移动下拉、AI 结果区、TRAE 桥接区）
- `styles.css`：PARA 增强样式（`.para-info-bar`、`.notes-toolbar`、`.note-editor-tabs`、`.note-preview-pane`、`.notes-ai-card` 等）
- `app.js`：`switchPara`/`renderNotes`/`editNote`/`saveNoteFromEditor`/`switchNoteEditorTab`/`previewNote` 升级 + 新增 `aiClassifyNote`/`aiSummarizeNote`/`aiOrganizeNotes`/`callNotesAi`/`renderNotesAiResult`/`applyNotePara`/`applyNoteTag`
- `server.js`：`POST /api/notes/ai` 端点 + `notesAi()` 函数

### v10.2 新增功能：AI产品经理知识库 AI快速生成

AI快速生成面板位于 AI产品经理知识库的「AI快速生成」tab，提供五个 PM 专属 AI 生成场景：

| 场景 | 入口 | 说明 |
|------|------|------|
| PRD文档 | 📝 PRD文档 | AI 生成完整 PRD：背景、用户画像、功能需求(P0/P1/P2)、非功能需求、用户故事、验收标准、风险 |
| 竞品分析 | 🔍 竞品分析 | AI 生成结构化竞品分析：产品定位、功能对比矩阵、交互对比、商业模式、SWOT、差异化建议 |
| 用户故事 | 👤 用户故事 | AI 批量生成 8-12 条标准用户故事（As a/I want/So that），含验收条件 |
| 评审Checklist | ✅ 评审Checklist | AI 生成 7 维度评审 Checklist：功能完整性、边界条件、性能、安全、UX、数据埋点、上线策略 |
| 产品路线图 | 🗺️ 产品路线图 | AI 生成季度路线图：里程碑、交付物、依赖关系、资源需求、KPI/OKR |

**个性化参数**：
- 产品/项目名称
- 目标用户/场景
- 核心目标
- 竞品/参考（选填）
- 额外要求（选填）

**涉及文件**：
- `template-data.js`：新增 AI快速生成 tab、tabGroup、5 张 items
- `index.html`：PM 快速生成面板 DOM（`#pmGeneratePanel`）
- `styles.css`：PM 生成面板样式（`.pm-generate-panel`、`.pm-generate-scene-btn`、`.pm-generate-result-card` 等）
- `app.js`：场景切换、prompt 构建、AI 调用、结果渲染（`switchPmScene`、`buildPmPrompt`、`generatePmDoc`、`renderPmGenerateResult`）
- `server.js`：`POST /api/pm/generate` 端点 + `pmGenerate()` 函数

### v10.1 新增功能：健康推荐

健康推荐面板位于健康生活中心的「健康推荐」tab，提供三个 AI 推荐场景：

| 场景 | 入口 | 说明 |
|------|------|------|
| 减脂食谱 | 📋 减脂食谱 | AI 生成个性化减脂食谱，含热量标注和营养配比 |
| 一日三餐 | 🍱 一日三餐 | AI 生成早餐/午餐/晚餐+加餐的完整搭配方案 |
| 推文推荐 | 📝 推文推荐 | 参考「一只白」「邪修减肥」风格，生成可直接发布的小红书/公众号内容 |

**个性化参数**：
- 目标：减脂 / 保持 / 增肌 / 塑形
- 热量预算：1200-1400 / 1400-1600 / 1600-1800 / 灵活
- 忌口：自由输入（如海鲜、花生、辣）

**AI 生成流程**：
1. 用户选择场景 + 填写参数
2. 前端构建场景化 prompt → 调用 `POST /api/health/recommend`
3. 后端通过 `chooseProvider` 选择最优模型，调用 `callProvider`
4. 如果有 API Key → 直接返回 AI 结果
5. 如果无 API Key → 自动切换 TRAE 桥接模式，返回可复制的 prompt

**涉及文件**：
- `template-data.js`：健康推荐 tab、items 定义
- `index.html`：健康推荐面板 DOM（场景选择、参数区、结果区、TRAE 桥接区）
- `styles.css`：健康推荐面板样式（`.health-recommend-panel`、`.recommend-scene-btn`、`.recommend-result-card` 等）
- `app.js`：场景切换、prompt 构建、AI 调用、结果渲染（`switchRecommendScene`、`buildRecommendPrompt`、`generateHealthRecommend`、`renderRecommendResult`）
- `server.js`：`POST /api/health/recommend` 端点 + `healthRecommend()` 函数

### v10.0 新增数据结构

```javascript
// 运动记录
exerciseStore = { records: [{ id, date, time, type, duration, intensity, calories, note }] }

// 睡眠记录
sleepStore = { records: [{ id, date, bedtime, wakeTime, quality, duration, note }] }

// 习惯打卡
habitStore = {
  habits: [{ id, name, icon, createdAt, archived }],
  checkins: { "habit-id": ["2026-07-30", "2026-07-29", ...] }
}
```

### v10.0 新增 localStorage 键

- `olivia-work-platform-exercise` — 运动记录
- `olivia-work-platform-sleep` — 睡眠记录
- `olivia-work-platform-habits` — 习惯打卡（习惯列表 + 打卡记录）

### v10.4 新增功能：OKR 目标管理深度升级

OKR 目标管理面板在学习成长中心的「目标管理」tab，v10.4 全面升级：

| 能力 | 说明 |
|------|------|
| AI 智能拆解 | 输入大目标（如「3个月减脂10斤」），AI 自动拆解为 Objective + 3-5 个可量化的 Key Results |
| 统计看板 | 顶部四宫格：总目标数 / 进行中 / 已完成 / 平均进度 |
| 周期扩展 | 支持季度 OKR / 月度 OKR / 周目标 三种周期 |
| KR 独立进度 | 每个 KR 配备 0-100% 滑块，精确控制进度，实时计算目标平均进度 |
| 8 枚成就徽章 | 初出茅庐/小有所成/目标达人/完成高手/进度王者/关键结果/AI 共创/大满贯 |

**AI 拆解流程**：
1. 用户点击「🤖 AI 拆解目标」→ 输入大目标
2. 前端调用 `POST /api/okr/ai` → 后端构建 OKR 专家 prompt
3. 返回结构化 Objective + Key Results
4. 用户预览 → 点击「采用此 OKR」→ 保存到本地

**涉及文件**：
- `template-data.js`：更新 learning 模块 intro
- `index.html`：统计看板、AI 拆解面板、KR 滑块 DOM
- `styles.css`：`.okr-stats-board`、`.okr-ai-panel`、`.kr-progress-slider`、`.pwa-install-banner` 等
- `app.js`：`renderOkrStats`、`toggleOkrAiPanel`、`generateOkrByAi`、`parseOkrAiResult`、`updateKrProgress`、徽章扩展
- `server.js`：`POST /api/okr/ai` 端点 + `okrAi()` 函数

### v10.5 新增功能：PWA 移动端深度优化

| 能力 | 说明 |
|------|------|
| Service Worker | `sw.js` 实现 Cache First + Network Fallback 策略，静态资源离线可用 |
| API 离线缓存 | API 请求采用 Network First，失败时回退缓存，完全离线返回友好提示 |
| PWA 安装引导 | 浏览器触发 `beforeinstallprompt` 时显示底部横幅，一键安装到主屏幕 |
| 在线状态检测 | 顶部浮动徽章提示「📡 离线模式」，恢复网络时自动消失 |
| 后台缓存更新 | 已缓存资源在后台静默更新，下次访问自动生效 |

**涉及文件**：
- 新增 `sw.js`：Service Worker 完整逻辑
- `index.html`：SW 注册脚本、PWA 安装横幅 DOM、标题更新 v10.4
- `styles.css`：`.pwa-install-banner`、`.offline-badge`、`@keyframes slideUp`
- `app.js`：`initPwa()` 函数（安装引导绑定、离线检测、状态提示）
- `manifest.json`：PWA 配置优化

### v10.6 新增功能：设置模块 + Render 部署

设置面板通过侧边栏底部「设置」按钮打开，包含 5 个功能 Tab：

| Tab | 功能 |
|-----|------|
| 🤖 模型管理 | 查看所有 AI 模型状态（平台级/用户级/桥接/未配置），设置默认模型偏好 |
| 💾 数据备份 | 导出全部数据为 JSON、从 JSON 导入数据（合并模式）、清空所有数据（二次确认） |
| 🎨 外观 | 浅色/深色主题切换、字号偏好（小/标准/大）、紧凑模式开关 |
| 🗑️ 缓存 | 查看 Service Worker 缓存状态、localStorage 占用大小、一键清除离线缓存 |
| ℹ️ 关于 | 版本号、技术栈、AI 支持列表、部署方式 |

**设置数据结构**：
```javascript
settings = {
  theme: "light" | "dark",      // 主题模式
  fontSize: "small" | "normal" | "large",  // 字号
  compactMode: false,           // 紧凑模式
  defaultModel: "auto"          // 默认模型偏好
}
// localStorage key: olivia-work-platform-settings
```

**云端部署（手机随时随地访问）**：
- 新增 `static-fallback.js` 静态部署适配层，拦截 `/api/*` 请求，后端不可用时自动生成 TRAE 桥接提示
- 推荐方案：**Cloudflare Pages**（免费、无限带宽、国内访问快、无冷启动、不需绑卡）
- 部署步骤：上传 GitHub → Cloudflare Pages 连接仓库 → 自动部署 → 获得 `xxx.pages.dev` 公网 URL → 手机添加到主屏幕
- AI 功能在静态部署下通过本地 TRAE 桥接模式工作（零配置，生成可复制指令）
- 备选方案：Render（免费但有 30-60s 冷启动）、Vercel（需绑卡且国内被墙）

**涉及文件**：
- `index.html`：设置面板 DOM（5 个 Tab + 各功能区）+ 引入 static-fallback.js
- `styles.css`：设置面板全套样式 + 深色主题 + 字号 + 紧凑模式
- `app.js`：`openSettings`/`bindSettingsEvents`/`loadSettingsModels`/`loadSettingsAppearance`/`applyAppearancePrefs`/`loadSettingsCache`/`exportAllData`/`importAllData`
- `server.js`：`GET /api/settings/info` 端点
- `render.yaml`：Render Blueprint 部署配置（备选）
- `static-fallback.js`：静态部署适配层（拦截 API 请求，本地生成 TRAE 桥接提示）
- `部署指南.html`：手机部署完整操作指南（Cloudflare Pages）
- `.gitignore`：Git 忽略规则
- `sw.js`：缓存版本号更新
- `package.json`：版本号更新为 10.6.0

如有疑问，建议先阅读 `server.js`（后端逻辑）和 `app.js`（前端渲染）的注释，关键位置都有版本标记。
