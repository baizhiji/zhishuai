# 智枢AI 内容生成系统 整体诊断与修复方案

**诊断日期：2026-08-31**
**诊断范围：电脑端（desktop-ui）+ 手机端（apk）全部内容生成功能**
**性质：全系统整体诊断（非单一功能问题），含代码证据链、外部平台事实核查、分层根因、分阶段修复方案**

---

## 一、执行摘要

智枢AI 的内容生成问题不是"图片水印"或"电脑端报错"等单一问题，而是**整个内容生成体系存在系统性缺陷**：桌面端与手机端的生成链路分裂（桌面端视频/数字人/流水线仍前端直连第三方平台，手机端走服务端代理）、所有生成强依赖用户自配 API Key 且无平台兜底、视频模型候选列表中的模型名与平台官方现状不符（部分已过时/不存在）、以及 AIGC 标识策略未实现"只保留【智枢AI生成】"的要求。修复必须按"统一后端代理 → 修正模型路由 → 统一水印策略 → 上收真实感词库"四个阶段整体推进，并在最后按"两端 × 全部类目"的矩阵逐项验收。

---

## 二、系统现状全景（代码证据）

### 2.1 生成能力分布

| 功能 | 后端能力 | 桌面端调用链路 | 手机端调用链路 | 关键依赖 |
|---|---|---|---|---|
| 文本类（小红书/电商详情/脚本/文案/标题/标签/内容策划） | `ai-client.chat` / `ai-enhanced(/title,/script,/hashtags,/post)` | 先本地流水线，回退 `generateText → /api/ai-chat/chat` | `/ai-enhanced/post` 等（全后端代理） | 任一平台 Key |
| 图片生成 | `ai-client.generateImage`（火山 Seedream 5.0 → 腾讯 HY-Image → 阿里 wan2.7） | 先本地流水线，回退 `generateImage → /api/ai-chat/image` | `/api/ai-chat/image` | 任一平台 Key |
| 视频类（短视频/企业/产品/探店/MV/萌宠） | `ai-client.generateVideo`（可灵→混元→Seedance→Wan） | `generateVideo → 前端直连 callVideoAPI`（浏览器直连第三方） | `/ai-enhanced/video` | 视频模型可用 Key |
| 智能剪辑 | `/video-edit/compose`（服务端 FFmpeg） | 有素材→服务端成片；无素材→本地流水线 | 有素材→服务端成片 | 用户上传素材 |
| 数字人 | `generateVideo` 内 `yt-video-humanactor` + TTS | 前端直连（需阿里 Key 合成 qwen-tts 配音） | `/ai-enhanced/video` | 形象图 + TTS Key |

### 2.2 关键代码证据

1. **后端明确"不使用系统兜底 Key"**：`server/src/services/ai-client.ts:345-373` 的 `resolveApiCredentials` 注释与实现均为"客户必须自行配置 API Key，不使用系统兜底 Key"，按 tencent→alibaba→volcano 顺序只读用户自己保存的 Key，全部为空时抛错"没有可用的 API 密钥"。
2. **桌面端与手机端链路分裂**：
   - 桌面端视频/数字人/多阶段流水线（`generateWithLocalPipeline` → `executePhase`）全部**前端直连**，Key 来自 `getEffectiveApiKeys()`（先从 `/api/ai-config/keys?raw=1` 同步到 localStorage，再读 localStorage）。浏览器直连阿里 dashscope / 腾讯 TokenHub / 火山 ark 存在 CORS 限制。
   - 手机端文本、图片、视频全部走服务端代理，Key 由后端 `resolveApiCredentials` 统一解析。
3. **桌面端主流程先跑本地流水线**：`desktop-ui/app/customer/ai-factory/page.tsx:279-343`，流水线无可用产出时才回退单次直连；而视频回退仍是 `generateVideo`（前端直连）。
4. **视频模型候选列表存疑**：`ai-client.ts:188-193` 中 `doubao-seedance-2-5-pro-260628` 与 `wan2.7`（作视频模型名）经外部核查与平台官方现状不符（官方为 `doubao-seedance-2-0` 系列、`wan2.7-t2v` 系列）。
5. **图片水印未做关闭处理**：后端图片调用火山/腾讯时未传水印参数；经外部核查，火山支持 `watermark: false` 关闭，阿里 wan 默认 `watermark: false` 无水印，腾讯仅支持 `footnote` 自定义水印文字（≤16 字符）且不提供关闭 AI 标识的参数。
6. **"HY-Image-V3.0 2026-09-15 下线"注释不准确**：腾讯官方下线公告（公告2405）中停止新购的是旧版混元生图-1.0 等（2026-09-01 停止新购、2026-09-30 终止），HY-Image-3.0 反而是推荐替代模型；当前代码中的模型名 `HY-Image-V3.0` 与官方 `hy-image-v3` 命名不一致，需实测。
7. **图片真实感词库只在桌面端生效**：`desktop-ui/lib/ai/anti-ai-flavor.ts`（真人皮肤纹理/摄影参数/负向排除塑料感）仅桌面端本地流水线使用，服务端 `/api/ai-chat/image` 与手机端均未接入。

### 2.3 已确认 / 已修改 / 已删除 的内容（不能遗漏）

- **已确认**：AIGC 标识只保留【智枢AI生成】；图片真实感要求（蓝皮书词库）；电脑端与手机端所有功能都需能产出内容。
- **已修改（未提交）**：`page.tsx` 敏感词扩充（色情正则增加"性行为/性交易"）；`aliyun.ts` 与 `factory-service.ts` 尺寸格式统一（`1024*1024`→`1024x1024`、`1280*720`→`1280x720`）；`ai-client.ts` 图片生成失败日志增强（带 HTTP status + response data，便于排查）。
- **已删除/已失效**：曾规划"平台兜底 Key"（PLATFORM_TENCENT/ALIBABA/VOLCANO_API_KEY）但当前 `resolveApiCredentials` 已明确不使用；在线网页版已下线；AI漫剧、AI速写为预留未上线（前后端均有 `comingSoon` 标记）。
- **外部事实**：火山 Seedream 5.0 商用可用（`watermark` 默认 true，false 可关，参数名以方舟控制台实测为准）；火山 Seedance 2.0（2026-06-22 起 API 可用）；腾讯可灵 `kling-video-v3` 系列可在 TokenHub 中国大陆调用；数字人 `yt-video-humanactor` 为有效模型（须参考照片，不可文生）；火山 OmniHuman1.5 提供"单图+音频"口播数字人备选；阿里 `wan2.7-t2v-2026-04-25` 为推荐视频模型。

---

## 三、根因分析（分层归因）

**根因 A（系统级）— 所有生成强依赖用户自配 Key，且无兜底**：文本/图片只要有任一平台 Key 即可出（多 provider 依次尝试），但视频类需要"视频模型可用"的 Key、数字人还需形象图 + TTS Key。这是"手机端部分功能可生成"（文本+图片可，视频类不可）与"电脑端整体不可用"（若未同步/未配置视频 Key）的共同底层原因。

**根因 B（桌面端特有）— 视频/数字人/流水线前端直连**：浏览器直连第三方平台受 CORS 限制、依赖 localStorage Key 同步时机（`syncApiKeysFromServer` 仅页面加载触发一次）、多阶段流水线任一阶段失败即连锁失败。手机端无此问题（全后端代理），这正是两端表现不一致的结构性原因。

**根因 C（模型路由）— 候选模型名与平台现状脱节**：`doubao-seedance-2-5-pro-260628`、`wan2.7`（视频）、`HY-Image-V3.0` 等模型名需逐项实测修正，否则对应平台路径必然失败，且失败后无清晰错误提示（日志虽已增强但前端提示仍是通用文案）。

**根因 D（水印，用户所见表象）— 未实施统一 AIGC 标识策略**：图片走火山（默认带"AI生成"水印）或腾讯（带水印）时水印即出现；阿里默认无水印。符合"只保留【智枢AI生成】"的方案应统一为：平台关水印/自定义水印 → 服务端像素级叠加【智枢AI生成】。

**根因 E（真实感）— 词库未上收服务端**：手机端与服务端生成未接入 `anti-ai-flavor` 词库，故手机端图片"太假"。

---

## 四、修复方案（分四阶段，整体推进）

### 阶段 1：统一后端代理（结构性改造，两端受益）
- 新增/复用后端视频生成路由（已有 `/ai-enhanced/video`，可直接复用），**桌面端 `generateVideo` 改为调用后端代理**，与手机端一致；删除桌面端浏览器直连的 `callVideoAPI` 分支（数字人 TTS 同步改为后端 `textToSpeech`）。
- 桌面端本地流水线 `generateWithLocalPipeline` 保持文本阶段可本地执行，但视频/图片/TTS 阶段全部改走后端；无法走通的场景直接短路到后端代理，避免"流水线失败→回退→仍直连"的空转。
- 两端共用 `resolveApiCredentials`，并完善未配置 Key 时的前端引导文案（明确指出缺哪个平台 Key）。

### 阶段 2：修正模型路由（与平台官方现状对齐 + 实测）
- 逐项实测并修正 `VIDEO_MODEL_CANDIDATES`：火山改用官方可用型号（`doubao-seedance-2-0` 系列实测）、阿里视频改用 `wan2.7-t2v`（或 `wan2.7-t2v-2026-04-25`）、腾讯 `hy-image-v3` 命名实测。
- 图片路由按蓝皮书升级：优先 `qwen-image-3.0-pro`（可开 `thinking_mode` 提升真实感）、`wan2.7-image-pro`。
- 数字人：`yt-video-humanactor` 保底，火山 OmniHuman1.5 作备选；TTS 用阿里 `qwen-tts`（未配阿里 Key 时给出明确提示）。

### 阶段 3：统一水印策略（只保留【智枢AI生成】）
- 阿里 wan：`watermark: false`（默认即无水印）；火山 Seedream：`watermark: false`（实测确认参数名）；腾讯图片/视频：`footnote: 智枢AI生成`（≤16 字符，合规且满足"只保留【智枢AI生成】"）。
- 服务端引入 sharp（或 ffmpeg 用于视频）在图片/视频上叠加像素级"智枢AI生成"角标，保证下载文件本身带标识，隐式元数据标识（平台默认写入）保留。
- 桌面端 `aliyun.ts` 直连 wan 时同步补 `watermark: false`。

### 阶段 4：真实感词库上收服务端
- 将 `anti-ai-flavor.ts`（enhanceImagePrompt / buildNegativePrompt / buildVideoRealismPrompt 等）抽到 `shared/` 或服务端，`/api/ai-chat/image` 与手机端统一注入；两端生图 prompt 行为完全一致。

### 阶段 5：全矩阵验收
- 验收矩阵：**电脑端 + 手机端 × 文本类/图片/短视频/企业视频/产品视频/探店/MV/萌宠/智能剪辑/数字人**，逐项生成成功。
- 检查项：生成文件仅含【智枢AI生成】一处标识；图片无 AI 塑料感；视频类（含无素材场景）能产出成片；数字人（有形象图）能产出。

---

## 五、需要用户提供的信息（用于收尾定位）

1. 手机端"能生成"与"不能生成"的具体功能清单（列明即可）。
2. 电脑端生成失败时的报错文案或截图。
3. 用户账户中已配置的平台 API Key 情况（是否配置、配置了哪些平台）——这是根因 A 的直接判据，也决定是否需要恢复"平台兜底 Key"方案。

---

## 六、参考来源

1. [火山方舟 模型广场 doubao-seedream-5-0](https://ark.volcengine.com/region:cn-beijing/model/detail?name=doubao-seedream-5-0)
2. [wcode.net Doubao Seedream 5.0 Pro API 参数](https://wcode.net/model/doubao-seedream-5.0-pro)
3. [腾讯云 旧版本模型下线迁移公告](https://cloud.tencent.com/document/product/1729/131925)
4. [TokenHub Hy 生图调用指南](https://cloud.tencent.com/document/product/1823/135745)
5. [TokenHub 视频生成模型调用概览](https://cloud.tencent.com/document/product/1823/135738)
6. [火山引擎 Seedance 2.0 上线](https://developer.volcengine.com/articles/7606009619928449070)
7. [阿里百炼 文生图使用方式](https://help.aliyun.com/zh/model-studio/text-to-image)
8. [阿里百炼 视频生成](https://help.aliyun.com/zh/model-studio/use-video-generation)
9. [腾讯云 YT-Video-HumanActor 介绍](https://cloud.tencent.com/developer/article/2676316)
10. [火山即梦 产品介绍(OmniHuman1.5)](https://www.volcengine.com/docs/85621/1834143)
