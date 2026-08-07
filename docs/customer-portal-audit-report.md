# 智枢AI Customer 端（客户后台）全面审计报告

**审计日期**: 2026-08-03
**审计范围**: 侧边栏导航、全部 22 个页面、组件完整性、设计质量、功能覆盖度

---

## 一、侧边栏导航完整性

侧边栏共定义 11 个一级菜单项，其中 4 个是展开式子菜单。所有菜单项与页面文件存在，无断链情况。

| 菜单项 | 路由 | 页面文件 | 状态 |
|--------|------|----------|------|
| 数据总览 | /customer/dashboard | dashboard/page.tsx | 正常 |
| AI创作工厂 | /customer/ai-factory | ai-factory/page.tsx | 正常 |
| 内容中心 | /customer/materials | materials/page.tsx | 正常 |
| 招聘助手 - 平台授权 | /customer/recruitment/platforms | recruitment/platforms/page.tsx | 正常 |
| 招聘助手 - 智能沟通 | /customer/recruitment/auto | recruitment/auto/page.tsx | 正常 |
| 招聘助手 - 职位发布 | /customer/recruitment/publish | recruitment/publish/page.tsx | 正常 |
| 招聘助手 - 简历筛选 | /customer/interview | interview/page.tsx | 正常 |
| 招聘助手 - 面试管理 | /customer/recruitment-dashboard | recruitment-dashboard/page.tsx | 正常 |
| 智能获客 - 潜客发现 | /customer/acquisition/discover | acquisition/discover/page.tsx | 正常，但有重复 |
| 智能获客 - 引流任务 | /customer/acquisition/task | acquisition/task/page.tsx | 正常，但有重复 |
| 智能获客 - 获客看板 | /customer/acquisition/board | acquisition/board/page.tsx | 正常 |
| 推荐分享 - 码生成 | /customer/share/code | share/code/page.tsx | 正常，但有重复 |
| 推荐分享 - 推荐追踪 | /customer/share/track | share/track/page.tsx | 正常，但有重复 |
| 推荐分享 - 分享看板 | /customer/share/board | share/board/page.tsx | 正常 |
| 数字人 | /customer/digital-human | digital-human/page.tsx | 正常 |
| 工单管理 | /customer/tickets | tickets/page.tsx | 正常 |
| 在线客服 | /customer/support | support/page.tsx | 正常 |
| 登录日志 | /customer/login-logs | login-logs/page.tsx | 正常 |
| 系统设置 - API设置 | /customer/api-keys | api-keys/page.tsx | 正常 |
| 系统设置 - 修改密码 | /customer/settings/security | settings/security/page.tsx | 正常 |
| 系统设置 - APP下载 | /customer/settings/app-download | settings/app-download/page.tsx | 正常 |
| 系统设置 - 退出登录 | (onClick handler) | 侧边栏直接处理 | 正常 |

---

## 二、严重问题：模块重复实现

### 2.1 获客模块双实现

获客模块存在两套独立、功能完全重叠的实现，这是当前 Customer 端最严重的架构问题。

第一套：`/customer/acquisition/page.tsx` — 使用 Tabs 组件将获客任务和潜客列表合并在一个页面，通过 `?tab=` URL 参数切换。共约 372 行代码。

第二套：`/customer/acquisition/discover/page.tsx` 和 `/customer/acquisition/task/page.tsx` — 各约 179 行和 168 行，功能与第一套完全一致但独立实现。

侧边栏指向的是第二套（discover + task），但第一套的 Tabs 页面实际上也存在于文件系统中。这意味着两套代码需要分别维护，任何功能变更都需要同步修改，严重违反 DRY 原则。

建议：删除第一套 Tab 版本（`acquisition/page.tsx`），保留第二套独立页面实现（与侧边栏导航结构一致）。或者反向操作，保留 Tabs 版并更新侧边栏指向。

### 2.2 分享模块双实现

同上，分享模块也存在完全重复的实现。

第一套：`/customer/share/page.tsx` — Tabs 版本，合并分享码和分享记录，约 223 行。

第二套：`/customer/share/code/page.tsx` 和 `/customer/share/track/page.tsx` — 独立页面版本，各约 141 行和 133 行。

建议：统一为侧边栏指向的独立页面方案（code + track + board），删除 Tabs 版本 `share/page.tsx`。

---

## 三、页面设计质量评估

### 3.1 设计优秀（90+ 分）

**AI创作工厂** — 这是整个 Customer 端设计质量最高的页面。卡片网格布局美观，每个功能卡有独特的渐变色背景和 SVG 图标，hover 效果流畅。创作表单包含：场景提示 + 平台指导 + 输入建议 + 创作要求 + 硬性禁忌 + 常见问题 FAQ，构成完整的创作引导体系。爆款基因预分析系统（`analyzeViralTopic`）会在生成前评估爆款潜力、自动注入 hook/情绪/节奏到 prompt 中，并展示评分卡片。生成历史 Drawer 保留最近 50 条记录。功能预留状态用 Badge.Ribbon 清晰标记。

**推荐分享 — 分享看板** — 顶部四张统计卡片（分享码、扫码、发布、佣金），左侧效果排行榜带转化率进度条，右侧操作指南。空状态文案友好"暂无效果数据，创建分享码并开始分发后将自动统计"。

**智能获客 — 获客看板** — 六张统计卡片 + 渠道分布进度图 + 近期任务进度图。空状态有明显的引导按钮和渐变背景卡片。

### 3.2 设计良好（75-89 分）

**数据总览 Dashboard** — 统计卡片 + 功能快捷入口 + 图表区域，结构完整。支持功能排序（上移/下移），操作按钮触手可及。

**内容中心** — Tab 切换解决分类问题，卡片式内容展示，每个内容有缩略图预览和状态标签，操作栏清晰。

**数字人** — 三 Tab 结构（数字人 / 声音克隆 / 视频克隆），各 Tab 的表单和操作完整。删除操作已有二次确认弹窗。需要改进：缺少数字人头像的可视化预览。

**系统设置** — 纵向 Tabs 导航 + 各设置面板清晰分离，个人资料、偏好、安全、集成应用的布局合理。

### 3.3 设计一般（60-74 分）

**招聘助手系列页面**（平台授权 / 智能沟通 / 职位发布）— 标准 CRUD 表格 + Modal 表单，功能完整但视觉上缺乏亮点，所有表格样式高度雷同。

**简历筛选 / 面试管理** — 基础表格操作，缺少 AI 评分可视化、批量操作、高级筛选等高级功能。

**分享 — 码生成** — 表格 + 二维码弹窗，功能简洁但缺少视频预览、扫码统计趋势图等增强功能。

**工单管理** — 标准表格，缺少优先级可视化、SLA 倒计时等运维管理特性。

**在线客服** — 基础聊天界面，功能可用但 UI 不如市面常见客服系统。

**API 设置** — 简单的 Key 列表 + 增删，缺少使用量统计、到期提醒、环境切换等功能。

**登录日志** — 基础日志表格，功能单一但能用。

### 3.4 页面等级分布

优秀（90+）：AI创作工厂、获客看板、分享看板 — 共 3 页
良好（75-89）：Dashboard、内容中心、数字人、系统设置 — 共 4 页
一般（60-74）：招聘助手 5 页、获客 2 页、分享 2 页、工单、客服、API、日志 — 共 14 页

---

## 四、组件完整性分析

### 4.1 对话框/Modal 覆盖度

所有需要二次确认的删除操作均已实现 `Modal.confirm`，覆盖度 100%。具体包括：数字人页面（删除声音/删除视频）、获客模块（删除任务/删除潜客）、分享模块（删除分享码）、素材模块（删除素材）。

### 4.2 表单完整性

- AI创作工厂：描述、风格、字数、尺寸、时长、配音、字幕、BGM、上传文件、额外要求、生成数量 — 覆盖完整
- 获客任务创建：任务名称、获客渠道、目标数量 — 三项核心字段，建议增加"目标描述"和"时间范围"字段
- 潜客编辑：姓名、手机、邮箱、状态、备注 — 核心字段完整
- 分享码创建：分享标题、视频链接、目标平台 — 核心字段完整
- 招聘助手各页面：表单字段覆盖岗位核心信息

### 4.3 空状态覆盖度

获客看板：完整的空状态引导（渐变背景 + 文字 + CTA 按钮） ✓
分享看板：友好的空状态文案 ✓
码生成 / 追踪 / 潜客 / 任务：仅依赖 Table 的 `emptyText`，缺少引导式空状态 ✗

### 4.4 加载状态

半数页面使用 Table 内建 `loading` 属性，部分看板页面使用全屏 `Spin`。但缺少骨架屏（Skeleton）加载体验。

---

## 五、技术债务

### 5.1 API 客户端不一致

Customer 端存在两种 API 客户端混用：
- `apiClient`（`lib/api.ts`）— 14 个页面使用，直接返回 `res.data` 或裸对象，响应格式处理不统一
- `request`（`utils/request.ts`）— 4 个页面使用，自动处理 JWT 认证和 `{success, data}` 包裹

一个项目中存在两种 HTTP 客户端且行为不一致，是主要的技术债务，已在之前的修复中标记。

### 5.2 TypeScript 类型覆盖

- `useState<any[]>` 仍存在于约 12 个页面中的部分 state 声明
- `apiClient` 的返回值类型均为 `any`，缺少泛型约束
- 招募模块中已完善类型（SocialAccount、Job、AutoReplyRule 等），但获客和分享模块尚未跟进

### 5.3 缺少面包屑导航

所有 Customer 页面均无面包屑导航。对于有三级深度的页面（如获客 > 潜客发现），用户缺乏位置感知。

### 5.4 缺少列排序和高级筛选

多数表格不支持列头点击排序、高级组合筛选。对于数据密集型页面（工单、日志、潜客），这是功能短板。

---

## 六、各功能需求的满足度

| 功能模块 | 核心需求覆盖 | 缺失功能 | 满足度 |
|---------|-------------|---------|--------|
| 数据总览 | 统计卡片、快捷入口、图表 | 可展开的数据下钻 | 85% |
| AI创作工厂 | 12种内容类型、爆款分析、历史 | 批量生成 | 95% |
| 内容中心 | 分类浏览、搜索、删除 | 批量操作、导出 | 80% |
| 平台授权 | 扫码授权、解绑、刷新 | 批量解绑、授权过期提醒 | 85% |
| 智能沟通 | 关键词自动回复、开关 | 多关键词组合、时间段规则 | 80% |
| 职位发布 | 增删改查、候选人管理 | 一键发布多平台、模板 | 80% |
| 简历筛选 | 列表查看 | AI匹配度评分、批量筛选 | 60% |
| 面试管理 | 基础数据管理 | 日历视图、面试提醒 | 65% |
| 潜客发现 | 列表、编辑、跟进 | 导入导出、批量分配 | 80% |
| 引流任务 | 创建/编辑/暂停/进度 | 定时启动、多渠道并行 | 85% |
| 获客看板 | 统计、渠道分布、进度 | 趋势图、同比/环比 | 85% |
| 码生成 | 创建/删除/二维码/复制 | 视频预览、扫码趋势 | 85% |
| 推荐追踪 | 扫码记录、设备识别 | 导出、地域分析 | 75% |
| 分享看板 | 统计、转化率、排行 | 趋势图 | 80% |
| 数字人 | 管理/声音/视频克隆 | 头像可视化预览 | 85% |
| 工单管理 | CRUD、状态流转 | SLA计时、优先级颜色 | 75% |
| 在线客服 | 基础对话 | 快捷回复、富文本、文件 | 70% |
| 登录日志 | 列表查看、筛选 | 导出、异常告警 | 70% |
| API设置 | Key增删 | 用量统计、到期提醒 | 60% |
| 修改密码 | 表单验证 | 密码强度指示器 | 80% |
| APP下载 | 二维码、安装指南 | 版本更新日志、下载量 | 85% |

---

## 七、优先级修复建议

### P0 — 立即修复（架构隐患）

1. 删除获客模块的重复实现：保留 `/acquisition/discover` + `/acquisition/task` + `/acquisition/board`，删除 `/acquisition/page.tsx`（Tabs 版本）
2. 删除分享模块的重复实现：保留 `/share/code` + `/share/track` + `/share/board`，删除 `/share/page.tsx`（Tabs 版本）

### P1 — 高优先级（用户体验）

3. 为所有 Customer 页面添加面包屑导航
4. 统一 API 客户端，全部迁移到 `request`（`utils/request.ts`），消除 `apiClient` 依赖
5. 完成 TypeScript 类型化：消除剩余 `useState<any>`，为 API 响应类型添加泛型接口

### P2 — 中优先级（功能增强）

6. 表格增加列排序功能和搜索过滤
7. 数字人页面增加头像可视化预览占位
8. 获客看板和分享看板增加趋势图（ECharts/Chart.js）
9. 为所有列表页增加引导式空状态（非仅 emptyText）
10. 简历筛选增加 AI 评分列和匹配度可视化

### P3 — 低优先级（锦上添花）

11. 增加骨架屏加载效果替代全屏 Spin
12. 工单管理增加 SLA 倒计时和优先级颜色标记
13. 在线客服增加快捷回复和文件发送
14. API 设置增加用量统计图表
15. 支持页面配置的导出功能（CSV/Excel）

---

## 八、总结

Customer 端共 22 个页面，侧边栏导航完整无断链。AI创作工厂是设计质量标杆，获客看板和分享看板紧随其后。两个模块存在代码重复（获客和分享各有一套 Tabs 版本），这是当前最大的架构问题。整体功能完整性约 80%，14 个标准 CRUD 页面设计风格统一但缺乏差异化。Dialog/Modal 组件覆盖完整，所有删除操作均有二次确认。API 客户端不统一是最大的技术债务，TypeScript 类型化仍有改进空间。建议按上述优先级分阶段推进修复。

---

## 参考文件清单

- `web/app/customer/layout/Navbar.tsx` — 侧边栏入口
- `web/app/customer/ai-factory/page.tsx` — 设计标杆（929行）
- `web/app/customer/acquisition/page.tsx` — 待删除（Tabs 重复版）
- `web/app/customer/share/page.tsx` — 待删除（Tabs 重复版）
- `web/lib/api.ts` — 待废弃的 API 客户端
- `web/utils/request.ts` — 标准 API 客户端
