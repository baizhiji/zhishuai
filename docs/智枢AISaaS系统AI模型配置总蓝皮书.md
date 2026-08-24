# 智枢 AI SaaS 系统——AI 模型配置总蓝皮书（三服务商版）

> **版本**：V2.0（三服务商全量版 · 桌面化适配）
> **发布**：2026-08-14
> **适用范围**：智枢 AI SaaS 全系统（AI 创作工厂、AI 助手（桌面版与 APK 端）、智能获客、智能招聘、数字人、声音克隆、热点追踪、推荐分享、业务助手、素材管理、AI 工作流、多模态理解、管理后台、代理商门户——14 大业务类目）。**产品主形态已由在线 Web 端改为 Tauri 2.x 桌面安装版**：本蓝皮书全部模型配置、路由规则与横切关卡均位于服务端及前端配置层，不依赖 Web 在线形态，桌面化后完整适用；仅"管理后台 / 代理商门户"等前端载体由浏览器改为桌面安装版，正文中"Web 端"字样相应更新为"桌面版"。
> **服务商**：腾讯云 TokenHub、阿里云百炼、火山方舟（火山引擎）
> **设计哲学**：质量优先 · 全类目最终交付 · 爆款创意注入 · 违禁词零逃逸 · 反 AI 化贯穿 · 三服务商互为降级
> **前置说明**：本蓝皮书是 V3.1《AI 创作工厂模型配置总蓝皮书》的全系统扩展版。创作工厂部分继承 V3.1 的产线设计，其余 13 个业务类目为本次新增；服务商由 2 家扩展为 3 家，全部模型清单基于 2026-08-12 官方数据核实。V1.1 修正 4.4 智能招聘自动沟通话术机制（三层话术来源与岗位动态绑定）；V1.2 重写 4.2 AI 助手（APK）为全功能多模态助手（12 模型 × 8 任务类型 + 智能调度 + 6 大快捷能力）；V1.3 以质量优先原则重写 4.2——修正模型 ID（`hunyuan_instruct`/`hunyuan_thinking`）、调度原则改为质量优先、新增 8 大商业场景 × 质量优先模型配置、修正文档生成局限（四格式已全部实现）；**V1.4 收窄 AI 助手功能边界**——仅保留 8 大商业场景 + 文档导出 + 视频解析，删除与 AI 创作工厂/数字人类目重复的短视频制作、AI 数字人、内容创作、图片生成（4 项快捷能力），避免功能重复影响后续真实开发，详见附录 C；**V1.5 同步清除 APK 端代码残留**——删除 `AIChatScreen.tsx` 中 `hy_image`/`digital_human` 两个模型及 4 项快捷能力入口、`ai-model-router.ts` 中对应模型与任务类型、`ai-chat.service.ts` 中 `ImageGenerateRequest`/`generateImage`/推荐模型，模型清单由 12→10、任务分类由 9→7 类（对话/推理/长文/专业/Agent/视觉/视频），文档与 `apk/src` 代码完全对齐。**V2.0（2026-08-14）桌面化适配**——系统主形态由在线 Web 端改为 Tauri 2.x 桌面安装版：服务端模型路由 / 横切关卡 / 降级链全部不变；仅修正前端载体表述（"Web 端"→"桌面版"，覆盖 4.4 智能招聘自动沟通表单与 generate-script 入口、已知局限的入口分离描述），并将密钥管理升级为桌面版"系统凭据管理器 + Rust 主进程 AI 代理"（见 6.2）。模型清单与路由表不受影响。**V2.1（2026-08-14）智能剪辑类目新增**——AI 创作工厂 10→11 创作类目，新增 ⑪ 智能剪辑专属产线（多素材视频上传 → AI 剪辑点识别/脚本/配音/字幕/BGM/调色 → 桌面本地 FFmpeg 引擎合成一条成片），详见 4.1。

---

## 执行摘要

本蓝皮书以腾讯云 TokenHub、阿里云百炼、火山方舟三家综合服务商可调用的全部模型为基础，为智枢 AI SaaS 全系统设计统一 AI 模型配置方案。核心结论：三家服务商互补性极强，**文本天花板在百炼（Qwen3.8-Max，SuperCLUE 第一）与 TokenHub（DeepSeek-V4-Pro 原厂直供）**，**多模态天花板在方舟（Seedream 5.0 图像第一梯队、Seedance 2.5 视频第一梯队、声音复刻 2.0 国产最强）**，**视频全家桶与语音全家桶聚合度在 TokenHub 最高**。系统按"质量优先"原则在每个阶段选择该阶段最强模型，三家互为降级链，杜绝单点故障。

全系统 14 大业务类目均按"多阶段流水线 + 四道横切关卡"编排：每类目定义清晰的产线（阶段 → 模型 → 交付物），四道横切关卡（违禁内容检测、去 AI 化检测、爆款内容创意注入、质量关卡）嵌入所有产线所有阶段，确保每个类目最终产出**可直接交付用户使用的成品**，而非中间态。

三处关键工程决策：其一，接入层采用 OpenAI 兼容协议统一封装，三家 baseUrl 仅差一个配置项；其二，模型注册表引入"下线预警"机制（TokenHub 的 Kling/Vidu 旧 id、HY-Image-V3.0 等将于 2026-09-15 下线，需在注册表中标记并预置迁移路径）；其三，AIGC 标识合规（2025-09-01《人工智能生成合成内容标识办法》施行）前置到生成流程，全链路保留隐式标识与显式标识能力；显式标识采用品牌化统一文案「本内容由智枢AI生成」（完整含"AI+生成"法定要素，合规且为行业通行做法），标识随客户内容分发形成分布式品牌曝光——合规与品牌获客一石二鸟。

---

## 第一章 三服务商全景与模型选型总表

### 1.1 服务商定位（2026-08 时点）

| 维度 | 腾讯云 TokenHub | 阿里云百炼 | 火山方舟 |
|------|----------------|-----------|---------|
| 文本天花板 | DeepSeek-V4-Pro（原厂直供）、Kimi K3、GLM-5.2 | **Qwen3.8-Max（SuperCLUE 第 1）**、Qwen3.7-Plus（混合智能体国产独一档） | Doubao-Seed-2.1-Pro/Turbo |
| 图像 | HY-Image-V3.0（9/15 下线预告）、Vidu-Image-Q2 | qwen-image-3.0-pro/max、wan2.7-image-pro | **Seedream 5.0 Pro（第一梯队，坐标/涂鸦交互式编辑独占）** |
| 视频 | **可灵 Kling-V3 + Vidu Q3 + MiniMax-H3 + PixVerse v6 全家桶** | Wan3.0（8/6 公测，30 秒原生） | **Seedance 2.5（第一梯队，30 秒原生直出）** |
| 语音 | MiniMax-Speech-2.8 全系 + Voice-Clone + Music + WAND 配音 | qwen-audio-3.0-tts、MiniMax-speech | **声音复刻 2.0 + Doubao-Seed-Audio（国产最强）** |
| 智能体 | GLM-5.2（1M 上下文 Agent） | **Qwen3.7-Plus（GUI 操控，国产独一档）** | Doubao-Seed-2.1（500+ 工具协同） |
| 3D | **HY-3D-3.0/3.1/Express** | 无 | 无 |
| 向量 | Kinfra-Text-Embedding 系列 | qwen3.7-text-embedding | 豆包向量 |
| 第三方聚合 | **三家中最全（Kimi K3、MiniMax 全家桶、DeepSeek 原厂直供）** | 开放平台（Kimi K3、DeepSeek、GLM、MiniMax、阶跃星辰） | 文本第三方（DeepSeek-V4、GLM-5.2、Kimi-K2.7、MiniMax-M3） |
| 订阅制 | TokenPlan（¥39~¥599/月） | Coding Plan Pro ¥200/月 | Coding Plan（Lite ¥40 / Pro ¥200 元/月） |
| 独占优势 | 视频/语音第三方聚合最全 | 文本 + 智能体第一梯队 | 多模态自研第一梯队三件套 |

### 1.2 模型选型总表（按能力域，2026-08-12 核实）

#### 文本对话（通用问答 / AI 助手 / 文案）

| 模型 | 服务商 | API Model ID | 上下文 | 定位 | 成本级 |
|------|--------|-------------|--------|------|--------|
| Qwen 3.8 Max | 百炼 | `qwen3.8-max` | 2.4T MoE 旗舰 | 质量天花板：创作/推理/多模态 | premium |
| Doubao-Seed-2.1-Pro | 方舟 | `doubao-seed-2-1-pro-260628` | 256K | 旗舰全能、Agent、视频理解 | premium |
| DeepSeek-V4-Pro | TokenHub | `deepseek-v4-pro-202606` | 1.6T/激活49B | 结构化分析/深度推理，原厂直供 | medium |
| Qwen 3.7 Plus | 百炼 | `qwen3.7-plus` | 256K~1M | 混合智能体、反 AI 化重写 | medium |
| GLM-5.2 | TokenHub | `glm-5.2` | 1M | 极长文本/合同解析/Agent | medium |
| Kimi K3 | TokenHub/百炼 | `kimi-k3` / `kimi/kimi-k3` | 1M | 中英双语顶级/长文/去 AI 化 | premium |
| Doubao-Seed-2.1-Turbo | 方舟 | `doubao-seed-2-1-turbo-260628` | 256K | 高频生产，时延低 40%，价 50% | medium |
| Qwen 3.5 Plus | TokenHub | `qwen3.5-plus` | — | 多平台适配裁剪 | medium |
| DeepSeek-V4-Flash | TokenHub/百炼 | `deepseek-v4-flash-202605` / `deepseek-v4-flash-0731` | 百万级 | 质量交叉评分/快速任务 | low |
| Qwen 3.5 Flash | TokenHub | `qwen3.5-flash` | — | 轻量快速筛查 | low |
| Doubao-Seed-1.6-Lite | 方舟 | `doubao-seed-1-6-lite-251015` | 256K | 最强小尺寸深度思考 | low |
| 角色扮演 | TokenHub | `hunyuan-role-latest` / `hy-role` | — | 口语化润色/角色对话 | low |
| MiMo-V2.5-Pro | TokenHub | `mimo-v2.5-pro` | — | 补充候选 | medium |

#### 深度思考 / 推理

| 模型 | 服务商 | API Model ID | 说明 |
|------|--------|-------------|------|
| Qwen 3.8 Max | 百炼 | `qwen3.8-max` | 多模态推理旗舰 |
| Doubao-Seed-2.1 Deep Think | 方舟 | `doubao-seed-2-1-pro` 推理时配置 | 推理→验证→修正→选择循环 |
| DeepSeek-V4-Pro | TokenHub | `deepseek-v4-pro-202606` | 深度分析/长链路推理 |
| Doubao-Seed-1.6-Thinking | 方舟 | `doubao-seed-1-6-thinking-251015` | 编程/数学/推理，thinking 双模式 |

#### 图像生成

| 模型 | 服务商 | API Model ID | 定位 | 成本 |
|------|--------|-------------|------|------|
| **Seedream 5.0 Pro** | 方舟 | `doubao-seedream-5-0-pro-260628` | 图像主引擎：文生图/图生图/坐标涂鸦编辑/多图层 | ¥0.3/张(1K) 0.6/张(2K) |
| Seedream 5.0 Lite | 方舟 | `doubao-seedream-5-0-lite-*` | 组图(15张)/流式/联网增强，上限 4K | 低 |
| Qwen-Image-3.0-Pro | 百炼 | `qwen-image-3.0-pro` | 创意海报/品牌视觉 | ¥0.25/张(1K) 0.5/张(2K) |
| Qwen-Image-3.0 | 百炼 | `qwen-image-3.0` | 8/4 新增 | high |
| Qwen-Image-Edit | 百炼 | `qwen-image-edit` | 图像编辑/去 AI 伪影/细节锐化 | high |
| HY-Image-V3.0 | TokenHub | `hy-image-v3.0` | 备选引擎（⚠️ 9/15 下线预告，迁移 hy-image-v3 新命名或弃用） | high |
| Vidu-Image-Q2 | TokenHub | `vidu-image-q2` | 电商/广告图 | medium |
| Wan2.7-Image-Pro | 百炼 | `wan2.7-image-pro`（快照，待确认） | 电商产品图 | high |

#### 视频生成

| 模型 | 服务商 | API Model ID | 定位 | 成本 |
|------|--------|-------------|------|------|
| **Seedance 2.5** | 方舟 | `doubao-seedance-2-5-*` | 视频主引擎：30 秒原生直出、50 素材参考、音画联合、局部编辑 | premium |
| **Wan3.0** | 百炼 | `wan3.0-video` | 8/6 公测：30 秒视频、文档输入 | ¥0.3/0.6/1.2 元/秒(480P/720P/1080P) |
| Kling-Video-V3 | TokenHub | `kling-video-v3` | 图生视频/产品形态保持（新命名） | premium |
| Kling-Video-V3-Turbo | TokenHub | `kling-video-v3-turbo` | 快速生成 | premium |
| Vidu-Video-Q3-Pro | TokenHub | `vidu-video-q3-pro` | 电影级文生视频/中文场景叙事 | premium |
| Vidu-Video-Q3-Turbo | TokenHub | `vidu-video-q3-turbo` | 快速高质量/商业广告 | premium |
| MiniMax-Video-H3 | TokenHub | `minimax-video-h3` | 剧情短片备选 | premium |
| PixVerse-V6.0 | TokenHub | `pixverse-video-v6.0` | 特效/创意备选 | high |
| HY-Video-1.5 | TokenHub | `hy-video-1.5` | 视频备选引擎 | high |

> ⚠️ 迁移预警：TokenHub 旧命名 `kl-*`（可灵）与 `vd-*`（Vidu）共 15 个模型将于 **2026-09-15 统一下线**，须在 9/15 前全部迁移至 `kling-*` / `vidu-*` 新前缀。

#### 数字人

| 模型 | 服务商 | API Model ID | 定位 |
|------|--------|-------------|------|
| **YT-Video-HumanActor** | TokenHub | `yt-video-humanactor` | 数字人口播/虚拟主播（主引擎） |
| Seedance 2.5 数字人 | 方舟 | `doubao-seedance-2-5-*` | 数字人出镜备选（30 秒原生） |
| YT-Video-2.0 | TokenHub | `yt-video-2.0` | 图生视频/广告创意 |
| YT-Video-FX | TokenHub | `yt-video-fx` | 视频特效 |

#### 配音 TTS / 语音

| 模型 | 服务商 | API Model ID | 定位 | 成本 |
|------|--------|-------------|------|------|
| **声音复刻 2.0** | 方舟 | 声音复刻 2.0（控制台开通） | 品牌音色克隆主引擎（国产最强） | premium |
| **Doubao-Seed-Audio 1.0** | 方舟 | `doubao-seed-audio-1.0` | 高自然度 TTS / 情绪化语音 | medium |
| MiniMax-Speech-2.8-HD | TokenHub/百炼 | `minimax-speech-2.8-hd` | 高保真配音/多情感 | medium |
| MiniMax-Voice-Clone | TokenHub | `minimax-voice-clone` | 音色复刻备选 | medium |
| Qwen-Audio-3.0-TTS-Plus | 百炼 | `qwen-audio-3.0-tts-plus` | 中文口播/带货（qwen-tts 兼容） | medium |
| Qwen-Audio-3.0-ASR-Flash | 百炼 | `qwen-audio-3.0-asr-flash` | 语音识别 | low |
| WAND-Dubbing-Clone | TokenHub | `wand-dubbing-clone-v2` | 配音克隆（方言/多语） | medium |
| WAND-ASR / HY-ASR-3.0 | TokenHub | `wand-asr-v1` / `hy-asr-3.0-preview` | 语音识别 | low |

#### 多模态理解

| 模型 | 服务商 | API Model ID | 定位 |
|------|--------|-------------|------|
| HY-Vision-2.0-Instruct | TokenHub | `hy-vision-2.0-instruct` | 图片理解（快）/ 视觉安全审查 |
| Qwen 3.8 Max | 百炼 | `qwen3.8-max` | 图片理解（深度）/ 图表分析 |
| Doubao-Seed-2.0-Lite | 方舟 | `doubao-seed-2-0-lite-260215` | 首款全模态统一理解（图/视频/音频） |
| YT-VITA | TokenHub | `youtu-vita` | 视频理解/视频安全扫描 |
| Hy-Vision-1.5-Thinking | TokenHub | `hunyuan-t1-vision-20250916` | 深度视觉推理 |
| HY-Vision-Video | TokenHub | `hunyuan-turbos-vision-video-20250728` | 视频理解备选 |

#### 向量 / Embedding

| 模型 | 服务商 | API Model ID | 说明 |
|------|--------|-------------|------|
| Qwen3.7-Text-Embedding | 百炼 | `qwen3.7-text-embedding` | 256~2560 维可调，7/15 上架 |
| Kinfra-Text-Embedding | TokenHub | `kinfra-text-embedding-0.6b/4b` | 文本向量 |
| Kinfra-VL-Embedding | TokenHub | `kinfra-vl-embedding-2b/8b` | 视觉语言向量 |

#### 音乐 / 3D / 翻译

| 模型 | 服务商 | API Model ID | 定位 |
|------|--------|-------------|------|
| MiniMax-Music-V2.6 | TokenHub | `minimax-music-v2.6` | 视频配乐 BGM |
| Fun-Music-V1 | 百炼 | `fun-music-v1` | BGM 备选 |
| HY-3D-3.1 | TokenHub | `hy-3d-3.1` | 3D 生成 |
| Hy-MT2-Pro | TokenHub | `hy-mt2-pro` | 中英/多语翻译 |

### 1.3 成本模型与订阅计划

| 平台 | 订阅方案 | 价格 | 额度/说明 |
|------|---------|------|----------|
| TokenHub | TokenPlan Lite | ¥39/月 | 3500 万 Tokens，覆盖 DeepSeek-V4 原厂直供/MiniMax/GLM/Kimi |
| TokenHub | TokenPlan Standard | ¥99/月 | 1 亿 Tokens |
| TokenHub | TokenPlan Pro | ¥299/月 | 3.2 亿 Tokens |
| TokenHub | TokenPlan Max | ¥599/月 | 6.5 亿 Tokens |
| TokenHub | Hy Token Plan | ¥28~468/月 | Hy3 preview 专享（8/31 下线前） |
| 百炼 | Coding Plan Pro | ¥200/月 | 每5小时6000次/周45000次/月90000次，新客首月 ¥39.9 |
| 方舟 | Coding Plan Lite | ¥40/月 | 抵扣系数：豆包/Qwen=1，DeepSeek=2，MiniMax/Kimi/GLM=5 |
| 方舟 | Coding Plan Pro | ¥200/月 | 同上抵扣规则 |

**成本治理原则**：① 高质量/高价值任务走按量计费 premium 模型（Qwen3.8-Max、Seedream 5.0、Seedance 2.5），高频低价值任务走 flash/lite/turbo；② 订阅计划优先分配给高频文本调用域（AI 助手、获客、招聘的批量任务）；③ 三平台配额互备，防止单一平台额度耗尽。

---

## 第二章 模型路由策略（按能力域）

模型路由的核心原则：**每个阶段用最适合该阶段任务的模型，不追求单一模型全能；每个任务至少保留"主选 → 备选 → 第三家兜底"三级降级链**。

### 2.1 文本生成路由表

| 场景 | 首选模型（服务商） | 备选模型（服务商） | 兜底（服务商） |
|------|-------------------|-------------------|---------------|
| 爆款分析/结构化大纲 | DeepSeek-V4-Pro (TokenHub) `deepseek-v4-pro-202606` | Qwen3.8-Max (百炼) `qwen3.8-max` | Doubao-Seed-2.1-Pro (方舟) |
| 高温创意初稿 | Qwen3.8-Max (百炼) temp=0.85-0.95 | Doubao-Seed-2.1-Pro (方舟) temp=0.9 | DeepSeek-V4-Pro (TokenHub) |
| 反 AI 化重写 | Qwen3.7-Plus (百炼) `qwen3.7-plus` | Doubao-Seed-1.6-Thinking (方舟) | Hy-Role-Latest (TokenHub) |
| 质量交叉评分 | DeepSeek-V4-Flash (TokenHub) `deepseek-v4-flash-202605` | GLM-5.2 (TokenHub) `glm-5.2` | Doubao-Seed-2.1-Turbo (方舟) |
| 多平台适配裁剪 | Qwen3.7-Flash (百炼) `qwen3.7-flash` | Qwen3.5-Flash (TokenHub) `qwen3.5-flash` | Doubao-Seed-1.6-Lite (方舟) |
| 长文本/摘要/结构化 | Kimi K3 (TokenHub) `kimi-k3` | GLM-5.2 (TokenHub) `glm-5.2` | Kimi K3 (百炼) `kimi/kimi-k3` |
| 代码/技术文档 | Kimi-K2.7-Code (TokenHub) `kimi-k2.7-code` | Qwen3.8-Max (百炼) | Doubao-Seed-2.0-Code (方舟) |
| 角色扮演/口语化润色 | Hy-Role-Latest (TokenHub) `hunyuan-role-latest` | Qwen3.7-Plus (百炼) | Doubao 角色扮演 (方舟) |
| 翻译 | Hy-MT2-Pro (TokenHub) `hy-mt2-pro` | Qwen3.5-Plus (TokenHub) | Qwen3.8-Max (百炼) |
| Agent/任务执行 | Qwen3.7-Plus (百炼，GUI 操控) | GLM-5.2 (TokenHub，1M 上下文) | Doubao-Seed-2.1-Pro (方舟，500+ 工具) |
| 通用快速对话 | Qwen3.5-Flash (TokenHub) | Doubao-Seed-2.1-Turbo (方舟) | DeepSeek-V4-Flash (百炼) |

### 2.2 图像生成路由表

| 场景 | 首选模型（服务商） | 备选模型（服务商） | 兜底 |
|------|-------------------|-------------------|------|
| 通用商业图片 | Seedream 5.0 Pro (方舟) `doubao-seedream-5-0-pro-260628` | Qwen-Image-3.0-Pro (百炼) `qwen-image-3.0-pro` | HY-Image-V3.0 (TokenHub) |
| 电商产品图 | Qwen-Image-3.0-Pro (百炼) | Wan2.7-Image-Pro (百炼) | Seedream 5.0 (方舟) |
| 创意海报/品牌视觉 | Qwen-Image-3.0-Pro (百炼) | Seedream 5.0 Pro (方舟) | Vidu-Image-Q2 (TokenHub) |
| 交互式精准编辑 | Seedream 5.0 Pro 坐标涂鸦编辑 (方舟，独占) | Qwen-Image-Edit (百炼) | — |
| 快速预览/缩略图 | Seedream 5.0 Lite (方舟) | Qwen-Image-3.0 (百炼) | HY-Image-Lite (TokenHub，9/15 下线) |
| 图片质量增强/去伪影 | Qwen-Image-Edit (百炼) | Seedream 5.0 局部编辑 (方舟) | — |

### 2.3 视频生成路由表

| 场景 | 首选模型（服务商） | 备选模型（服务商） | 兜底 |
|------|-------------------|-------------------|------|
| 通用视频创作（30 秒级） | Seedance 2.5 (方舟) `doubao-seedance-2-5-*` | Wan3.0 (百炼) `wan3.0-video` | Kling-Video-V3 (TokenHub) |
| 产品形态保持（带货） | Kling-Video-V3 (TokenHub) `kling-video-v3` | Seedance 2.5 参考图 (方舟) | Kling-Video-V3-Omni (TokenHub) |
| 中文场景适配 | Vidu-Video-Q3-Pro (TokenHub) | Seedance 2.5 (方舟) | Wan3.0 (百炼) |
| 快速生成 | Kling-Video-V3-Turbo (TokenHub) | Vidu-Video-Q3-Turbo (TokenHub) | PixVerse-V6 (TokenHub) |
| 数字人出镜 | YT-Video-HumanActor (TokenHub) | Seedance 2.5 数字人 (方舟) | Kling-Video-V3 (TokenHub) |
| 视频特效/风格化 | YT-Video-FX (TokenHub) | PixVerse-V6 (TokenHub) | Vidu-Video-Q2-Pro (TokenHub) |
| 剧情短片 | MiniMax-Video-H3 (TokenHub) | Seedance 2.5 (方舟) | Wan3.0 (百炼) |

### 2.4 语音/配音路由表

| 场景 | 首选模型（服务商） | 备选模型（服务商） | 兜底 |
|------|-------------------|-------------------|------|
| 高保真配音 | MiniMax-Speech-2.8-HD (TokenHub/百炼) `minimax-speech-2.8-hd` | Qwen-Audio-3.0-TTS-Plus (百炼) | Doubao-Seed-Audio (方舟) |
| 品牌定制声音克隆 | 声音复刻 2.0 (方舟，国产最强) | MiniMax-Voice-Clone (TokenHub) | WAND-Dubbing-Clone-V2 (TokenHub) |
| 中文口播/带货 | Qwen-Audio-3.0-TTS-Plus (百炼) `qwen-audio-3.0-tts-plus` | Doubao-Seed-Audio (方舟) | MiniMax-Speech-2.8-Turbo (TokenHub) |
| 方言/多语配音 | WAND-Dubbing-Clone-V2 (TokenHub) | Qwen-Audio-3.0-TTS (百炼) | — |
| 语音识别 ASR | Qwen-Audio-3.0-ASR-Flash (百炼) | WAND-ASR-V1 (TokenHub) | HY-ASR-3.0 (TokenHub) |

### 2.5 视觉理解路由表

| 场景 | 首选模型（服务商） | 备选模型（服务商） | 兜底 |
|------|-------------------|-------------------|------|
| 图片理解（快）/ 安全审查 | HY-Vision-2.0-Instruct (TokenHub) `hy-vision-2.0-instruct` | Doubao-Seed-2.0-Lite 全模态 (方舟) | Qwen3.7-Flash 多模态 (百炼) |
| 图片理解（深度） | Qwen3.8-Max (百炼) `qwen3.8-max` | HY-Vision-1.5-Thinking (TokenHub) | Doubao-Seed-2.1-Pro (方舟) |
| 视频理解 | YT-VITA (TokenHub) `youtu-vita` | Doubao-Seed-2.1-Pro 视频理解 (方舟) | HY-Vision-Video (TokenHub) |

### 2.6 其他能力路由

| 能力 | 首选 | 备选 |
|------|------|------|
| BGM 配乐 | MiniMax-Music-V2.6 (TokenHub) | Fun-Music-V1 (百炼) |
| 3D 生成 | HY-3D-3.1 (TokenHub) | — |
| 向量检索 | Qwen3.7-Text-Embedding (百炼) | Kinfra-Text-Embedding-4B (TokenHub) |
| 视觉向量 | Kinfra-VL-Embedding-8B (TokenHub) | — |

### 2.7 降级链设计（三服务商互备）

```
任务进入 → 路由决策（任务类型识别）→ 选择主选模型
  ├─ 主选调用失败/超时/限流 → 备选模型（同能力域第二强）
  │    └─ 备选也失败 → 第三家兜底
  │         └─ 三家全失败 → 返回降级提示 + 记录监控日志（不静默失败）
```

关键降级触发条件：HTTP 429 限流、5xx 服务端错误、超时（默认 30s，推理模型 60s）、配额耗尽、模型下线（注册表预警位触发）。

---

## 第三章 四大横切模块（嵌入所有业务类目所有阶段）

这四道横切能力不是独立的"产线"或"步骤"，而是嵌入到全系统 14 个业务类目所有阶段的"基础设施"。每个阶段执行前和执行后都会经过这些模块。此外新增第五道——AIGC 标识合规（2025-09-01 办法落地要求）。

### 3.1 违禁内容检测（Content Safety Gate）

**目标**：零违规内容"逃逸"到最终交付物中。

**检测范围**（六类违禁内容 + 平台规则）：
1. **政治敏感**：涉政人物、事件、组织、口号；可能导致监管处罚的表述
2. **色情低俗**：裸露、性暗示、擦边内容；图片过度暴露
3. **暴力恐怖**：血腥、暴力、武器、恐怖主义内容
4. **违法违规**：赌博、毒品、诈骗、传销、非法集资
5. **侵权内容**：未经授权的商标、品牌 Logo、名人肖像、版权图片
6. **虚假信息**：伪造新闻、医疗误导声明、金融欺诈性陈述
7. **广告法违禁词**（九大类）：绝对化"一"类（第一/唯一/独一无二）、夸张"最"类（最/最佳/最好/最高级）、"级/极"类（国家级/顶级/极致）、迷信用语、品牌夸大类（大牌/金牌/遥遥领先）、权威类（特供/专供/专家推荐）、虚假类（史无前例/万能/100%）、欺诈诱导类（秒杀/抢爆/再不抢就没了）、行业敏感词（医疗：预防/治疗/抗癌；食品：最新科学/特效/强效；金融：保本/稳赚）
8. **平台屏蔽词**：抖音（不文明用语、迷信词汇、民族歧视）、小红书（商单 AI 披露规则）等平台特有规则

**替代词映射表**（合规改写时自动替换）："第一/NO.1"→"首要/佼佼者"；"首选"→"优选"；"最"→"较/理想/超卓"；"100%"→"提升百分之"；"顶级/一流"→"精优/优异/拔尖"；"完美"→"精致/精美"；"特效"→"有效"。

**实现机制**：
- **输入检测**：用户 prompt 进入流水线前，轻量模型（Qwen3.5-Flash 或 Hy-Role）快速筛查，命中任一类立即拦截
- **输出检测**：每个文本阶段产出后，DeepSeek-V4-Pro 深度合规审查，输出 `{ pass, riskLevel, violations[], suggestion }`
- **图片检测**：生成图片送 HY-Vision-2.0-Instruct 视觉安全审查（裸露度/暴力标识/政治符号/品牌 Logo），不通过自动重生成
- **视频检测**：关键帧提取 → YT-VITA 逐帧安全扫描

**硬性规则**：high risk → 流水线中止返回不合规提示；medium risk → 标记人工审核通知；low risk → 通过并记审计日志。

### 3.2 去 AI 化检测（Anti-AI Detector）

**目标**：最终交付物"真人创作感"达标，AI 痕迹评分低于阈值（文本 <20/100，语音 <15/100）。

**六维检测体系**：

| 维度 | 检测对象 | 检测指标 | 阈值 |
|------|---------|---------|------|
| 文本句式 | 文案/脚本 | 句式规律性、词汇分布、连接词密度（AI 7.2 个/千字 vs 人类 4.1）、逻辑过度完整 | < 20/100 |
| 文本统计特征 | 文案/脚本 | perplexity（AI<15，人类 20-50）+ burstiness（AI 低，句长 15-25 词均匀；人类高，1-50 词波动）双指标 | 双低即判 AI |
| 图像纹理 | 图片 | 纹理平滑度、对称度、光影物理合理性 | < 20/100 |
| 语音自然度 | 配音 | 语调重复模式、语速均匀度、呼吸感缺失 | < 15/100 |
| 视频运动 | 视频 | 运动轨迹机械化、帧间突变、动作规律化 | < 20/100 |
| 数字人拟真 | 数字人 | 眨眼频率规律性、微表情单一性、皮肤纹理过度均匀 | < 15/100 |

**反 AI 化技术手段**：
- **文本**：高温初稿（0.85-0.95）打破"最合理预测"；反 AI 化重写注入口语化、不完整句式、随机语气词、打破排比；AI 句式黑名单（"综上所述""与此同时""可以看出""值得注意的是"）；注入人类风格印记（省略句、口语夹书面语）；插入语注入率约 3.7%、句长波动约 10%；语义同位素替换（非简单同义词："采用"→"运用/采纳/选取"）；专业术语保护机制（术语库仅对非核心词汇改造）
- **图像**：负向 Prompt 注入反 AI 关键词（plastic skin / perfect symmetry / airbrushed texture / hyper-realistic CGI 等）；随机噪点、非均匀光影、微小色差；同组 Prompt 并行生成 4 张，视觉模型选最"真实感"版本
- **视频**：4 选 1 择优；帧间一致性检查（产品颜色/形状/材质跨镜头偏差 <5%）；注入物理世界不完美（镜头抖动、光线闪烁、背景随机元素）

**不达标处理**：超过阈值回退上一阶段重生成，单阶段最多重试 3 次；3 次后仍不达标标记"AI 痕迹偏高"仍交付（附质量报告），记录优化队列。

**认知更新（2026）**：仅替换"此外/综上所述"等表层过渡词无法根除 AI 味（AI 味在深层结构而非表层词汇）；纯 AI 内容停留/分享率比带刻意不完美感的人工策展内容低 40%-60%，去 AI 化直接关系内容效果。

### 3.3 爆款内容创意（Viral Gene Injector）

**目标**：让每个产出自带"爆款基因"，而非平庸的内容填充。覆盖全系统所有对外产出（文案、视频、图文、标题、钩子、口播、种草笔记、裂变海报、招聘 JD、获客话术）。

**爆款因子提取流程**：
1. **实时爆款数据检索**：热点追踪模块（见 4.7）从新榜/飞瓜/蝉妈妈/巨量算数检索目标品类 × 目标平台近 7-14 天 Top 50 高互动内容
2. **共性结构提取**：DeepSeek-V4-Pro 分析共性——钩子类型分布、开头 3 秒公式、情绪曲线模板、信息密度、金句密度、CTA 转化结构
3. **差异化分析**：找出 Top 50 未覆盖但有潜力的角度，输出"蓝海突破口"
4. **爆款因子打包**：输出该业务域专属的爆款因子包 JSON，注入后续所有阶段

**爆款因子包 JSON 结构**（跨业务域通用）：

```json
{
  "businessDomain": "contentFactory|chat|acquisition|recruitment|digitalHuman|hotspot|share",
  "platform": "douyin|xhs|bilibili|wechat|videoChannel",
  "dateRange": "2026-07-29 ~ 2026-08-11",
  "hooks": [
    { "type": "curiosity", "template": "你可能不知道的是…", "weight": 0.35 },
    { "type": "conflict", "template": "谁说XXX就一定XXX？", "weight": 0.28 },
    { "type": "benefit", "template": "学会这招，XXX帮你省下XXX", "weight": 0.22 },
    { "type": "emotion", "template": "凌晨2点，我盯着后台数据…", "weight": 0.15 }
  ],
  "emotionCurve": "钩子(0-3s) → 价值密集(3-8s) → 情绪高点(8-12s) → CTA引导(12-15s)",
  "goldenLineDensity": "每100字1.5条金句",
  "ctaPatterns": ["评论区告诉我XXX", "先收藏免得以后找不到", "转发给你身边XXX的人"],
  "blueOceanAngles": ["XXX场景下的YYY需求尚未被充分覆盖"]
}
```

**平台差异化注入**（prompt 工程模板库）：
- **抖音**：前 3 秒黄金定律；中间锚点话术（"注意看这个细节""先说结论，别急着划走"）；结尾引导 CTA；评论区置顶指令评论话术（发布后 5 分钟置顶、30 分钟回复高赞）；分享率 >5% 是爆款核心指标
- **小红书**：种草三件套（封面+标题+正文）；七大爆款标题公式（身份定位法/结果震撼法/痛点反问法/秘密揭露法/对比冲突法/数字盘点法/价值承诺法）；标题元素周期表 `身份标签+核心痛点+解决方案+情绪杠杆`
- **B站**：弹幕互动设计；中长视频（3 分钟+）深度内容；收藏/复访/追更行为引导
- **公众号**：六种爆款标题模板（数字型/痛点型/悬念型/对比型/干货型/情绪型）；前 50 字场景代入/痛点直击/结果前置；原创防搬运（个人经历、逻辑重组、独特人设）
- **视频号**：社交信任转化；私域热启动话术；专业人设+持续价值输出

**注入方式**（按业务域）：
- 创作工厂：爆款因子注入文案产线 `viral_analysis` 与 `draft` 阶段、图像产线视觉参数、视频产线节奏模板
- AI 助手（APK）：策划/诊断对话注入结构化思维与可执行落地方案（企业策划≠标题党，而是"拿来就能用"）
- 智能获客：营销内容/触达话术注入钩子与 CTA（见 4.3）
- 智能招聘：JD 注入雇主品牌钩子、面试话术注入引导结构
- 数字人：口播节奏与情绪曲线注入 `draft` 和 `tts_generate`
- 推荐分享：裂变文案注入利益型钩子与转发 CTA（见 4.8）

### 3.4 质量优先（Quality Gate）

**目标**：每个阶段产出都有质量保障，不达标的回退重做。

**四维质量关卡标准**：

| 维度 | 评分标准 | 通过阈值 |
|------|---------|---------|
| 内容质量 | 信息完整度/逻辑连贯度/创意新鲜度/节奏感 | > 75/100 |
| 技术质量 | 分辨率/帧率/口型同步/帧间一致率/无渲染错误 | > 85/100 |
| 平台合规 | 内容安全通过/广告法合规/AIGC 标识合规/版权无侵权 | 100% 通过 |
| 去 AI 化 | 六维 AI 痕迹综合评分 | < 20/100 |

**质量关卡嵌入位置**：每个阶段结束 → 质量关卡 → 通过进入下一阶段，不通过回退上一阶段重生成。单阶段最多迭代 3 次；3 次后标记 B 级交付（附质量报告），不阻塞流水线。

**特殊处理**：图片/视频不达标换 seed 重新调用；文本不达标换 temperature 重生成（不用同一 prompt 重复调用）。

### 3.5 AIGC 标识合规（AIGC Labeling Gate，新增横切）

**依据**：《人工智能生成合成内容标识办法》（网信办、工信部、公安部、广电总局四部委联合，**2025-09-01 施行**）。

**强制标识的 5 类内容**：文本、图片、音频、视频、虚拟场景（只要一部分是 AI 生成）。豁免：拼写/语法修改、自动字幕、轻度修图/美颜。

**三平台落地差异**：
| 平台 | 显式标识位置 | 未声明处罚 |
|------|------------|-----------|
| 抖音 | 视频左下角"AI生成"角标+开头3秒水印 | 首次警告+自动补标；累计3次降权7天；故意隐匿封禁 |
| 小红书 | 笔记顶部横向 banner | 首次提醒+自动补标；多次限流；商业账号禁广告权益 |
| 视频号 | 右上角角标+评论区置顶提示 | 首次警告；多次不可推荐 |

**实现机制**：
- **隐式标识**：生成流程写入 C2PA 凭证/EXIF/XMP 元数据/数字水印（合规国内工具自动写入）
- **显式标识**：发布模板内置"AI 生成"角标位（字符高度不低于画面短边 3%）
- **流程前置**：AI 标识动作前置到生成流程（生成时勾选 → 保留元数据 → 发布时主动声明），而非发布前临时补救
- **账号分层**：纯 AI 内容账号与真人内容账号物理隔离（平台治理趋势）

**品牌标识统一文案（智枢AI生成）**：

显式标识采用品牌化统一文案「**本内容由智枢AI生成**」（空间受限场景用「智枢AI生成」）。依据《办法》第四条，显式标识仅作功能性要求（文本起始/末尾/中间添加文字提示或通用符号提示），未指定固定措辞；配套强制性国标 GB 45438-2025 的强制要素为标识中必须同时包含「AI/人工智能」与「生成/合成」字样。「智枢AI生成」完整覆盖两个法定要素，品牌名仅作为附加信息叠加，与豆包（生成图默认「豆包AI生成」水印）、头条（「本文由AI生成」）、喜马拉雅（「本音频由AI生成」）等主流产品做法一致。合规之外，标识随客户分发形成分布式品牌曝光，是零成本的获客触点（"标识即广告"）。

| 内容类型 | 显式标识文案 | 位置要求 | 格式要求 |
|---------|------------|---------|---------|
| 文本 | 本内容由智枢AI生成 | 文首或文末，随排版 | 字号 ≥ 正文 20%，与正文视觉区分（灰字/斜体/下划线） |
| 图片 | 智枢AI生成 | 画面右下角水印 | 字符高度 ≥ 画面短边 3%（国标强制） |
| 视频 | 智枢AI生成 | 画面一角角标 + 开头 3 秒 | 不透明度 ≥ 60%，全程或片头常驻 |
| 音频 | 本音频由智枢AI生成 | 音频开头/结尾 | 语音播报，时长 ≥ 2 秒 |
| 数字人/虚拟场景 | 智枢AI生成 | 画面角落常驻 | 全程常驻，与平台角标叠加 |

**合规红线（标识三要素自检）**：
- 品牌名只能附加，**不得替换法定要素**——"智枢生成"（缺 AI）或"智枢AI"（缺生成）均不合规；最稳妥呈现为「本内容由智枢AI生成」
- 显式标识与隐式标识缺一不可；提供下载/导出时标识随文件保留，禁止下游删除、篡改、伪造、隐匿（《办法》第十条）
- 平台侧二次标注为叠加关系：创作者在抖音/小红书/微信发布时仍需主动勾选"由AI生成"声明，不可互相替代；智枢AI通过用户服务协议说明标识方法（《办法》第八条）并在产品内引导用户完成平台声明

**隐式标识规格（生成流程自动写入）**：

```json
{ "provider": "智枢AI", "contentId": "<UUID>", "timestamp": "<ISO8601>", "model": "<模型ID>" }
```

写入载体：C2PA 凭证 / EXIF / XMP 元数据 / 数字水印（按内容类型自动匹配合规载体，第三方核验可读）。

**租户级配置**：管理后台提供标识开关（默认开启）与标识文案可配置项；租户可叠加自身品牌后缀（如「本内容由 XX 客户 · 智枢AI生成」），满足多租户品牌诉求的同时不破坏法定要素，标识门全局监控漏标率（漏标 = 平台处罚风险，见第六章监控指标）。

---

## 第四章 全系统 14 大业务类目完整产线编排

每个类目均按"多阶段流水线 + 横切关卡"编排，确保产出**用户可直接使用的最终交付物**。以下每个类目列出：产线阶段、每阶段模型选择（首选/备选）、爆款因子注入点、关卡位置、最终交付物。

### 4.1 AI 创作工厂（11 创作类目）

继承 V3.1 五层流水线架构，模型全面升级至三服务商阵容：

```
文案产线 → 反AI化改造 → 图像产线 → 视频产线 → 配音合成
```

**11 个创作类目**：① 图文创作 ② 短视频脚本 ③ 公众号文章 ④ 小红书笔记 ⑤ 电商带货文案 ⑥ 口播文案 ⑦ PPT 大纲 ⑧ H5 策划 ⑨ 海报设计 ⑩ 直播脚本 ⑪ 智能剪辑（智能视频剪辑合成，桌面版优先，专属产线见本节末）。

**每类目统一产线**（阶段 → 首选/备选模型 → 交付物）：

| 阶段 | 首选模型 | 备选模型 | 注入/关卡 | 产出 |
|------|---------|---------|----------|------|
| 1. 爆款意图分析 | DeepSeek-V4-Pro (TokenHub) | Qwen3.8-Max (百炼) | **爆款因子注入** | 爆款因子包 |
| 2. 结构化大纲 | DeepSeek-V4-Pro | Qwen3.8-Max | 质量门 | 大纲 |
| 3. 高温创意初稿 | Qwen3.8-Max (temp 0.85-0.95) | Doubao-Seed-2.1-Pro | **爆款因子注入** + 违禁词门 | 创意初稿 |
| 4. 反 AI 化重写 | Qwen3.7-Plus | Doubao-Seed-1.6-Thinking | **反AI化门** | 真人感稿 |
| 5. 风格校准 | Qwen3.7-Plus | Hy-Role | 质量门 | 校准稿 |
| 6. 质量评审 | DeepSeek-V4-Flash | GLM-5.2 | 质量门 | 评审分 |
| 7. 多平台适配 | Qwen3.7-Flash | Qwen3.5-Flash | 平台违禁词门 | 多平台版本 |
| 8. 视觉策略/图像 Prompt | DeepSeek-V4-Pro | Qwen3.8-Max | **爆款因子注入**(视觉参数) | 图像 Prompt |
| 9. 图片生成 | Seedream 5.0 Pro (方舟) | Qwen-Image-3.0-Pro (百炼) | 视觉违禁词门 + 反AI化门(4选1) | 成品图 |
| 10. 分镜脚本 | DeepSeek-V4-Pro | Qwen3.8-Max | **爆款因子注入**(节奏模板) | 分镜脚本 |
| 11. 视频生成 | Seedance 2.5 (方舟) | Wan3.0 (百炼)/Kling-V3 (TokenHub) | 视频安全扫描 + 反AI化门(4选1) | 成品视频 |
| 12. 配音合成 | MiniMax-Speech-2.8-HD / 声音复刻 | Qwen-Audio-TTS-Plus | 语音反AI化门 | 配音 |
| 13. 字幕生成 | Kimi K3 | GLM-5.2 | 翻译门 | 中英双语字幕 |
| 14. BGM 配乐 | MiniMax-Music-V2.6 | Fun-Music-V1 | — | 配乐 |
| 15. 合规终审 + AIGC 标识 | DeepSeek-V4-Pro + HY-Vision | — | 违禁词终审 + **AIGC标识门** | 合规报告 + 标识 |

**最终交付物**：可直接发布的多平台成品（图文包/视频文件+封面+标题+话题标签+发布建议+合规报告+AIGC 标识声明）。

**智能剪辑专属产线（创作类目 ⑪，桌面版 video-editing）**：区别于"文案/图像/视频生成"产线——本类目输入为**用户上传的多个视频素材**，输出为**一条剪辑合成的成片**。AI 负责"脚本结构、剪辑点识别、配音、字幕、BGM、调色指令、合规"；视频物理合成（拼接/变速/字幕烧录/混音/调色渲染）由**桌面端本地 FFmpeg 引擎**（Tauri Rust 侧）执行，不消耗模型视频生成配额。

| 阶段 | 首选模型 | 备选模型 | 注入/关卡 | 产出 |
|------|---------|---------|----------|------|
| 1. 需求解析/剪辑脚本 | DeepSeek-V4-Pro (TokenHub) | Qwen3.8-Max (百炼) | **爆款因子注入** + 违禁词门 | 剪辑脚本（结构/节奏/时长） |
| 2. 素材视频理解/剪辑点识别 | YT-VITA (TokenHub) | Doubao-Seed-2.1-Pro 视频理解 (方舟) | 视频安全扫描 | 精彩片段清单 + 时间戳 |
| 3. 镜头排序/卡点编排 | DeepSeek-V4-Pro | Qwen3.8-Max | **爆款因子注入**(节奏模板) | 成片剪辑方案（变速/转场指令） |
| 4. 配音合成 | MiniMax-Speech-2.8-HD / 声音复刻 2.0 | Qwen-Audio-TTS-Plus | 语音反AI化门 | 配音音频 |
| 5. 字幕生成 | Kimi K3 | GLM-5.2 | 翻译门 | 中英双语字幕（SRT） |
| 6. BGM 配乐 | MiniMax-Music-V2.6 | Fun-Music-V1 | — | 配乐 |
| 7. 调色/滤镜策略 | DeepSeek-V4-Pro | Qwen3.8-Max | — | 统一调色参数（多素材风格一致） |
| 8. 本地引擎合成 | —（桌面 FFmpeg 执行，无模型） | — | 质量门 | 成片视频 |
| 9. 合规终审 + AIGC 标识 | DeepSeek-V4-Pro + HY-Vision | — | 违禁词终审 + **AIGC标识门** | 合规报告 + 标识 |

**智能剪辑最终交付物**：一条可直接发布/下载的成片视频 + 字幕文件 + 封面/标题/发布建议 + 合规报告 + AIGC 标识声明（自动入素材库）。

### 4.2 AI 助手（桌面版与 APK 端，ai-chat / ai-model-router / business-assistant）

**目标**：AI 助手是独立能力线（不属于四大业务线），桌面版与 APK 端均提供；本节 10 模型清单与 `apk/src/services/ai-model-router.ts` 完全对齐，桌面版复用同一路由配置。面向客户的能力边界为——**8 大商业场景方案生成（创业/运营/诊断/自媒体/产品/竞品/实体店/营销）+ 文档导出（Word/Excel/PPT/PDF 四格式）+ 视频解析 + 日常对话与深度推理**。**共 10 个可切换模型，覆盖 7 类任务（对话/推理/长文/专业/Agent/视觉/视频）**，由智能调度器自动选型，**调度原则为质量优先（质量 > 费用，费用仅作同质量下平级参考）**。

**① 模型清单（APK 端 10 模型，与 `apk/src/services/ai-model-router.ts` 完全一致，2026-08-13 复核）**

| # | 模型键 | 模型 ID | 名称 | 服务商 | 任务类型 | 上下文 | 定位 |
|---|--------|---------|------|--------|---------|--------|------|
| 1 | `hunyuan_instruct` | `hunyuan-2.0-instruct-20251111` | 混元日常 | 腾讯云 TokenHub | 对话 | 8K | 日常对话、智能问答 |
| 2 | `hunyuan_thinking` | `hunyuan-2.0-thinking-20251109` | 混元思考 | 腾讯云 TokenHub | 推理 | 32K | 复杂推理、深度分析 |
| 3 | `kimi_k2` | `kimi-k2.6` | Kimi 长文 | 腾讯云 TokenHub | 长文 | 128K | 超长结构化报告生成 |
| 4 | `glm_5` | `glm-5` | GLM-5 Agent | 腾讯云 TokenHub | Agent | 32K | Agent 任务、代码生成 |
| 5 | `glm_5v` | `glm-5v-turbo` | GLM 视觉 | 腾讯云 TokenHub | 视觉 | 8K | 图片理解、图表分析 |
| 6 | `youtu_vita` | `youtu-vita` | 视频解析 | 腾讯云 TokenHub | 视频 | 16K | 视频理解、内容提取 |
| 7 | `qwen_turbo` | `qwen-turbo` | 千问快速 | 阿里云百炼 | 对话 | 8K | 日常对话（平级备选） |
| 8 | `qwen_plus` | `qwen-plus` | 千问专业 | 阿里云百炼 | 专业 | 32K | 专业文案、营销内容 |
| 9 | `qwen_long` | `qwen-long` | 千问长文 | 阿里云百炼 | 长文 | 10M | 超长文本（备选） |
| 10 | `deepseek_r1` | `deepseek-r1-0528` | DeepSeek 思考 | 阿里云百炼 | 推理 | 64K | 深度思考（备选） |

**② 8 大商业场景 × 质量优先模型配置（核心配置，对应 `business-assistant.service.ts` 的 `BUSINESS_SCENARIOS`）**

方案生成均输出 5-10 章节的长结构化报告，属"长文 + 推理 + 专业文案"复合任务，**按场景质量优先选择模型**，费用不作为选型依据（8 大场景无一使用低成本的 `qwen_turbo`/`hunyuan_instruct`，保证方案质量）：

| # | 场景 ID | 场景名称 | 类别 | 质量首选 | 备选 | 选型理由 |
|---|---------|---------|------|---------|------|---------|
| 1 | `startup` | 创业方案 | 方案策划 | `kimi_k2` | `hunyuan_thinking` | 长结构化报告 + 财务预测，128K 长文最优 |
| 2 | `operations` | 运营策划 | 运营管理 | `kimi_k2` | `hunyuan_thinking` | 流程优化 + KPI 体系长报告 |
| 3 | `diagnosis` | 企业诊断 | 分析诊断 | `hunyuan_thinking` | `deepseek_r1` | 8 维度诊断需深度推理，推理模型优先 |
| 4 | `media_operations` | 自媒体运营方案 | 营销推广 | `qwen_plus` | `hunyuan_thinking` | 内容规划 + 人设打造，专业文案最优 |
| 5 | `product_promotion` | 产品宣传方案 | 营销推广 | `qwen_plus` | `hunyuan_thinking` | 卖点提炼 + 传播策略，专业营销文案 |
| 6 | `competitive_analysis` | 竞品分析报告 | 分析诊断 | `hunyuan_thinking` | `kimi_k2` | 竞品画像 + 应对策略，推理 + 长文结合 |
| 7 | `brick_and_mortar` | 实体店经营方案 | 运营管理 | `kimi_k2` | `hunyuan_thinking` | 全链路经营长方案（选址/装修/选品/获客） |
| 8 | `marketing` | 市场营销方案 | 营销推广 | `qwen_plus` | `hunyuan_thinking` | 整合营销策略，专业文案优先 |

**③ 智能模型调度机制（质量优先，`apk/src/services/ai-model-router.ts` 的 `analyzeAndSelectModel`）**

输入用户消息 → 关键词匹配 7 类任务（chat/reasoning/long_text/professional/agent/vision/video）→ 按质量优先级选出首选模型 → 限流/失败时按 `fallback` 链降级。**选型规则：同任务多模型时优先质量高者（按模型定位与上下文能力排序），费用仅在质量能力相同时作参考，绝不因省钱降低质量**。

实际 fallback 链（仅阿里云 4 模型配置显式 fallback，腾讯 8 模型为独立主干）：
- `qwen_turbo` → `hunyuan_instruct`（对话平级切换）
- `qwen_plus` → `glm_5`（专业任务降级到 Agent 主干）
- `qwen_long` → `kimi_k2`（长文平级切换）
- `deepseek_r1` → `hunyuan_thinking`（推理平级切换）
- 无显式 fallback 的模型（如 `youtu_vita`/`glm_5v`）：先找同类型其他模型，再无则任意可用模型兜底

典型路由：输入含"图片/看图" → 视觉类 → `glm_5v`；输入含"视频/抖音" → 视频类 → `youtu_vita`；无法分类 → 默认 `hunyuan_instruct`。**商业助手场景（8 大场景）不经过对话关键词分类，直接按 ② 场景表选型**，确保方案质量。

**④ 快捷能力（视频解析）**

| 能力 | 触发词/入口 | 模型路由 |
|------|--------|---------|
| 视频解析 | 视频链接解析/内容理解/提取（抖音/快手/小红书/视频号/B站/YouTube 等） | `youtu_vita` |

**⑤ 文档生成（Word / Excel / PPT / PDF 四格式已全部实现，`business-assistant.service.ts` 的 `exportDOCX`/`exportXLSX`/`exportPPT`/`exportPDF`）**

| 阶段 | 质量首选 | 备选 | 产出 |
|------|---------|------|------|
| 1. 方案结构化（模板化，8 大场景） | 按场景表选型（`kimi_k2`/`hunyuan_thinking`/`qwen_plus`） | 场景备选模型 | 结构化方案数据（sections + summary） |
| 2. 文档导出（docx/xlsx/pptx/pdf 渲染） | 规则引擎（docx/ExcelJS/PptxGenJS/PDFKit，无 AI） | — | 可下载文档文件 |
| 3. 合规终审 | `hunyuan_thinking` | `deepseek_r1` | 合规报告 |

**爆款因子注入**：策划/诊断回答注入结构化思维框架与可执行落地方案（企业策划≠标题党，而是"拿来就能用"）；对话/文案注入人味话术（反 AI 化）。
**关卡**：违禁词门（策划/诊断场景重点：金融/医疗承诺类表述必须过合规）、质量门（可执行性与准确性优先于文采）、反 AI 化门（对话与文案）。
**已知局限**：① 视频解析（`youtu_vita`）为腾讯独有模型，火山方舟暂无对等模型可降级（依赖腾讯单点）；② APK 端模型切换为全量 10 模型，但"对话+图片理解"组合输入链路待完善；③ 商业助手 8 大场景默认走后端 `callAI`（model=default，按用户配置的 TokenHub/百炼 生效），场景级模型路由已按 ② 表配置，实际调用链需在部署验证脚本中确认场景参数透传。
**最终交付物**：8 大商业场景方案（可下载 Word / Excel / PPT / PDF 四格式）+ 视频解析结果 + 合规报告；多轮会话保持上下文一致（用会话摘要注入下一轮）。

### 4.3 智能获客（acquisition、data-acquisition）

**目标**：线索挖掘、客户画像、营销内容自动生成。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 行业/客户群分析 | DeepSeek-V4-Pro | Qwen3.8-Max | 目标客户画像 |
| 2. 线索挖掘规则 | Qwen3.8-Max | Doubao-Seed-2.1-Pro | 线索评分规则 |
| 3. 触达话术生成 | Qwen3.8-Max (temp 0.9) | Doubao-Seed-2.1-Pro | 个性化触达话术 |
| 4. 营销内容生成（图文/视频） | 创作工厂产线（复用 4.1） | — | 营销物料 |
| 5. 数据获取/清洗 | DeepSeek-V4-Flash | Qwen3.7-Flash | 结构化线索库 |
| 6. 效果复盘 | DeepSeek-V4-Pro | GLM-5.2 | 转化分析报告 |

**爆款因子注入**：触达话术注入利益型钩子（"学会这招…"）+ CTA 引导；营销内容走 4.1 创作产线，平台差异化。
**关卡**：违禁词门（获客内容广告法合规是重点，营销物料必须过九大类违禁词审查）、反 AI 化门（获客话术 AI 味重会显著降低回复率）。
**最终交付物**：线索名单 + 客户画像报告 + 可直接发送的触达话术（多版本）+ 营销物料包 + 转化分析。

### 4.4 智能招聘（recruitment、interview）

**目标**：职位发布、简历筛选、AI 面试官、自动沟通（批量触达候选人）、Offer 生成。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 职位 JD 生成 | Qwen3.8-Max | DeepSeek-V4-Pro | 岗位 JD |
| 2. 简历解析/结构化 | Kimi K3 | GLM-5.2 | 简历结构化数据 |
| 3. 简历匹配评分 | DeepSeek-V4-Pro | Qwen3.7-Plus | 匹配分 + 理由 |
| 4. AI 面试官（多轮对话） | Qwen3.7-Plus | Doubao-Seed-2.1-Pro | 面试记录 |
| 5. 面试评估报告 | DeepSeek-V4-Pro | Qwen3.8-Max | 候选人评估 |
| 6. 自动沟通话术生成（AI 多场景） | Qwen3.8-Max (temp 0.8) | Doubao-Seed-2.1-Pro | 多版本话术（场景 × 风格） |
| 7. 自动沟通发送（模板渲染） | 规则引擎（无 AI，模板 + 占位符替换） | — | 批量触达消息（按岗位动态替换） |
| 8. Offer 沟通话术 | Qwen3.8-Max | Doubao-Seed-2.1-Pro | Offer 文案 |
| 9. 面试语音转写 | Qwen-Audio-ASR-Flash | WAND-ASR | 转写文本 |

**自动沟通话术机制（话术从哪来——三层来源）**：

1. **用户自定义模板（优先）**：自动沟通发送前，先查询该岗位的 `CandidateSearchConfig` 搜索配置；若配置了 `contactTemplate`（沟通模板），**优先使用用户的模板**。桌面版"自动沟通"配置表单支持录入，最长 500 字，支持 `{{name}}`（候选人姓名）、`{{jobTitle}}`（岗位名称）、`{{company}}`（公司名称）、`{{recruiter}}`（招聘顾问）4 个占位符。
2. **AI 话术生成（定制入口）**：`generateRecruitmentScript` 调用大模型，**输入 = 岗位名 + 场景 + 风格**，动态生成贴合该岗位的多版本话术。后端场景：初次联系 / 跟进沟通 / 面试邀请 / Offer 沟通 / 婉拒通知；桌面版 `/api/ai/generate-script` 提供招聘 6 场景：开场打招呼、职位介绍、面试邀请、跟进提醒、婉拒话术、offer 发放；风格：专业 / 友好 / 简洁；温度 0.8，输出至少 2 个版本，带 `{{变量}}` 标记、最佳实践与异议处理。AI 生成话术可填入 `contactTemplate` 保存后用于自动发送；无 AI 时降级为内置标准话术。
3. **默认模板（兜底）**：未配置自定义模板时，使用内置默认模板——`您好{{name}}，看到您的简历与我们{{jobTitle}}岗位非常匹配，方便聊一下吗？`。

**关键机制：岗位名动态绑定，杜绝串岗**。发送时从数据库读取候选人所属岗位记录（`candidate.post.title`），把 `{{jobTitle}}` 替换为该岗位的真实标题——招聘美容师发出去的就是"美容师岗位"话术，不存在硬编码其他岗位（如设计师）；候选人本身由 `matchCandidates` 按岗位要求（title/requirements/学历/经验/地点）AI 匹配，匹配理由与技能也围绕该岗位生成。

**已知局限**：默认模板只有岗位名是动态的，句子本身为通用句式（"看到您的简历与XX岗位非常匹配"），不会自动带出岗位专属要求（如美容师要求面部护理经验、薪资提成、晋升通道）。深度贴合岗位需走自定义模板或 AI 生成话术。建议将"AI 生成话术 → 一键填入沟通模板"链路产品化（当前桌面版/APK 两处入口分离）。

**爆款因子注入**：JD 注入雇主品牌钩子（差异化价值主张）；自动沟通话术注入利益型钩子（薪资/晋升/团队氛围）+ 反 AI 化（话术 AI 味重会显著降低候选人回复率，需像真人招聘顾问）；面试话术注入"结构化引导 + 共情"（防 AI 面试官机械感——反 AI 化门在此场景针对的是"像真人面试官"）。
**关卡**：合规门（招聘不得含歧视性用语——性别/年龄/地域限制词审查）、质量门、反 AI 化门（针对自动沟通与 AI 面试官的人味）。
**最终交付物**：可发布的 JD + 简历筛选报告（含匹配评分）+ 面试问答记录 + 候选人评估报告 + 多版本自动沟通话术包 + Offer 文案。

### 4.5 数字人（digital-human）

**目标**：数字人分身出镜、口播视频、直播。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 口播脚本生成 | Qwen3.8-Max | DeepSeek-V4-Pro | 口播脚本 |
| 2. 爆款节奏编排 | DeepSeek-V4-Pro | Qwen3.8-Max | 节奏/情绪曲线 |
| 3. 形象/场景设计 | Seedream 5.0 Pro | Qwen-Image-3.0-Pro | 数字人形象图 |
| 4. 数字人驱动 | YT-Video-HumanActor (TokenHub) | Seedance 2.5 数字人 (方舟) | 数字人视频 |
| 5. 配音合成 | 声音复刻 2.0 (方舟) | MiniMax-Voice-Clone | 口播配音 |
| 6. 口型同步/合成 | YT-Video-HumanActor | Seedance 2.5 | 成品视频 |

**爆款因子注入**：口播节奏（钩子→价值→情绪→CTA）与情绪曲线注入脚本阶段。
**关卡**：反 AI 化门（数字人拟真度 <15/100——眨眼规律性、微表情单一性、皮肤均匀度）、合规门（数字人带货必须声明 + 真人备案，2026 平台硬性要求）、AIGC 标识门（虚拟场景必须显式标识）。
**最终交付物**：可发布的数字人口播视频（横/竖版）+ 封面 + 标题 + 发布建议 + 备案声明。

### 4.6 声音克隆 / 配音（voice-clone）

**目标**：用户音色克隆、配音合成、方言配音。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 音频预处理/降噪 | Qwen-Audio-ASR-Flash | WAND-ASR | 干净人声 |
| 2. 音色训练/克隆 | 声音复刻 2.0 (方舟) | MiniMax-Voice-Clone | 克隆音色 |
| 3. 文本转语音 | 声音复刻 2.0 | MiniMax-Speech-2.8-HD | 配音音频 |
| 4. 方言/多语适配 | WAND-Dubbing-Clone-V2 | Qwen-Audio-TTS | 方言配音 |
| 5. 情感/节奏调节 | Doubao-Seed-Audio | MiniMax-Speech-2.8 | 成品音频 |

**关卡**：合规门（音色克隆需用户授权声明——防侵权；平台对克隆音色的授权要求趋严）、反 AI 化门（语音自然度 <15/100）。
**最终交付物**：可直接使用的配音音频文件（mp3/wav）+ 授权记录 + 使用说明。

### 4.7 热点追踪 / 选题推荐（hot-topics、hotspot）

**目标**：全网热点监控、趋势分析、选题推荐——是"爆款基因注入器"的数据源。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 热点采集 | （数据接口：新榜/飞瓜/巨量算数） | — | 原始热点数据 |
| 2. 热点分类/热度评估 | DeepSeek-V4-Pro | Qwen3.8-Max | 热度值/趋势/分类 |
| 3. 关联内容挖掘 | DeepSeek-V4-Pro | Qwen3.8-Max | 关联话题 |
| 4. 选题推荐 | Qwen3.8-Max (temp 0.9) | Doubao-Seed-2.1-Pro | 选题方案 |
| 5. 基于热点生成内容 | 创作工厂产线（4.1） | — | 成稿 |

**爆款因子注入**：热点数据 → 爆款因子包（hooks 权重、情绪曲线、蓝海角度），供全系统消费。
**关卡**：合规门（热点选题不得触碰政治敏感/争议性话题——时效性敏感内容重点审查）、质量门。
**最终交付物**：热点排行榜（热度值/趋势）+ 分类趋势报告 + 选题推荐列表（含理由与角度）+ 与创作工厂的无缝对接。

### 4.8 推荐分享 / 裂变（share、referral）

**目标**：分享码裂变 + 转介绍。核心链路：客户短视频 → 专属分享码/二维码 → 被分享者扫码转发/下载 APK → 效果追踪（PV/UV/注册转化）。

**已实现能力（规则引擎链路，非 AI 编排）**：`/api/share`（分享码生成、落地页 `/s/:codeId` 中转短链、扫码/转发记录、裂变统计）、`/api/referral`（转介绍：我的页二维码推荐 APK 下载）、`/api/statistics`（PV、UV、注册转化统计）。

**AI 辅助能力（可选，复用创作工厂产线）**：分享文案生成（Qwen3.8-Max temp 0.9，多版本）、裂变海报生成（Seedream 5.0 Pro / Qwen-Image-3.0-Pro）——非主链路必需，供分享场景内容增强。

**爆款因子注入**：裂变文案注入利益型钩子（"先收藏免得以后找不到""转发给你身边XXX的人"）+ 社交货币（"这份清单值得分享"）。
**关卡**：违禁词门（分享场景常见"秒杀/抢爆/再不买就没了"类诱导词，必须替换）、合规门（诱导分享需合规——防"全民免单/点击领奖"类违规）。
**最终交付物**：分享码 + 落地页 + 裂变统计 + 转介绍二维码（附 AI 辅助分享文案/海报与合规检查报告）。

### 4.9 业务助手（business-assistant）

**目标**：面向租户的通用业务问答、经营分析。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 问题理解/意图识别 | Qwen3.5-Flash | Doubao-Seed-2.1-Turbo | 意图标签 |
| 2. 数据分析/查询 | DeepSeek-V4-Pro | Qwen3.8-Max | 数据结论 |
| 3. 报告生成 | Qwen3.8-Max | Kimi K3 | 经营分析报告 |
| 4. 图表生成 | Seedream 5.0 Pro | Qwen-Image-3.0-Pro | 可视化图表 |
| 5. 建议生成 | DeepSeek-V4-Pro | Qwen3.7-Plus | 行动建议 |

**关卡**：质量门（数据准确性优先——AI 生成的数据结论必须可溯源）、合规门（金融/经营建议免责声明）。
**最终交付物**：可直接阅读的经营分析报告（含数据、图表、建议、免责声明）。

### 4.10 素材管理（materials）

**目标**：素材生成、智能检索、批量处理。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 素材理解/标签化 | HY-Vision-2.0 | Doubao-Seed-2.0-Lite 全模态 | 素材标签 |
| 2. 素材向量化 | Qwen3.7-Text-Embedding | Kinfra-Embedding | 向量索引 |
| 3. 素材生成 | Seedream 5.0 / Seedance 2.5 / MiniMax-Speech | 对应备选 | 新素材 |
| 4. 批量处理（抠图/增强/裁剪） | Qwen-Image-Edit | Seedream 5.0 编辑 | 处理素材 |
| 5. 智能检索 | Qwen3.7-Text-Embedding + RAG | Kinfra 系列 | 检索结果 |

**关卡**：合规门（素材版权/肖像权审查）、质量门。
**最终交付物**：可检索的素材库（标签+向量索引）+ 新生成素材 + 处理后的成品素材。

### 4.11 AI 工作流 / Agent 编排（ai-workflow、ai-enhanced）

**目标**：多步复杂任务的自动编排（跨模块组合）。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 工作流规划 | Qwen3.7-Plus (混合智能体) | Doubao-Seed-2.1-Pro | 执行计划 |
| 2. 子任务调度 | Qwen3.7-Plus | GLM-5.2 | 任务队列 |
| 3. 工具调用/代码执行 | Kimi-K2.7-Code | Qwen3.8-Max | 执行结果 |
| 4. 结果聚合 | DeepSeek-V4-Pro | Qwen3.8-Max | 聚合报告 |
| 5. 质量校验 | DeepSeek-V4-Flash | GLM-5.2 | 校验报告 |

**关卡**：质量门（每步产物校验）、合规门（Agent 行为边界——不执行越权/敏感操作）。
**最终交付物**：完整执行结果（可含多模块产物）+ 执行日志 + 校验报告。

### 4.12 多模态理解（multimodal）

**目标**：图片/视频/音频理解、内容审查、元数据提取。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 图片理解 | HY-Vision-2.0 / Qwen3.8-Max | Doubao-Seed-2.0-Lite | 图片描述/OCR |
| 2. 视频理解 | YT-VITA | Doubao-Seed-2.1-Pro | 视频内容摘要 |
| 3. 音频理解 | Qwen-Audio-ASR | WAND-ASR | 转写/分析 |
| 4. 安全审查 | HY-Vision-2.0 + YT-VITA | — | 合规判定 |

**关卡**：无（作为基础设施服务其他模块）。
**最终交付物**：结构化理解结果（描述/OCR/摘要/转写）+ 安全审查结论。

### 4.13 管理后台 AI（admin）

**目标**：平台数据洞察、日志分析、公告生成、风险预警。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 数据洞察 | DeepSeek-V4-Pro | Qwen3.8-Max | 运营分析 |
| 2. 日志/异常分析 | DeepSeek-V4-Flash | GLM-5.2 | 异常报告 |
| 3. 公告/通知生成 | Qwen3.8-Max | Doubao-Seed-2.1-Pro | 公告文案 |
| 4. 风险预警 | DeepSeek-V4-Pro | Qwen3.7-Plus | 预警清单 |

**关卡**：合规门（公告措辞合规）、质量门（数据准确性）。
**最终交付物**：运营分析报告 + 异常日志报告 + 可发布的公告文案 + 风险预警清单。

### 4.14 代理商门户 AI（agent）

**目标**：代理商侧业务支持、客户推荐、业绩分析。

| 阶段 | 首选模型 | 备选模型 | 产出 |
|------|---------|---------|------|
| 1. 业务问答 | Qwen3.8-Max | Doubao-Seed-2.1-Pro | 回答 |
| 2. 客户推荐话术 | Qwen3.8-Max (temp 0.9) | Doubao-Seed-2.1-Pro | 推荐话术 |
| 3. 业绩分析 | DeepSeek-V4-Pro | GLM-5.2 | 分析报告 |
| 4. 培训材料生成 | Kimi K3 | GLM-5.2 | 培训文档 |

**关卡**：违禁词门（代理商话术合规——防虚假承诺）、质量门。
**最终交付物**：业务问答 + 推荐话术（多版本）+ 业绩分析报告 + 培训材料。

---

## 第五章 全类目交付物清单

| 业务类目 | 最终交付物 | 必带横切要素 |
|---------|-----------|-------------|
| 4.1 创作工厂 | 多平台成品（图文/视频/封面/标题/标签/发布建议）+ 智能剪辑成片（多素材合成视频+字幕+配音+BGM） | 爆款因子+合规报告+AIGC标识 |
| 4.2 AI 助手（APK） | 8 大商业场景方案（Word/Excel/PPT/PDF 四格式）+ 视频解析 + 日常对话/深度推理 | 结构化框架+合规话术+反AI化+质量优先选型 |
| 4.3 智能获客 | 线索名单+画像+触达话术+营销物料 | 广告法合规+反AI化 |
| 4.4 智能招聘 | JD+筛选报告+面试记录+评估报告+Offer | 无歧视合规 |
| 4.5 数字人 | 数字人视频+封面+发布建议 | 拟真度<15+备案声明+AIGC标识 |
| 4.6 声音克隆 | 配音音频+授权记录 | 授权合规+自然度<15 |
| 4.7 热点追踪 | 热点榜+趋势报告+选题列表 | 敏感话题合规 |
| 4.8 推荐分享 | 分享文案(多版)+裂变海报+传播评分 | 诱导词替换+合规 |
| 4.9 业务助手 | 经营分析报告+图表+建议 | 数据可溯源+免责 |
| 4.10 素材管理 | 素材库+新素材+处理成品 | 版权审查 |
| 4.11 AI工作流 | 执行结果+日志+校验报告 | 行为边界合规 |
| 4.12 多模态 | 结构化理解+安全结论 | 无（基础设施） |
| 4.13 管理后台 | 运营报告+日志分析+公告+预警 | 数据准确 |
| 4.14 代理商 | 问答+话术+业绩报告+培训材料 | 话术合规 |

**"全类目必须产出最终交付物"的实现保证**：每个类目产线末尾强制挂接"交付物组装器"（Assembly Gate）——把阶段产物组装为用户可用的成品（如创作工厂的视频+封面+标题+标签+发布建议打包为发布包；招聘的 JD+报告打包为招聘包），未组装完成不算完成。交付物包含必要的横切要素（合规报告、AIGC 标识、质量报告）。

---

## 第六章 工程实施

### 6.1 接入层架构

```
┌─────────────────────────────────────────────────┐
│  业务层：14 大类目产线编排器（各业务服务）            │
├─────────────────────────────────────────────────┤
│  横切层：违禁词门 / 反AI化门 / 爆款因子 / 质量门 / 标识门 │
├─────────────────────────────────────────────────┤
│  路由层：AIModelRouter（任务分类→模型选择→降级链）     │
├─────────────────────────────────────────────────┤
│  适配层：OpenAI 兼容协议统一封装                     │
│   ├─ TokenHub:  https://tokenhub.tencentmaas.com/v1
│   ├─ 百炼:      https://dashscope.aliyuncs.com/compatible-mode/v1
│   └─ 方舟:      https://api.volcengine.com/ark/v1
└─────────────────────────────────────────────────┘
```

统一封装要点：chatCompletion / generateImage / generateVideo / textToSpeech / embedding 五类接口，每家 baseUrl + apiKey 仅差配置项；图片/视频/语音的多模态端点差异（异步 submit+poll 等）封装在适配层，业务层无感。

### 6.2 配置管理

- **模型注册表**（model-registry）：统一管理 model id、服务商、能力域、成本级、可用状态、**下线预警位**（TokenHub 旧 kl-*/vd-*/hy-image-v3.0 标记 9/15 下线，触发自动迁移到新命名）
- **能力域映射**：每个业务阶段 → 能力域（text/image/video/tts/vision/embedding/agent）→ 模型三级链（主选/备选/兜底）
- **密钥管理**：三平台 API Key 存环境变量（服务端）；桌面化后客户自带 Key 场景不再使用 Web localStorage，改存**系统凭据管理器**（Tauri keyring crate），AI 请求经 **Rust 主进程 AI 代理**转发，密钥不出主进程、不落前端，平台不代付
- **A/B 灰度**：模型升级走灰度开关，先在低流量类目验证质量再全量

### 6.3 监控与成本

- **质量监控**：每阶段质量分、回退率、3 次重试率（>10% 触发告警）
- **成本监控**：每类目 token 消耗、按量/订阅成本、单交付物成本
- **可用性监控**：三平台成功率/时延/限流率，降级触发次数
- **合规监控**：违禁词拦截率、AIGC 标识漏标率（漏标 = 平台处罚风险，重点监控）

---

## 附录 A 模型注册表（三服务商全量，2026-08-12 核实）

### A.1 腾讯云 TokenHub

| 能力域 | 模型 | API Model ID | 状态 |
|--------|------|-------------|------|
| 文本 | 混元 Hy3 | `hy3` | 在售 |
| 文本 | 混元 Hy3 Preview | `hy3-preview` | ⚠️ 8/31 下线 |
| 文本 | DeepSeek-V4-Pro | `deepseek-v4-pro-202606` | 正式版/原厂直供 |
| 文本 | DeepSeek-V4-Flash | `deepseek-v4-flash-202605` | 正式版/原厂直供 |
| 文本 | GLM-5.2/5.1/5 | `glm-5.2` 等 | 在售 |
| 文本 | Kimi K3 / K2.7-Code | `kimi-k3` / `kimi-k2.7-code` | 在售 |
| 文本 | MiniMax-M3/M2.7 | `minimax-m3` / `minimax-m2.7` | 在售 |
| 文本 | Qwen3.5-Flash/Plus | `qwen3.5-flash` / `qwen3.5-plus` | 在售 |
| 文本 | MiMo-V2.5-Pro | `mimo-v2.5-pro` | 在售 |
| 角色 | Hunyuan-Role | `hunyuan-role-latest` / `hy-role` | 在售 |
| 翻译 | Hy-MT2-Pro/Plus/Lite | `hy-mt2-pro` 等 | 在售 |
| 图像 | HY-Image-3.0 | `hy-image-v3.0` / `hy-image-lite` | ⚠️ 9/15 下线 |
| 图像 | Vidu-Image-Q2 | `vidu-image-q2` | 在售 |
| 视频 | Kling-V3/V3-Omni/V3-Turbo/O1/V2.6 | `kling-video-v3` 等（新命名） | 在售 |
| 视频 | Kling 旧系列 | `kl-*`（15 个） | ⚠️ 9/15 统一下线 |
| 视频 | MiniMax-Video-H3/v2.3 | `minimax-video-h3` 等 | 在售 |
| 视频 | Vidu-Q3-Pro/Turbo/Q3/Q2 | `vidu-video-q3-pro` 等（新命名） | 在售 |
| 视频 | Vidu 旧系列 | `vd-*` | ⚠️ 9/15 统一下线 |
| 视频 | PixVerse-V6.0/V5.6/C1 | `pixverse-video-v6.0` 等 | 在售 |
| 视频 | HY-Video-1.5 | `hy-video-1.5` | 在售 |
| 视频 | YT-Video-2.0 / FX | `yt-video-2.0` / `yt-video-fx` | 在售 |
| 数字人 | YT-Video-HumanActor | `yt-video-humanactor` | 在售 |
| 3D | HY-3D-3.0/3.1/Express | `hy-3d-3.0` 等 | 在售 |
| 语音 | MiniMax-Speech-2.8-HD/Turbo | `minimax-speech-2.8-hd` 等 | 在售 |
| 语音 | MiniMax-Voice-Clone / Voice-Design | `minimax-voice-clone` 等 | 在售 |
| 语音 | MiniMax-Music-V2.6 | `minimax-music-v2.6` | 在售 |
| 语音 | WAND-Dubbing-Clone-V1/V2 | `wand-dubbing-clone-v1` 等 | 在售 |
| 语音 | WAND-ASR / HY-ASR-3.0 | `wand-asr-v1` / `hy-asr-3.0-preview` | 在售 |
| 视觉 | HY-Vision-2.0-Instruct | `hy-vision-2.0-instruct` | 在售 |
| 视觉 | HY-Vision-1.5-Thinking | `hunyuan-t1-vision-20250916` | 在售 |
| 视觉 | HY-Vision-Video | `hunyuan-turbos-vision-video-20250728` | 在售 |
| 多模态 | YT-VITA | `youtu-vita` | 在售 |
| 向量 | Kinfra-Text-Embedding | `kinfra-text-embedding-0.6b/4b` | 在售 |
| 向量 | Kinfra-VL-Embedding | `kinfra-vl-embedding-2b/8b` | 在售 |

### A.2 阿里云百炼

| 能力域 | 模型 | API Model ID | 状态 |
|--------|------|-------------|------|
| 文本 | Qwen3.8-Max | `qwen3.8-max` | 正式版（8/6 起，preview 已下线） |
| 文本 | Qwen3.7-Plus | `qwen3.7-plus` | 在售 |
| 文本 | Qwen3.7-Flash | `qwen3.7-flash` | 在售 |
| 文本 | Qwen-Max/Plus/Turbo | `qwen-max` 等 | 经典系列 |
| 文本 | DeepSeek-V4-Pro | `deepseek-v4-pro` | 在售 |
| 文本 | DeepSeek-V4-Flash | `deepseek-v4-flash-0731` | 8/1 稳定版 |
| 文本 | Kimi K3 | `kimi/kimi-k3` | 在售（7/28 可调用） |
| 文本 | GLM-5.2 | `glm-5.2` | 在售 |
| 文本 | MiniMax-M3/M2.7 | `MiniMax-M3` 等 | 在售 |
| 文本 | 阶跃星辰 | `stepfun/step-3.7-flash` | 在售 |
| 图像 | Qwen-Image-3.0-Pro | `qwen-image-3.0-pro` | 在售 |
| 图像 | Qwen-Image-3.0 | `qwen-image-3.0` | 8/4 新增 |
| 图像 | Qwen-Image-Edit | `qwen-image-edit` | 在售 |
| 图像 | Wan2.7-Image-Pro | `wan2.7-image-pro` | 快照形式（待确认） |
| 视频 | Wan3.0 | `wan3.0-video` | 8/6 公测 |
| 视频 | 可灵 Kling | `kling/kling-v3-video-generation` | 在售 |
| 视频 | Vidu Q3 | `vidu/viduq3-pro-*` | 在售 |
| 视频 | PixVerse-V6 | `pixverse/pixverse-v6-t2v` 等 | 在售 |
| 语音 | Qwen-Audio-3.0-TTS | `qwen-audio-3.0-tts` | 7/20 上线 |
| 语音 | Qwen-Audio-3.0-TTS-Plus | `qwen-audio-3.0-tts-plus` | 在售 |
| 语音 | Qwen-Audio-3.0-ASR-Flash | `qwen-audio-3.0-asr-flash` | 7/30 ASR |
| 语音 | MiniMax-Speech-2.8 | `MiniMax/speech-2.8-hd` | 在售 |
| 向量 | Qwen3.7-Text-Embedding | `qwen3.7-text-embedding` | 在售 |
| 音乐 | Fun-Music-V1 | `fun-music-v1` | 在售 |

### A.3 火山方舟

| 能力域 | 模型 | API Model ID | 状态 |
|--------|------|-------------|------|
| 文本 | Doubao-Seed-2.1-Pro | `doubao-seed-2-1-pro-260628` | 最新旗舰（6/23） |
| 文本 | Doubao-Seed-2.1-Turbo | `doubao-seed-2-1-turbo-260628` | 高频生产 |
| 文本 | Doubao-Seed-2.0-Pro/Lite/Mini/Code | `doubao-seed-2-0-*-260215` | 在售 |
| 文本 | Doubao-Seed-Evolving | `doubao-seed-evolving` | 7 月开放 |
| 文本 | Doubao-Seed-1.8/1.6 系列 | `doubao-seed-1-8-*` 等 | 上代旗舰 |
| 推理 | Seed2.1 Deep Think | `doubao-seed-2-1-pro` 推理时配置 | 推理循环 |
| 推理 | Doubao-Seed-1.6-Thinking | `doubao-seed-1-6-thinking-251015` | 深度思考 |
| 图像 | Seedream 5.0 Pro | `doubao-seedream-5-0-pro-260628` | 最新旗舰 |
| 图像 | Seedream 5.0 Lite | `doubao-seedream-5-0-lite-*` | 组图/流式 |
| 图像 | Seedream 4.5/4.0/3.0 | `doubao-seedream-4-*` 等 | 在售 |
| 图像 | SeedEdit 3.0 | `doubao-seededit-3-0-i2i-250628` | 图生图编辑 |
| 视频 | Seedance 2.5 | `doubao-seedance-2-5-*` | 最新（7/31 发布，8 月公测） |
| 语音 | Doubao-Seed-Audio 1.0 | `doubao-seed-audio-1.0` | 高自然度 TTS |
| 语音 | 声音复刻 2.0 | 控制台开通 | 国产最强音色克隆 |
| 多模态 | Doubao-Seed-2.0-Lite | `doubao-seed-2-0-lite-260215` | 全模态统一理解 |
| 第三方 | DeepSeek-V4-Flash/Pro | 方舟渠道 | Coding Plan |
| 第三方 | GLM-5.2 | 方舟渠道 | Coding Plan |
| 第三方 | Kimi-K2.7 | 方舟渠道 | Coding Plan |
| 第三方 | MiniMax-M3 | 方舟渠道 | Coding Plan |

> 注：方舟多模态第三方未接入，视频/图像/语音完全依赖自研（Seedance/Seedream/Seed-Audio），这是其优势集中点。

---

## 附录 B API 规范

### B.1 三家 baseUrl 与协议

| 服务商 | BaseURL | 协议 |
|--------|---------|------|
| TokenHub | `https://tokenhub.tencentmaas.com/v1` | OpenAI 兼容（另支持 Anthropic） |
| 百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI 兼容 |
| 方舟 | `https://api.volcengine.com/ark/v1` | OpenAI 兼容（推理接入点 endpoint id 模式） |

### B.2 多模态端点差异（适配层封装）

| 能力 | TokenHub | 百炼 | 方舟 |
|------|---------|------|------|
| 图片生成 | `/v1/images/generations` | multimodal-generation 同步 / image-generation 异步 | 方舟图像端点 |
| 视频生成 | `/v1/api/video/submit`（原生 submit+poll） | `/api/v1/services/aigc/video-generation/video-synthesis` | 方舟视频端点（Seedance 公测） |
| TTS | 原生端点 | multimodal-generation + qwen-tts | Seed-Audio 端点 |

### B.3 统一封装接口

```
POST /v1/chat/completions    → chatCompletion(userId, {model, messages, temperature, ...})
POST /v1/images/generations  → generateImage(userId, {model, prompt, negativePrompt, size, n})
POST /v1/videos/generations  → generateVideo(userId, {model, prompt, referenceImage, duration})
POST /v1/audio/speech        → textToSpeech(userId, {model, text, voice, emotion})
POST /v1/embeddings          → embedding(userId, {model, input})
```

---

## 附录 C 变更记录与下线预警（2026-08-12）

| 日期 | 事件 | 影响 |
|------|------|------|
| 2026-08-14 | **V2.0 桌面化适配**：产品主形态改 Tauri 2.x 桌面安装版；修正前端载体表述（Web 端→桌面版）与密钥管理（客户自带 Key 改系统凭据管理器 + Rust 主进程 AI 代理） | 模型清单/路由/横切关卡均不受影响 |
| 2026-08-14 | **4.1 智能剪辑类目新增（V2.1）**：AI 创作工厂 10→11 创作类目，新增 ⑪ 智能剪辑——多视频素材上传 → AI 识别剪辑点/脚本结构/配音/字幕/BGM/调色 → 桌面本地 FFmpeg 引擎合成一条成片；视频物理合成本地执行，不消耗视频生成配额；新增专属产线表 | 创作工厂类目补齐（桌面版 video-editing） |
| 2026-07-17 | Kimi K3 发布，百炼/TokenHub 同步上架 | 长文本能力升级 |
| 2026-07-31 | Seedance 2.5 发布（8 月 API 公测） | 视频主引擎候选 |
| 2026-08-01 | 百炼 DeepSeek-V4-Flash 稳定版（0731）上架 | 快速任务升级 |
| 2026-08-04 | 百炼 Qwen-Image-3.0 上架 | 图像补充 |
| 2026-08-05 | Qwen3.8-Max-Preview 下线 | 需迁移 `qwen3.8-max` |
| 2026-08-06 | Qwen3.8-Max 正式版路由；Wan3.0 公测 | 文本/视频天花板确立 |
| 2026-08-07 | TokenHub MiniMax-M2.5 下线 | 迁移 minimax-m3/m2.7 |
| 2026-08-31 | TokenHub Hy3-Preview 下线 | 迁移 hy3 |
| 2026-09-15 | TokenHub 旧 Kling(`kl-*`)/Vidu(`vd-*`)/HY-Image-V3.0/Lite 统一下线 | **高优先级迁移：kling-*/vidu-*/弃用图像转方舟/百炼** |
| 2026-08-13 | **4.4 智能招聘修正（V1.1）**：补充"自动沟通话术机制"——三层话术来源（用户自定义模板 `contactTemplate` 优先 → AI 话术生成 `generateRecruitmentScript`/`/api/ai/generate-script` → 默认模板兜底）、4 个占位符（`{{name}}/{{jobTitle}}/{{company}}/{{recruiter}}`）、`{{jobTitle}}` 按候选人所属岗位动态替换杜绝串岗；产线表新增阶段 6/7（自动沟通话术生成、自动沟通发送） | 招聘产线模型路由补齐 |
| 2026-08-13 | **4.2 AI 助手（APK）重写（V1.2）**：从"企业策划/诊断对话"扩展为全功能多模态助手——① 12 模型清单（`hunyuan_instruct/thinking`、`kimi_k2`、`glm_5/glm_5v`、`youtu_vita`、`hy_image`、`digital_human`、`qwen_turbo/plus/long`、`deepseek_r1`）覆盖 8 类任务（对话/推理/长文/Agent/视觉/视频/图像/数字人），与 `ai-model-router.ts` 对齐；② 智能调度机制（关键词分类→自动选型→fallback 降级链→费用优化）；③ 6 大快捷能力（企业诊断/内容创作/图片生成/视频解析/短视频制作/AI 数字人）；④ 明确已知局限：Excel/PPT/PDF 导出尚未实现（仅 Word 可用）、视频/图像/数字人无方舟降级 | APK 端 AI 助手模型配置补齐 |
| 2026-08-13 | **4.2 AI 助手（APK）质量优先重写（V1.3）**：修正 V1.2 的三处错误——① **模型 ID 修正**：`hunyuan_instruct` = `hunyuan-2.0-instruct-20251111`、`hunyuan_thinking` = `hunyuan-2.0-thinking-20251109`（V1.2 误写成 `deepseek-v4-pro-202606`）；② **调度原则改为质量优先**：同任务多模型按质量排序选型，费用仅作平级参考，删除"费用优化"表述；③ **文档生成局限修正**：`exportDOCX/exportXLSX/exportPPT/exportPDF` 已在 `business-assistant.service.ts` 全部实现，删除"仅 Word 可用"过时描述；④ **新增 8 大商业场景 × 质量优先模型配置**（`startup`/`operations`/`diagnosis`/`media_operations`/`product_promotion`/`competitive_analysis`/`brick_and_mortar`/`marketing` → `kimi_k2`/`hunyuan_thinking`/`qwen_plus` 按场景选型），对应 `BUSINESS_SCENARIOS`；⑤ **降级链修正**：实际链为 `qwen_turbo→hunyuan_instruct`、`qwen_plus→glm_5`、`qwen_long→kimi_k2`、`deepseek_r1→hunyuan_thinking`，删除不存在的"GLM-5.2/Kimi↔GLM"描述 | APK 端 AI 助手质量优先配置修正 |
| 2026-08-13 | **4.2 AI 助手（APK）功能边界收窄（V1.4）**：AI 助手功能收敛为 **8 大商业场景 + 文档导出（docx/xlsx/pptx/pdf）+ 视频解析 + 日常对话/推理**——① **删除短视频制作**（AI 创作工厂 4.1 已含短视频脚本产线）；② **删除 AI 数字人**（4.5 数字人类目独立覆盖）；③ **删除内容创作**（8 大场景中自媒体运营/产品宣传/市场营销本身即内容创作产出，且 4.1 含文案产线）；④ **删除图片生成**（`business-assistant.service.ts` 无 image 调用，8 场景与文档导出为纯文本+规则引擎渲染链路，且 4.1 含图片生成产线）；⑤ **企业诊断不再单列快捷能力**（= 8 大场景 `diagnosis`）；⑥ 快捷能力仅保留 **视频解析**（`youtu_vita`）；⑦ `hy_image`/`digital_human` 等模型仍保留在 APK 端 12 模型切换清单（UI 事实），但不属 AI 助手功能定位。避免重复功能影响后续真实开发 | APK 端 AI 助手功能边界收窄 |
| 2026-08-13 | **4.2 AI 助手（APK）代码残留清除（V1.5）**：按用户要求将 V1.4 收窄落实到 APK 端代码——① `AIChatScreen.tsx`：删除 `AI_MODELS` 中 `hy_image`/`digital_human` 两个模型（12→10）、删除 iconMap/colorMap 对应映射、删除 `QUICK_ACTIONS` 中内容创作/图片生成/短视频制作/AI数字人 4 项入口（6→2，仅剩企业诊断/视频解析）、更新欢迎消息、清理未使用 `RECOMMENDED_MODELS` 导入；② `ai-model-router.ts`：删除 `hy_image`/`digital_human` 模型定义、`TaskType` 中 `image`/`digital_human`、`analyzeTask` 检测分支、`getTaskTypeName`/`getTaskTypeIcon` 映射（任务分类 9→7）；③ `ai-chat.service.ts`：删除 `ImageGenerateRequest` 接口、`generateImage` 方法、`RECOMMENDED_MODELS` 中 `image`/`digitalHuman`、`ALL_MODELS` 中 HY-Image-V3.0/YT-Video-HumanActor；④ AI 创作工厂（`content.service.ts` 独立 `generateImage`、AIImage/AIVideo/DigitalHuman 页面）不受影响，保留 `/ai-chat/image` 端点。文档与代码完全对齐 | APK 端 AI 助手代码清除 |

**迁移优先级**：P0（9/15 前必须完成）：旧 `kl-*`/`vd-*` → 新 `kling-*`/`vidu-*`；HY-Image-V3.0/Lite → Seedream 5.0 或 qwen-image。P1（8/31 前）：hy3-preview → hy3。P2：MiniMax-M2.5 → M3/M2.7。

---

## 参考来源

1. [腾讯云 TokenHub 模型列表（2026-08-12 更新）](https://cloud.tencent.com/document/product/1823/130051)
2. [腾讯云 TokenHub 视频生成模型调用概览](https://cloud.tencent.com/document/product/1823/135738)
3. [腾讯云 TokenHub DeepSeek 调用指南](https://cloud.tencent.com/document/product/1823/132248)
4. [腾讯云大模型 Token Plan 活动页](https://cloud.tencent.com/act/pro/tokenplan)
5. [阿里云百炼 模型上下架与更新](https://help.aliyun.com/zh/model-studio/newly-released-models)
6. [阿里云百炼 qwen3.8-max 模型信息](https://help.aliyun.com/zh/model-studio/qwen3-8-max)
7. [阿里云百炼 Coding Plan 文档](https://help.aliyun.com/zh/model-studio/coding-plan)
8. [阿里云百炼 OpenAI 兼容命名规范](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)
9. [火山引擎豆包大模型平台 / 火山方舟文档](https://www.volcengine.com/docs/82379)
10. [字节 Seed 研究官网（Seedream/Seedance/Seed-Audio）](https://research.doubao.com)
11. [2026 FORCE 原动力大会 Seedance 2.5 / Seedream 5.0 发布报道](https://www.volcengine.com)
12. [AI生成内容标识办法 三平台落地差异](https://www.byerisk.com/blog/aigc-content-labeling-3-platform-comparison)
13. [关于印发《人工智能生成合成内容标识办法》的通知（国家网信办等四部门，2025-09-01 施行）](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
14. [GB 45438-2025《网络安全技术 人工智能生成合成内容标识方法》（强制性国标）](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=F32EA2A561F1886CD8D606513512D547)
13. [2025 新《广告法》违禁词敏感词汇总（食药法苑）](https://news.qq.com/rain/a/20251021A02S5O00)
14. [AI 文本检测原理解析：perplexity 与 burstiness](https://www.cnblogs.com/zhizhan-unfoxai/p/21963223)
15. [小红书爆款标题 Prompt 公式](https://cloud.tencent.com/developer/article/2694007)
16. [2026 抖音算法底层逻辑与实操指南](https://blog.csdn.net/2403_89677939/article/details/157697214)
17. [智枢 AI 创作工厂——AI 模型配置总蓝皮书 V3.1（内部）](docs/AI创作工厂模型配置总蓝皮书.md)

---

*免责声明：本蓝皮书为技术配置方案，模型清单与价格基于 2026-08-12 各服务商官方公开信息整理，实际以各平台控制台为准；涉及"待确认"项请在接入时复核。订阅价格可能存在限时优惠，最终以平台计费为准。*
