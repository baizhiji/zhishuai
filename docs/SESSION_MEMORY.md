# 智枢AI — 会话记忆文件（AI 启动时必读）

> 最后更新：2026-08-04 (TokenHub 模型 ID 修正为 hy3 + endpoint 保持实际可解析的 tencentmaas.com + AI API 配置 + 服务端代理 + 模型可用性修复 + 部署验证通过 + 视频生产配置补全) | 提交数：535+ | 项目启动：2026-04-25

## 2026-08-04 本次会话关键更新

### 已完成
1. **AI API 配置与测试**：在服务端环境变量配置了用户提供的阿里云百炼、腾讯云 TokenHub 测试 Key，并验证两个 Key 均可用。
2. **AI 创作工厂可运行**：
   - 新增 `server/src/routes/ai-factory.ts` 后端代理路由，未配置自有 API Key 的客户可通过服务端兜底 Key 生成文本。
   - 修改 `web/lib/ai/factory-service.ts`，无 Key 时优先走后端代理，失败后才降级到本地模拟。
   - 修正 `web/lib/ai/category-config.ts` 中腾讯云 TokenHub 的 OpenAI 兼容 endpoint。
3. **服务端 AI 路由修复**：
   - TokenHub endpoint 保持实际可解析且可用的 `https://tokenhub.tencentmaas.com/v1`（在香港 CVM 与本地均验证 `/v1/models` 返回 73 个模型）。控制台截图中的 `tencentaas.com` 在两地 DNS 均无法解析，故不采用。
   - 修正 `server/src/services/ai-client.ts`、 `server/src/routes/ai-chat.ts`、 `server/src/routes/ai.ts`、 `web/lib/ai/category-config.ts` 中 TokenHub endpoint 统一为 `https://tokenhub.tencentmaas.com/v1`。
   - 修复 `server/src/routes/ai-chat.ts` 因命名导出破坏 CommonJS 默认导出导致路由未注册的问题。
   - 为 `server/src/services/ai-client.ts` 增加环境变量 fallback 机制。
   - 更新 `server/src/services/ai-model-router.ts`、 `server/src/routes/ai-chat.ts`、 `server/src/routes/ai.ts`、 `server/src/services/model-registry.ts`、相关 scripts 中所有腾讯云模型 ID 为 `hy3`（控制台截图与 `/v1/models` 均确认可用）。
4. **关键缺陷修复**：修复 `server/src/services/auth.service.ts` 中重复 `action:` 键导致的语法错误；修复 `server/src/routes/dashboard-stats.ts` 远端引用路径不一致问题。
5. **部署验证**：远端 `npx next build` 通过，`pm2 restart` 后 `scripts/verify-login.sh` 三种角色登录均返回 200；后端 `/api/ai-chat/chat`、`/api/ai/generate-script`、`/api/ai-factory/generate-text` 阿里云/腾讯云均测试通过。
6. **视频生产配置补全**：
   - 新增 `shared/types/video-production.ts` 共享类型：VoiceoverConfig(配音)、SubtitleConfig(字幕)、BannerOverlay(横幅/贴片)、BgmConfig(背景音乐)、VideoProductionConfig(统一配置)
   - 新增 `web/lib/ai/video-overlay-config.ts` 横幅预设库：10种横幅类型(opening-title/lower-third/closing-credits/call-to-action/watermark/scene-divider/speech-bubble/bullet-comment/brand-logo/progress-hint) + 8种样式预设(深色半透明/品牌渐变/干净卡片/毛玻璃/醒目红底/极简线框/高级金色/字幕通栏)
   - 配音覆盖：普通话男女/粤语男女/英语男女/四川话/东北话/上海话/闽南话/河南话/湖南话/陕西话/天津话（14种）
   - 字幕覆盖：无/中文/英文/中英双语（4种）
   - web端 AI 创作工厂页面新增"横幅/贴片"多选下拉框
   - generateVideo 函数注入 buildVideoPrompt：自动将配音/字幕/横幅/BGM 配置转化为增强 prompt
   - 将视频生产配置系统（第十一章）纳入 `docs/AI创作工厂模型配置总蓝皮书.md`

### 已知仍需处理的问题
- 支付系统已按用户要求下线/不启用，保持线下付费模式。
- 服务端 `npm run build`（tsc）仍有大量历史遗留 TypeScript/Prisma 类型错误，当前用 `tsx` 启动运行；如要切换到编译产物运行，需要系统性地修复类型错误和同步 schema。
- 智能获客、智能招聘等模块仍依赖 mock 数据，需按业务优先级逐步接入真实平台 API。
- 测试覆盖率、用户文档、隐私政策/服务条款、监控告警、数据库备份策略等基础设施仍需补齐。

---

## 零、项目编年史（完整开发历程）

### 2026-03-06 ~ 04-16：开发环境准备期

在智枢AI项目代码开始之前，先完成了 CodeBuddy 开发环境的配置：
- 2026-03-06：仓库初始提交（`.codebuddy/` 和 `openclaw.json` 配置）
- 2026-04-14：启用 agent-browser 网页自动化技能、优化编程与APK开发能力配置、调整 AI 模型配置以平衡性能/质量/成本
- 2026-04-16：优化 OpenClaw 模型选择策略和性能配置

### Phase 1 — 初始开发冲刺（2026-04-25，1天）

2026-04-25 下午 12:18，正式初始化"智枢AI SaaS"项目。这一天在极高强度下完成了项目的第一版骨架：

- **技术选型确定**：Next.js 14 + React 18 + TypeScript + Ant Design + Express 4 + Prisma + MySQL。选择理由：Next.js 的 SSR/SEO 能力适合 SaaS 应用；Express 轻量灵活比 NestJS 更适合快速迭代；Prisma 提供类型安全的数据库访问；MySQL 作为成熟的关系型数据库适合业务系统。
- **客户管理板块**：完整的第一版客户管理功能
- **电商板块**：多店铺管理、自动上架、价格监控、销量统计、智能详情页生成（后续在 6/5 被标记为"预留"）
- **系统设置板块**：完整的系统设置功能
- **UI/UX 优化**：Web 端性能和界面优化
- **测试体系**：Jest 单元测试环境和测试用例（后续未维护，测试体系荒废）
- **全局导航栏**：包含 8 个版块导航和用户信息

### Phase 2 — 需求重构（2026-04-27 ~ 04-29，3天）

用户提出新需求，对整个系统进行了架构级重构：
- 2026-04-27：根据新需求重构智枢AI系统（这是第一次重大方向调整）
- 实现用户认证功能、数据对接功能、支付功能（充值和订阅）
- 重新设计导航栏和首页
- 大量的 Ant Design 6 兼容性修复（废弃属性、中文语言包、导航初始化问题）
- 修复导航栏空白问题（经过 6 轮迭代才彻底解决，涉及全局状态管理、本地状态初始化、useMemo/useCallback 优化）
- 修复无限循环导致的登录失败

2026-04-28 ~ 04-29 是内容创作和发布密集期：
- **内容工厂**：重构为多分类体系，先支持 6 个分类，后扩展到 9 个独立分类
- **发布中心**：素材选择、账号选择、标签、批量发布、连续多天定时发布
- **矩阵管理**：多平台账号矩阵管理
- **数据报表**：基础报表功能
- **图生视频**：AI 图像转视频功能
- **数字人**：视频解析和数字人仓库功能

这一阶段导航栏问题反复出现（至少 8 次修复提交），根源是 Ant Design 6 的 Menu 组件 SSR/CSR 状态不一致。

### Phase 3 — 代码集中入库（2026-05-31，1天）

2026-05-31 22:51，将全部项目代码一次性提交到 GitHub main 分支：
- `web/`、`server/`、`apk/`、`deploy/`、`docs/` 五个目录完整入库
- 包含完整的前后端代码、移动端 APK、部署配置和文档

### Phase 4 — 数据库对接与生产化（2026-06-01 ~ 06-05，5天）

这是项目从"前端演示"走向"真实后端"的关键阶段：

2026-06-01：
- Prisma schema 从 PostgreSQL 切换到 MySQL，String[] 改为 String @db.LongText
- 管理员账号设为 18601655222
- 实现登录入口权限控制：不同角色只能从对应入口登录
- 统一角色命名（customer）
- API Key 管理简化、APK 下载入口、热更新配置、AI 能力集成
- Token 使用量统计

2026-06-02：
- 社交账号管理和自动化功能
- 添加视频号、知乎、百家号、头条、智联招聘等平台适配器
- 调整菜单结构，删除"我的"菜单

2026-06-03 ~ 06-04：
- APK 构建修复：Kotlin JVM 版本统一、Expo SDK 降级到 52、EAS Build 配置
- AI 能力四轮优化：智能提示词引擎 → 思维链+质量控制+工作流引擎 → 反馈学习+热点接入+多模态增强 → 视频增强+语音克隆+数字人+实时分析
- 统一 API 配置，修复各种路由和服务缺失

2026-06-05：
- 恢复完整后端服务（含数据库支持）
- **创建记忆系统**：`SESSION_MEMORY.md` + `DEVELOPMENT_LOG.md` + `ISSUES.md`（这就是当前这套记忆体系的起点）
- 解决 Hydration 错误（mounted 状态方案）
- 解决菜单 Key 重复问题
- 清理占位页面，完善 CRM 功能
- **重要决策**：电商板块标记为"预留"，优先级调整——自媒体运营 > 智能招聘 > 智能获客 > AI对话 > (预留)电商 > (后续)CRM增强

### Phase 5 — 核心功能密集开发（2026-06-06 ~ 06-09，4天）

2026-06-06 ~ 06-07：
- Navbar hydration 问题的深入修复（hooks 顺序、条件渲染）
- 简化客户 Navbar 菜单结构

2026-06-08（极高强度的功能日）：
- **获客功能**：多数据源支持（天眼查、高德、直播间采集等）
- **分享码**：从"推荐分享"重构为"短视频分享码"功能
- **CRM 增强**：客户管理、公海池、跟进记录
- **数字人增强**：声音克隆、视频克隆 API 和数据模型
- 大量 API 响应 `.data` 访问修复、request.get 类型定义修复

2026-06-09：
- **CRM 自动化**：自动化工作流
- **天眼查/高德 API 对接**：外部数据源集成
- **直播间采集**：直播数据采集
- **数据导出**：数据导出功能
- **矩阵账号授权**：账号授权机制完善
- **发布中心完善**：发布功能闭环
- Prisma schema 编译错误全面修复
- 项目编译零错误通过

### Phase 6 — 沉淀期（2026-06-15 ~ 07-23，约5周）

6月15日后项目进入相对安静期。开发者可能在处理其他事务或进行线下开发。GitHub 上此期间无实质提交（仅有一个 `git stash` 的 WIP 记录）。但开发并未完全停滞——7月24日的提交显示有大量线下累积的工作。

### Phase 7 — 恢复冲刺（2026-07-24，1天）

大量线下累积的变更在这一天集中提交：
- 恢复缺失的 `auth.service.ts`
- 客户仪表盘聚合 API + 完整仪表盘重设计
- 补全所有缺失的 untracked service 文件
- ContentCategory 枚举重构：新增 `AI_SKETCH`、`AI_COMIC` 等值
- 素材中心和媒体工厂的枚举引用全面更新
- AI 创作工厂新增"萌宠卡通短视频"类别（位于数字人短视频之前）
- 认证循环重定向修复：统一 401 处理、移除 AuthContext 的 pathname 依赖、AuthGuard useRef 防抖、根页面使用 useAuth
- AdminLayout/AgentLayout 移除 collapsed/onCollapse props 以匹配部署版本
- 补充 MATERIALS 和 MEDIA_ 权限

### Phase 8 — 系统重构（2026-07-31 ~ 08-02，进行中）

2026-07-31：
- 备份了 7/27-7/31 期间的"混沌状态"快照
- 移除未提交组件的引用（GlobalSearch、ContentSafetyPanel、RoleSwitchModal），恢复干净构建

2026-08-02：
- **Admin 端重构**：合并客户管理与代理商管理、删除冗余页面、新增 API 服务商和系统公告模块、重命名为"数据总览"、清理 mock 数据
- **Agent 端菜单补全**：AI 创作工厂、内容中心、用量统计、API 管理菜单全部激活
- 添加 no-cache 响应头防止浏览器缓存旧 HTML
- 修复 agent/ai-factory 的 FireOutlined 图标导入

---

## 一、项目是什么

智枢AI SaaS — 多租户 AI 超级应用。Monorepo 架构。
- **Web 前端**: Next.js 14 + React 18 + TypeScript + Ant Design 6 + Tailwind CSS (`web/`)
- **后端 API**: Express 4 + TypeScript + Prisma ORM + MySQL (`server/`)
- **移动端**: Expo SDK 52 + React Native 0.76 (`apk/`)
- **共享类型**: TypeScript (`shared/`)
- **部署**: 腾讯云 CVM 香港 150.109.60.130，Ubuntu 22.04，数据库 TDSQL-C MySQL 172.19.0.13:3306
- **GitHub**: https://github.com/baizhiji/zhishuai

## 二、业务上下文（AI 业务判断力底座）

### 2.1 我们是做什么生意的

智枢AI 是上海百智网络科技有限公司旗下的 **"中小企业AI增长工具箱"** SaaS 平台。核心价值主张：让不会写、不会拍、不会剪辑、不会表演的人也能拥有专业级内容生产力，同时用AI自动化解决招聘和获客两大经营刚需。产品围绕四条核心业务线按优先级排列：

1. **AI创作工厂**（第一优先级，流量入口）：解决客户"不会写、不会拍、不会剪、不会表演"的根本痛点。AI生成文本、图文、各种短视频、数字人/真人出镜短视频，后续扩展AI漫剧和AI短剧。这是用户获取价值的第一个触点——先帮客户把内容做出来。

2. **智能招聘**（第二优先级，效率工具）：全自动AI猎头。只要客户输入招聘条件，系统自动搜索符合条件的应聘人员，自动打招呼、持续沟通（除非对方明确拒绝），直到邀请对方发送联系方式或前来面试。不只是"简历筛选"，而是从搜索→沟通→邀约的全自动化招聘机器人。

3. **智能获客**（第三优先级，增长引擎）：全平台潜客采集与自动引流。覆盖抖音、快手、小红书、B站等主流平台（目标全平台），支持直播间采集意向客户、碰一碰商家爆店、天眼查企业获客、高德地图商家获客。根据用户设定的行业和距离精准搜索潜在客户（在各平台留言、询问、咨询的人），自动根据其留言内容进行沟通引流，发送用户自定义的企业微信二维码。

4. **推荐分享**（第四优先级，裂变增长）：将客户发布的短视频生成专属二维码，其他人扫码即可一键转发到各平台，追踪推荐效果，实现用户裂变增长。含转介绍功能（在"我的"里通过二维码形式推荐下载智枢AI APK）。

所有 AI 内容生成能力依赖第三方 API（阿里云百炼为主力、火山引擎为备用），自身不训练模型，做的是"模型编排和业务封装"这一层价值。

### 2.2 怎么赚钱

采用 **SaaS 订阅制 + 代理分销** 模式。三套定价方案：免费版 ¥0/月（1 个自媒体账号、10 次/天 AI 生成、1GB 存储）、专业版 ¥299/月（5 个账号、无限 AI 生成、50GB 存储、含招聘+获客，主推）、企业版 ¥999/月（无限账号、500GB 存储、全功能、自定义贴牌、私有化部署可选），年付 8 折。支付支持支付宝和微信支付。Agent（代理商）通过管理名下客户赚取分成，分成比例由 Admin 设定——但分成结算系统尚未实现（`settlement.ts.disabled`），目前 Agent 更多是渠道管理角色而非真正的分润角色。客户计费字段 `fee`/`totalPaid`/`monthlyPaid`/`expireAt` 已在 User 表中定义，但完整计费闭环也未完全实现。

### 2.3 目标客户是谁

五类核心用户群体，按需求强度排序：

1. **想做自媒体但不会写、不会拍、不会剪辑的人**——AI创作工厂是他们从0到1的起点，平台帮他们跨越内容生产门槛。
2. **做自媒体矩阵但内容产出不够的人**——已有账号但产能瓶颈，需要AI批量生产内容维持矩阵活跃度。
3. **想真人出镜但不会表演的人**——数字人/真人出镜短视频解决出镜恐惧，降低内容创作的心理门槛。
4. **中小企业/实体店**——招聘和获客是日常经营的两大刚需，智能招聘+智能获客直接对ROI负责。
5. **招聘需求大的企业或个体**——智能招聘的自动化猎头能力替代重复性沟通工作，大幅降低招聘人力成本。

这些客户有一个共同特征：有增长意愿但缺乏专业能力（内容创作能力、招聘筛选能力、获客引流能力）。智枢AI的价值就是把这些专业能力"AI工业化"，让普通人也能低成本获取。客户自己配置 AI API Key（阿里云百炼/火山引擎），平台不代理 AI 调用成本，降低了平台侧的运营风险。

### 2.4 竞争定位与差异化

智枢AI 不是通用型AI SaaS，而是**聚焦"中小微实体AI增长"的垂直一体化工具**。竞争壁垒来自三个维度：

1. **内容生产全品类覆盖**：从文本→图文→短视频→数字人出镜→AI漫剧/短剧，一条产线覆盖所有主流内容形态，而不是单点工具。竞品如剪映/CapCut 解决的是"已有素材怎么剪"，智枢解决的是"没有素材也能出内容"。
2. **浏览器自动化作为技术地基**：通过 Playwright 实现自媒体平台的扫码授权登录、内容自动发布、招聘平台的自动操作、获客的自动采集。这是区分于纯 API 调用型 AI SaaS 的关键能力（目前这项能力仍是待开发状态，属于最高优先级技术债务）。
3. **"内容→招聘→获客→裂变"的增长闭环**：不是四个独立工具，而是为同一批客户的同一条增长路径服务——先帮他们产出内容（AI创作工厂）→再帮他们找到人才扩大产能（智能招聘）→最后帮他们把产品卖出去（智能获客）→再通过裂变放大效果（推荐分享）。

产品设计为"可售卖的商品化产品"：功能开关控制不同客户的菜单显隐（Agent 为名下客户按模块开关），贴牌定制支持（仅 Admin 可操作 APP 名称/LOGO/主题色）。移动端（APK）+ Web 端双端覆盖，APK 面向日常高频操作，Web 后台面向复杂配置。

### 2.5 产品优先级逻辑

业务线优先级排序：**AI创作工厂 > 智能招聘 > 智能获客 > 推荐分享 > CRM > (预留)电商**。判断逻辑：

- **AI创作工厂是第一入口**：目标客户的第一痛点就是"不会做内容"。内容能力是流量源头，没有内容就没有后续的招聘需求和获客需求。必须先把AI创作工厂做扎实，让客户感受到"我确实能帮他们产出内容"，才有信任基础推后续模块。
- **智能招聘解决用人刚需**：中小实体店和中小企业的用人需求是高频刚需。自动化猎头能力带来的效率提升可以直观量化（节省多少沟通时间/带来多少面试），是第二个价值锚点。
- **智能获客直接创造收入**：获客是终极变现工具。当客户有了内容能力（创作工厂）和团队能力（招聘），最关心的就是怎么把产品/服务卖出去。全平台获客引擎对接的是客户的收入增长，是最有说服力的续费理由。
- **推荐分享做裂变放大器**：把已有客户的短视频变成传播节点，实现用户增长的正循环。

做技术决策时，优先保障AI创作工厂和智能获客两条核心业务线的稳定性和体验。CRM 和电商属于增值模块，根据核心业务线成熟后再推进。

### 2.6 当前业务阶段与关键指标

项目处于 **MVP 后期到产品化早期** 的过渡阶段（启动约 3.5 个月，535+ 提交）。AI创作工厂的前端UI和内容分类体系已基本搭建完成，智能招聘和智能获客的页面框架也已存在，但四个核心业务线的后端真实 AI API 对接、浏览器自动化、支付闭环、分成结算等关键后端能力大部分仍处于 mock 或未实现状态。需要关注的业务健康指标：AI创作工厂的内容产出量、智能招聘的自动沟通转化率、智能获客的线索采集量和引流转化率、推荐分享的裂变系数。当前系统有测试账号（admin/agent/customer 各一个），但尚无真实付费客户。

### 2.7 业务决策辅助规则

做技术决策时，AI 应该同步考虑以下业务维度：（1）这个功能是否直接服务于"AI创作工厂 > 智能招聘 > 智能获客 > 推荐分享"这四条核心业务线？（2）AI创作工厂的新内容品类是否遵循"文本→图文→短视频→数字人→漫剧/短剧"这条从易到难的扩展路径？（3）智能获客的新平台接入是否覆盖了用户的核心获客场景（抖音/快手/小红书/B站优先，其他平台逐步扩展）？（4）是否需要客户自己配置 API Key？如果是，交互上要引导客户完成配置而不是静默失败。（5）是否涉及计费/分润逻辑？如果是，需确认结算系统是否已实现再动手。（6）是否会增加 Agent 的管理负担？Agent 的核心价值是"管理名下客户"，不要让其承担 Admin 的职责。（7）这个功能是"演示价值"还是"生产价值"？当前阶段应优先完成从演示到生产的跃迁，把 mock 数据替换为真实后端服务，特别是AI创作工厂的内容生成链路。

---

## 三、三种角色

| 角色 | 说明 | 测试账号 |
|------|------|---------|
| admin | 平台管理员 | 18601655222 / 123456 |
| agent | 代理商 | 13900000099 / 123456 |
| customer | 客户 | 13800000001 / 123456 |

## 四、模块清单（用户可见）

### 客户端 (customer/) — 17个模块
- **dashboard** — 客户仪表盘（最近重设计完成）
- **ai-chat** — AI 对话引擎（核心模块，已完成）
- **ai-factory** — AI 创作工厂（含图片/文案/短视频/萌宠卡通/数字人）
- **acquisition** — 智能获客（多数据源：天眼查/高德/直播间采集）
- **recruitment** — 智能招聘（含 dashboard / auto / platforms / publish 子页）
- **digital-human** — 数字人（声音克隆 + 视频克隆）
- **crm** — CRM（客户管理 + 公海池 + 跟进记录）
- **materials** — 素材中心（ContentCategory 枚举已重构）
- **media** — 媒体中心
- **api-keys** — API 密钥管理
- **share** — 分享码（board / code / track 子页）
- **tickets** — 工单系统
- **support** — 客服支持
- **login-logs** — 登录日志
- **employees** — 员工管理
- **settings** — 账号设置
- **report** — 报表（基础存在）

### 代理商端 (agent/) — 5个模块
- **dashboard** — 代理商仪表盘
- **customers** — 客户管理
- **ai-factory** — AI 创作工厂（2026-08-02 补全菜单）
- **content-center** — 内容中心
- **usage** — 用量统计
- **api-keys** — API 管理

### 管理员端 (admin/) — 10个模块（2026-07-31 重构）
- **overview** — 数据总览（合并原 dashboard/statistics）
- **customers** — 客户管理 + 代理商管理（已合并）
- **api-providers** — API 服务商（新增）
- **announcements** — 系统公告（新增）
- **branding** — 品牌定制
- **features** — 功能管理
- **logs** — 系统日志
- **sms** — 短信管理（代码存在 `.disabled`）
- **settlement** — 结算管理（代码存在 `.disabled`）
- **version** — 版本管理（代码存在 `.disabled`）

## 五、后端路由状态

活跃路由（45+个）：auth, account, admin-dashboard, admin-agents, admin-api-providers, admin-branding, admin-features, admin-logs, agent, ai, ai-chat, ai-config, ai-enhanced, ai-workflow, ai-enhanced, announcements, acquisition, auto-reply, content-publish, crm, crm-advanced, dashboard-stats, data-acquisition, digital-human, employee, enhancement, export, feedback, hot-topics, hotspot, materials, matrix, media, multimodal, notification, notifications, oauth, publish, recruitment, referral, share, social-account, support, ticket, token-stats, user-features, voice-clone

停用路由（`.disabled`）：report, settlement, sms, statistics, version

## 六、最近两周重要变更

1. **2026-08-03 Agent端剩余问题全部修复**：
   - **Tickets 页面 Mock 数据 → 真实 API**：接入 TicketAPI，完整 CRUD + 状态流转（接单/标记已解决/关闭）+ 沟通时间线 + SLA 超时警告 + 内部备注
   - **Dashboard 时间范围筛选**：新增 Segmented 控件（今日/本周/本月/全部），后端 statistics 接口支持 `period` 查询参数，动态返回 `periodNewCustomers` 和 `periodNewTickets`
   - **通知中心 Badge**：layout.tsx 顶部铃铛改为 Ant Design Badge 组件，实时显示待处理工单数（60秒轮询）；Popover 内用 Tabs 分"待处理工单"和"系统公告"两个面板，点击可跳转工单列表
   - **Agent PageContainer 共享组件**：创建 `web/components/agent/PageContainer.tsx`，提供面包屑、骨架屏（table/card/detail）、空状态统一包裹，未来 Agent 页面可逐步迁移
   - **后端 statistics 增强**：支持 period 参数，返回 periodNewCustomers/periodNewTickets
2. **2026-08-03 Agent端侧边栏补全 + 设计增强**：
   - 修复 Navbar.tsx `message` 变量未定义 bug（原只有 `modal` 解构，但 `handleLogout` 中使用了 `message`）
   - 侧边栏补全 6 个缺失入口：AI创作工厂、素材中心、API管理、客户获客、客户招聘、客户分享
   - 侧边栏结构重组：业务管理 | 内容生产 | 商业变现 | 工单与服务 | 系统设置（含新增"个人资料"和"通知设置"子菜单）
   - 新增 settings 主页（个人资料查看/编辑 + 头像展示 + 账户安全快捷入口）
   - 新增 settings/notification 页（工单/结算/客户/用量 6 种通知开关）
   - settlement 页面 fetch → request 库迁移 + 正确类型 + 骨架屏/空状态 + 银行账号格式校验
   - acquisition/recruitment/share 三个 mock 数据页面 → 接入真实 API + 搜索筛选 + 统计卡片 + 骨架屏/空状态
2. **2026-08-03 Customer端PageContainer全面包裹** — **22个Customer页面全部使用PageContainer共享组件**：
   - 创建 `web/components/customer/PageContainer.tsx` 共享组件（面包屑导航 + 骨架屏加载 + 空状态 + 页面标题/描述）
   - P0：删除两套重复 Tabs 版本页面（acquisition/page.tsx、share/page.tsx）
   - P1：全部22个页面统一应用 PageContainer + 面包屑导航 + 骨架屏（table/card/detail三种类型）
   - P2：各页面设计增强——tickets(列排序+SLA超时标签)、interview(AI评分进度条)、login-logs(异常登录Alert)、api-keys(使用统计卡片+Key遮罩)、support(客服二维码+三步指引)、settings(左侧Tab布局+导航卡片)、security(安全状态指示器)、app-download(二维码+版本信息)、acquisition/board(CSS柱状图)、share/board(CSS柱状图)
2. **2026-08-03 P0+P1+P2** — **业务对齐三轮修复完成**：
   - P0：砍掉"自媒体运营"旧概念，AI创作工厂升级为唯一内容生产入口；Customer Web菜单重排序；APK底部Tab "AI助手"→"AI创作"；全量清除"自媒体运营"引用，统一命名"招聘助手"→"智能招聘"
   - P1：Agent端补全"客户招聘/客户获客/客户分享"三个业务入口页面
   - P2：数据库Schema清理（CRM/AI对话/工单/客服标记为预留模块）；分享推荐增强（新增ShareEffect + ShareCommission模型 + 效果追踪/佣金结算API）；Playwright浏览器自动化桥接路由（自动发布/自动沟通/自动采集三个能力）；Customer+Agent Dashboard重定向为四条业务线视角（AI创作工厂/智能招聘/智能获客/推荐分享）
2. **2026-08-02** — agent端菜单补全（AI创作工厂/内容中心/用量统计/API管理），加 no-cache 响应头
3. **2026-07-31** — admin端重构：合并客户管理/代理商管理，删除冗余页面，新增API服务商/系统公告

## 六-B、需求来源与模块建造顺序

| 顺序 | 时间 | 模块/功能 | 背景/原因 |
|------|------|----------|----------|
| 1 | 04-25 | 客户管理、电商、系统设置 | 初始需求，SaaS 平台基础功能 |
| 2 | 04-25 | 全局导航栏（8板块） | 用户需要在板块间导航 |
| 3 | 04-27 | 用户认证、支付、数据对接 | 需求重构后的核心能力 |
| 4 | 04-28 | 内容工厂（AI生成） | 自媒体运营是核心业务 |
| 5 | 04-28 | 发布中心、矩阵管理 | 内容创作后需要多平台分发 |
| 6 | 04-29 | 批量定时发布、数字人仓库 | 提升发布效率，拓展AI能力品类 |
| 7 | 06-01 | 角色登录控制、API Key管理 | 生产化：不同角色不同入口 |
| 8 | 06-02 | 社交账号管理、平台适配器 | 对接视频号/知乎/百家号/头条/智联 |
| 9 | 06-04 | AI四轮优化（提示词/思维链/多模态/数字人） | AI 能力深度增强 |
| 10 | 06-05 | CRM、记忆系统建立 | 客户管理深化 + 项目规范化 |
| 11 | 06-08 | 获客多数据源、分享码、数字人克隆 | 获客能力拓展 + 裂变工具 |
| 12 | 06-09 | CRM自动化、天眼查/高德对接、直播间采集 | 外部数据源集成 + 自动化 |
| 13 | 07-24 | 仪表盘重设计、萌宠卡通、认证修复 | 数据可视化 + 内容品类扩充 |
| 14 | 08-02 | Admin重构、Agent菜单补全 | 管理端精简 + 代理商端完善 |

### 预留/暂停的模块

| 模块 | 状态 | 原因 |
|------|------|------|
| 电商板块 | 预留（06-05） | 优先级调整，自媒体运营优先 |
| 短信服务 | 代码存在但 .disabled | 未配置短信服务商 |
| 结算系统 | 代码存在但 .disabled | 分成逻辑未实现 |
| 报表系统 | 代码存在但 .disabled | 功能不完善 |
| 版本管理 | 代码存在但 .disabled | 未开始 |

## 六-C、关键架构决策与方向转折

1. **技术栈选型（04-25）**：Next.js 14 + Express + Prisma + MySQL。Next.js 的 SSR 能力适合 SaaS 对 SEO 的要求；Express 比 NestJS 更轻量适合快速迭代；Prisma 提供类型安全的 ORM；MySQL 作为关系型数据库适合业务系统。

2. **第一次方向转折（04-27）**："根据新需求重构智枢AI系统"。这次重构将项目从初版功能集转向了新的产品方向——自媒体运营成为核心业务线。用户认证、数据对接、支付体系在这一轮建立。

3. **三角色权限模型（06-01）**：确定了 admin（平台管理员）/ agent（代理商）/ customer（客户）三角色权限体系。每个角色只能从对应入口登录，这是多租户 SaaS 的核心架构决策。

4. **电商板块降级（06-05）**：电商板块（详情页生成、多店铺管理、自动上架）从核心功能降级为预留功能，因为业务优先级调整——自媒体运营和智能招聘被确认为核心业务线。

5. **Hydration 问题处理模式（06-05 确立）**：所有使用 localStorage 的组件必须添加 `mounted` 状态检查，避免 SSR/CSR 状态不一致。这成为后续所有 Navbar/Layout 改动的铁律。

6. **内容品类扩展路径**：从最初的 6 分类 → 9 分类 → 最终包含萌宠卡通、数字人等更多 AI 生成品类，反映了产品从单一图文生成向全品类 AI 内容工厂的演进思路。

7. **Admin 端精简（08-02）**：合并客户管理和代理商管理为一个统一视图，删除冗余页面，新增 API 服务商和系统公告——这是从"功能堆砌"转向"运营管理"的信号。

8. **项目定位重大修正（08-03）**：创始人亲自澄清了项目的原始构想，纠正了之前AI自行推测的错误理解。核心修正包括：(a) 目标客户不是泛化的"中小企业"，而是精准的五类人群——不会写拍剪的人、内容产能不足的矩阵运营者、不会表演的人、中小企业实体店、招聘需求大的个体；(b) 四条业务线更正为 AI创作工厂 > 智能招聘 > 智能获客 > 推荐分享，它们不是并列关系而是"内容→招聘→获客→裂变"的增长闭环；(c) AI创作工厂不是"自媒体运营工具"，而是针对"不会做内容的人"的AI内容工业化产线——从文本到图文到短视频到数字人到漫剧/短剧，按从易到难逐步扩展。这次修正从根本上改变了产品的定位逻辑和开发优先级。此前AI对所有业务判断都基于错误的产品理解，现在应以此为准重新审视所有技术决策。

## 七、已知问题 / 技术债务

| 优先级 | 问题 | 说明 |
|--------|------|------|
| 🔴 高 | AI API 未配置 | 当前返回 mock 数据，需配置真实模型 |
| 🔴 高 | 短信服务未启用 | 代码存在但 `sms.ts.disabled` |
| 🟡 中 | 结算系统未完成 | `settlement.ts.disabled`，分成逻辑未实现 |
| 🟡 中 | 报表系统未完善 | `report.ts.disabled` |
| 🟡 中 | Hydration 敏感 | Navbar/Layout 组件改动需谨慎处理 SSR/CSR 差异 |
| 🟡 中 | 数据库 ApiKey 表 | 需要 Prisma 迁移确认 |
| 🟢 低 | 移动端 App | 基本完成但未深度测试 |
| 🟢 低 | 单元测试缺失 | 全项目无测试覆盖 |

## 八、当前 Git 未提交变更

```
modified: docs/SESSION_MEMORY.md（P0+P1+P2三轮变更）
modified: web/app/customer/dashboard/page.tsx（P2:四条业务线KPI+详情卡片）
modified: web/app/agent/dashboard/page.tsx（P2:客户业务线概览）
modified: web/app/customer/layout/Navbar.tsx（P0:菜单重排序）
modified: web/app/agent/layout/Navbar.tsx（P1:补全客户招聘/获客/分享三个入口）
modified: web/app/admin/tenants/page.tsx（P0:命名更新）
modified: web/app/about/page.tsx, features/page.tsx, pricing/page.tsx, help/page.tsx
modified: web/app/account/page.tsx, /recharge/page.tsx, /subscribe/page.tsx
modified: web/lib/permissions.ts, permissions/index.ts
modified: web/services/ticket.ts, stores/navigationStore.ts
modified: server/prisma/schema.prisma（P2:预留模块标记+ShareEffect/ShareCommission新模型）
modified: server/src/routes/share.ts（P2:效果追踪/佣金结算/发布记录API）
modified: server/src/routes/dashboard-stats.ts（P2:business-lines + agent/business-lines端点）
modified: server/src/routes/statistics.ts, admin-features.ts（P0:命名更新）
modified: server/src/index.ts（P2:playwright-bridge路由注册）
modified: apk/src/navigation/AppNavigator.tsx, apk/src/constants/index.ts, apk/src/services/*.ts, apk/src/screens/*.tsx, apk/src/components/PageHeader.tsx（P0:APK全量清理）
new: server/src/routes/playwright-bridge.ts（P2:Playwright桥接路由）
new: server/src/services/dashboard-business-lines.ts（P2:业务线聚合服务）
new: web/app/agent/recruitment/page.tsx, /acquisition/page.tsx, /share/page.tsx（P1:Agent业务入口）
```

## 九、部署与验证

- **部署方式**: scp 上传 → pm2 restart → 验证脚本
- **验证脚本**: `bash scripts/verify-login.sh`（三种角色登录返回 200）
- **Web 进程**: `pm2 restart zhishuai-web`
- **API 进程**: `pm2 restart zhishuai-api`
- **构建**: Web: `npx next build`，Server: `npm run build`（如有）

## 十、关键文件路径

| 用途 | 路径 |
|------|------|
| Prisma Schema | `server/prisma/schema.prisma` |
| 前端路由 | `web/app/` 下各目录的 `page.tsx` |
| 后端路由 | `server/src/routes/*.ts` |
| 权限配置 | `web/lib/permissions/config.ts` |
| 认证上下文 | `web/contexts/AuthContext.tsx` |
| API 适配器 | `web/services/api.ts` |
| 请求工具 | `web/utils/request.ts` |
| 环境配置 | `web/.env.local`（本地）、`server/.env`（服务端） |
| 部署脚本 | `scripts/` 目录 |
| Nginx 配置 | `deploy/` 目录 |

## 十一、每次开发后的检查清单

> 开发完成后，AI 应自动更新本文件中的相关部分，特别是：
> - "最近两周重要变更"（添加新条目）
> - "已知问题"（新建/关闭/更新状态）
> - "当前 Git 未提交变更"（开发前记录，提交后清除）
> - "最后更新"日期

## 十二、AI 启动流程（每次新会话必须执行）

```
1. cat docs/SESSION_MEMORY.md    ← 读取本文件获取全貌
2. git log --oneline -20         ← 查看最近提交
3. git status                    ← 查看未提交变更
4. cat docs/ISSUES.md            ← 查看已知问题
```
