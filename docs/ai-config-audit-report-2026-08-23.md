# 智枢AI 电脑端 AI 模型配置与功能交付核查报告

**核查日期**：2026-08-23
**核查范围**：desktop-ui 全部 AI 模型配置、AI 创作工厂设计逻辑、四大功能模块交付完整度
**核查方法**：3 个子代理并行深度调研 + 核心文件逐行交叉验证（factory-service.ts / category-config.ts / anti-ai-flavor.ts / page.tsx / server 路由 / prisma schema）

---

## 一、结论摘要

1. **模型服务商配置正确**：三家综合服务商（腾讯云 TokenHub、阿里云百炼、火山方舟）全部配置且均有真实 API 调用实现，符合既定设计。
2. **六项设计逻辑"配置层"达标，但"执行层"严重打折**：五层流水线、爆款创意注入、反 AI 化、质量评审均只配置在 `category-config.ts` 中，页面实际调用走**单模型直连**（仅智能剪辑类目走完整流水线）；**违禁词零逃逸完全未实现**。
3. **四大功能模块**：推荐分享可真实交付；AI 创作工厂、智能招聘、智能获客均存在"能跑但交付打折"的问题（详见第四节）。

---

## 二、AI 模型配置核查（配置层）

### 2.1 三家综合服务商配置齐全

`desktop-ui/lib/ai/category-config.ts` 的 `PROVIDER_INFO`（L36-76）完整定义三家服务商：

| Provider | 平台 | API 基址 | 能力覆盖 | 调用实现 |
|---|---|---|---|---|
| tencent | 腾讯云 TokenHub | tokenhub.tencentmaas.com | 文本/图片/视频(submit+poll)/数字人 | callChatAPI / callImageAPI / callVideoAPI 均实现 |
| alibaba | 阿里云百炼 | dashscope.aliyuncs.com | 文本/图片(异步+同步)/视频/TTS/视频编辑 | callChatAPI / callImageAPI / callVideoAPI / tts_generate / callVideoEdit 均实现 |
| volcano | 火山方舟 | ark.cn-beijing.volces.com | 文本/图片/视频(OpenAI兼容) | callChatAPI / callImageAPI / callVideoAPI 均实现 |

`MODEL_INFO`（L98-460）注册 40+ 模型，覆盖文本（DeepSeek V4 Pro、Qwen 3.7/3.8 Max、Kimi K3、Doubao Seed 2.1 等）、图像（混元 Image 3.0、千问图像、WAN、Z-Image、Seedream 5.0 等）、视频（可灵 KLING 3.0、混元视频、Vidu、HappyHorse、Seedance 2.5 等）、TTS（千问 TTS、MiniMax Speech、Seed Audio）、声音复刻、数字人、视频理解。配置随蓝皮书从 V2.1 演进至 V4.0（接入火山方舟 + 智能剪辑产线）。

### 2.2 配置层风险点

- **死模型约 20 个**：`MODEL_INFO` 注册但从未被任何类目 pipeline 引用，如 hy-image-lite、yt-video-2.0、hy-vision-2.0、vd-video-q3-turbo、qwen3.7-max、qwen-max-aly、qwen3.7-plus、qwen-image-3.0-pro、happyhorse-1.1-t2v、doubao-seed-1.6/1.6-thinking/2.0-pro/2.0-lite、doubao-seedream-4.0/5.0-lite、doubao-seededit-3.0-i2i、doubao-voice-clone-2.0、deepseek-v4-volcano、kimi-k2.7、minimax-m3 等。注册表"看起来全家桶"，实际按类目选型时大量模型闲置。
- **TTS 火山分支缺失**：`doubao-seed-audio-1.0`（volcano）被智能剪辑的 tts_generate fallback 引用，但 `executePhase` 的 tts_generate case 只有 alibaba 与 tencent 分支（factory-service.ts L674-712），火山 TTS 无真实调用，fallback 会落到纯文本占位。
- **yt-vita-1.5 名不副实**：注册为"视频理解模型"，但 clip_analysis 阶段实际走 `callChatAPI`（文本 chat 端点），并非真正的视频理解。
- **未配置 API Key 时的错误提示只提两家**（factory-service.ts L1140），未提及火山方舟。

---

## 三、六项设计逻辑"执行层"核查（核心问题）

`category-config.ts` 定义了完整的五层流水线（文案产线→反AI化→图像产线→视频产线→配音合成），11 个类目各有 8~12 个 phase（viral_analysis / outline / draft / anti_ai_rewrite / style_calibration / quality_review / compliance_check / image_generate / script_generate / video_generate / tts_generate / subtitle_generate / local_compose 等）。**但配置完整 ≠ 真实执行**：

| 设计逻辑 | 配置层 | 执行层 | 证据 |
|---|---|---|---|
| 质量优先 | quality_review + style_calibration 配置在 9 个类目 | **页面单模型路径不执行**；流水线中 quality_review 也只评审当前稿，未真正"对比初稿和改写稿" | factory-service.ts L591-601 |
| 全类目最终交付 | 11 类目 pipeline 完整（+2 个占位类目 AI短剧/AI漫剧） | **仅 smartEdit 走完整流水线**，其余类目单模型直连 | L1369-1385 vs L1087-1144 |
| 爆款创意注入 | viral_analysis 配置在 10 个类目（除 smartEdit），爆款分析结果喂给 outline | 完整流水线中真实执行；**但页面单模型路径只用其模型，不用其提示词** | L564-569 |
| 违禁词零逃逸 | compliance_check 配置在全部 11 个类目 | **完全未实现拦截**——仅调用 LLM 生成一份"合规审查报告"文本返回，不判断违规、不阻止输出、无敏感词库；单模型路径不执行 | L668-672 |
| 反 AI 化贯穿 | anti-ai-flavor.ts 完整（文字/小红书/电商/图片/视频/英文等提示词库），anti_ai_rewrite 配置 9 个类目 | 完整流水线中真实执行；**单模型路径不执行** | L584-589 |
| 五层流水线 | generateWithLocalPipeline 完整实现（含按类目 fallback 降级） | 存在但**页面未接线**——ai-factory/page.tsx 只 import 单模型函数 | L462-554, page.tsx L18 |

**根本原因**：页面（`app/customer/ai-factory/page.tsx` L218/227/240/254）实际调用的是单模型直连的 `generateText` / `generateImage` / `generateVideo`。单模型路径仅从类目配置中取**一个**模型（draft/anti_ai_rewrite/viral_analysis 或 video_generate）调用一次 API，直接返回，**不经过任何流水线逻辑**。也就是说用户在小红书图文、短视频等类目里点击生成，实际效果等同"用该类目主模型做一次普通生成"，与普通 AI 对话无本质区别。`analyzeViralTopic`（爆款分析按钮）调用的后端 `/api/content-creativity/analyze` 端点也不存在（factory-service.ts L1580），调用失败被 catch 后静默跳过。

唯一例外：**智能剪辑（smartEdit）**走 `generateWithLocalPipeline` 完整流水线，脚本→素材理解→镜头编排→调色→字幕→BGM→FFmpeg 合成→合规，是唯一真正兑现"多模型协作流水线"设计的类目。

---

## 四、四大功能模块交付核查

### ① AI 创作工厂 — 可交付，但架构特殊、2 个占位

- 页面 `app/customer/ai-factory/page.tsx`：11 个可用类目 + AI短剧/AI漫剧 2 个"敬请期待"占位卡（L119-120，点击提示开发中）。
- 生成链路：浏览器直连三家模型 API，**平台后端零参与**（API Key 存 localStorage）。
- **无任何数据落库**：生成历史与"保存到内容中心"都只写 localStorage，未调后端 `/materials`。
- 判定：生成能力真实，但与平台后端完全解耦，无法统计/审计/按量计费。

### ② 智能招聘 — 部分交付（候选人由 AI 生成，非真实平台）

- 页面/后端/落库完整：`server/src/routes/recruitment.ts` 20 个端点真实存在，Prisma 表齐全（RecruitmentPost/Candidate/CandidateSearchConfig/RecruitmentProcess 等）。
- **关键短板**：`matchCandidates` 生成的候选人是 AI 虚构数据（recruitment.service.ts L125-144 用 chatCompletion 生成），并非对接 BOSS/猎聘等平台抓取真实候选人。
- 悬空代码：`services/recruitment.ts` 定义的 `/api/recruitment/ai/*` 辅助端点后端无路由、页面未调用。

### ③ 智能获客 — 部分交付（线索由 AI 生成，非真实外部抓取）

- 页面/后端/落库完整：`server/src/routes/acquisition.ts` 22 个端点真实存在，表齐全。
- **关键短板**：`/tasks/:id/start` 仅把任务状态改为 running，**不执行采集**（L145-171）；线索来源是 `/tasks/:id/discover` → `discoverLeads` 让 AI 生成联系方式（acquisition.service.ts L178-196），虽有格式校验与"禁止编造"声明，但**无法保证手机号/邮箱真实归属**。
- 即"潜客采集引流"实现的是任务管理 + AI 生成线索 + 跟进闭环，**不是对接抖音/小红书等平台的真实数据抓取**。
- 同样存在悬空服务层（services/acquisition.ts 的 `/api/acquisition/ai/*`）。

### ④ 推荐分享 — 可真实交付（唯一完整模块）

- `server/src/routes/share.ts`（873 行）实现分享码 CRUD、扫码记录、**多级链式归因（MAX_CHAIN_DEPTH=3）**、链式佣金分发、效果追踪等 15+ 端点，全部真实落库。
- 判定：四大模块中唯一"分享海报/邀请链接/裂变奖励"最初设计几乎全部落地的模块。
- 小瑕疵：看板"独立访客"用活跃码数量近似、趋势为估算值（share.ts L501/509-517）。

### 汇总

| 模块 | 页面 | 后端 | 落库 | AI/模型 | 判定 |
|---|---|---|---|---|---|
| AI创作工厂 | 完整(11+2占位) | 未对接(浏览器直连) | 无(localStorage) | 直连三家 | 可交付，但无平台闭环 |
| 智能招聘 | 完整 | 真实(20端点) | 有 | 后端AI生成候选人 | 部分交付(数据非真实) |
| 智能获客 | 完整 | 真实(22端点) | 有 | 后端AI生成线索 | 部分交付(非真实采集) |
| 推荐分享 | 完整 | 真实(15+端点) | 有 | 无 | **完整交付** |

---

## 五、问题清单与修复优先级

**P0（设计承诺未兑现）**
1. 违禁词零逃逸完全缺失：compliance_check 只是生成合规报告文本，无拦截/过滤执行逻辑。
2. 页面类目全部走单模型直连，五层流水线/爆款注入/反AI化/质量评审仅在 smartEdit 真正执行——"多模型协作流水线"设计对用户端基本空转。
3. 爆款分析按钮后端端点 `/api/content-creativity/analyze` 不存在，点击静默失败。

**P1（交付打折）**
4. 获客/招聘的"数据来源"为 AI 生成而非真实平台采集/抓取，与"潜客采集引流/自动猎头"命名不符。
5. AI 工厂生成内容无平台后端参与、无落库。
6. TTS 火山方舟分支缺失（doubao-seed-audio-1.0 无法真实调用）。
7. 约 20 个注册模型闲置，注册表与类目实际选型脱节。

**P2（体验/一致性问题）**
8. AI短剧/AI漫剧为占位卡；9. 未配置 Key 的提示未提及火山方舟；10. 招聘/获客服务层存在悬空 `/ai/*` 端点；11. share 看板部分统计为估算值。

---

## 六、结论

模型配置**设计层完全符合**"三家综合服务商 + 质量优先/全类目/爆款注入/反AI化"的既定蓝皮书逻辑，且三家均有真实 API 实现；但**执行层存在显著落差**：用户实际触发的类目生成多为单模型直连，多阶段流水线（除智能剪辑外）与爆款分析、反 AI 化、质量评审逻辑空转，违禁词零逃逸未实现。四大功能模块中推荐分享可完整交付，AI 创作工厂可交付但无平台闭环，智能招聘与智能获客的"数据真实性"与命名存在差距。
