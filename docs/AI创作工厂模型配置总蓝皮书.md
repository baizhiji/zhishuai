# 智枢 AI 创作工厂——AI 模型配置总蓝皮书

**版本**: v3.1  
**日期**: 2026-08-05  
**状态**: 完整规划（含质量优先最高配置方案 + 视频生产配置系统）  
**变更**: 精简为 10 个类目（删除短视频脚本——由自由创意短片替代、删除爆款内容创意——能力内嵌各 pipeline）；去除 hy3 模型引用统一使用 deepseek-v4-pro-tc；图片分辨率升级 2048x2048，视频 1080p@30fps（cinemaShort 4K）；强化反AI化：真人出镜/真实场景/户外实景/真人说话/真人写作/真人拍摄效果/真人剪辑

---

## 一、核心设计哲学（三大铁律）

### 铁律 1：全类目必须产出最终交付物

AI 创作工厂的 10 个类目，每一个都必须产出用户可直接使用的内容成品，不允许任何类目只产出"脚本""方案""策划"等中间产物。具体来说：

- 小红书图文类目 → 产出可直接发布的图文（文案 + 配图）
- 图片生成类目 → 产出高清商业图片文件
- 电商详情页类目 → 产出详情页文案 + 主图 + 详情图完整素材包
- 自由创意短片（AI 导演模式）→ 产出 6 镜头叙事短片
- 企业宣传视频类目 → 产出脚本 + AI 生成的分镜视频片段
- 产品宣传视频类目 → 产出完整带货视频 MP4（脚本 → TTS 配音 → 产品图转视频 → 字幕合成）
- 探店视频类目 → 产出脚本 + 分镜视频片段
- 真人 MV 视频类目 → 产出脚本 + AI 生成的 MV 视频 MP4
- 萌宠卡通短视频类目 → 产出脚本 + AI 生成的卡通视频 MP4
- 数字人类目 → 产出口播视频 MP4（脚本 → TTS → 数字人出镜合成）
- 自由创意短片类目 → 产出一句话创意视频 MP4（创意解析 → 场景拆解 → 人物锚定 → 片段并行生成 → 拼接 → BGM）

每个类目可在前端选择"仅生成脚本"（快速模式）或"完整生成"（全链路模式），默认走完整生成。

### 铁律 2：双平台全模型开放接入

腾讯云 TokenHub 和阿里云百炼两个平台上所有可用模型——包括自有模型和第三方模型——全部纳入模型注册表和路由策略。用户自行申请 API Key，充值后即可调用。平台不做模型限制，不做代付，不做捆绑。这意味着当前约 90+ 个模型全部可用，用户可根据自身需求、预算和质量偏好自由组合。

### 铁律 3：四大横切模块零容忍

四条横切能力嵌入所有产线的所有阶段，没有例外：

1. **违禁内容检测**：所有输入和输出必须通过内容安全审查，不合规内容立即拦截，不允许进入下一阶段
2. **去 AI 化检测**：所有产出在交付前必须通过六维 AI 痕迹评分，超过阈值强制回退重生成
3. **爆款内容创意**：所有产线启动第一步必须是爆款因子提取，注入到后续所有阶段
4. **质量优先**：每个阶段结束必须过质量关卡，不达标回退重生成，最多迭代 3 次

---

## 二、全模型注册表（90+ 模型）

### 2.1 腾讯云 TokenHub 全模型（60 个）

#### 语言模型（28 个）

| 序号 | 模型名称 | Model ID | 厂商 | 上下文窗口 | 适用场景 |
|------|----------|----------|------|------------|----------|
| 1 | Hy3 | `hy3` | 腾讯混元 | 256k | 通用文本主创 |
| 2 | Hy3 preview | `hy3-preview` | 腾讯混元 | 256k | 最新混元预览版 |
| 3 | Hy-MT2-Pro | `hy-mt2-pro` | 腾讯混元 | 8k | 翻译旗舰 |
| 4 | Hy-MT2-Plus | `hy-mt2-plus` | 腾讯混元 | 8k | 翻译标准版 |
| 5 | Hy-MT2-Lite | `hy-mt2-lite` | 腾讯混元 | 8k | 翻译轻量版 |
| 6 | Hy-Role-Latest | `hunyuan-role-latest` | 腾讯混元 | 32k | 角色扮演/口语化重写 |
| 7 | Hy-Role | `hy-role` | 腾讯混元 | 32k | 角色扮演稳定版 |
| 8 | DeepSeek-V4-Flash 原厂 | `deepseek-v4-flash-202605` | DeepSeek | 1M | 高速创意初稿 |
| 9 | DeepSeek-V4-Pro 原厂 | `deepseek-v4-pro-202606` | DeepSeek | 1M | 旗舰文本主创 |
| 10 | DeepSeek-V4-Flash | `deepseek-v4-flash` | DeepSeek | 1M | 腾讯镜像版 Flash |
| 11 | DeepSeek-V4-Pro | `deepseek-v4-pro` | DeepSeek | 1M | 腾讯镜像版 Pro |
| 12 | DeepSeek-V3.2 | `deepseek-v3.2` | DeepSeek | 128k | 退役版（2026-7-16 下线） |
| 13 | GLM-5.2 | `glm-5.2` | 智谱 AI | 1M | 长文本/逻辑推理 |
| 14 | GLM-5.1 | `glm-5.1` | 智谱 AI | 200k | 稳定推理版 |
| 15 | GLM-5V-Turbo | `glm-5v-turbo` | 智谱 AI | 200k | 视觉+文本混合推理 |
| 16 | GLM-5-Turbo | `glm-5-turbo` | 智谱 AI | 200k | 高速推理版 |
| 17 | GLM-5 | `glm-5` | 智谱 AI | 200k | 通用推理版 |
| 18 | Kimi K2.7 Code HighSpeed | `kimi-k2.7-code-highspeed` | 月之暗面 | 256k | 代码高速版 |
| 19 | Kimi K3 | `kimi-k3` | 月之暗面 | 1M | Kimi 最新旗舰 |
| 20 | Kimi K2.7 Code | `kimi-k2.7-code` | 月之暗面 | 256k | 代码标准版 |
| 21 | Kimi K2.6 | `kimi-k2.6` | 月之暗面 | 256k | 稳定推理版 |
| 22 | Kimi K2.5 | `kimi-k2.5` | 月之暗面 | 256k | 通用推理版 |
| 23 | MiniMax-M3 | `minimax-m3` | MiniMax | 1M | MiniMax 旗舰 |
| 24 | MiniMax-M2.7 | `minimax-m2.7` | MiniMax | 200k | 稳定版 |
| 25 | MiniMax-M2.5 | `minimax-m2.5` | MiniMax | 200k | 通用版 |
| 26 | Qwen3.5-Flash | `qwen3.5-flash` | 阿里(通义千问) | 991k | 高速轻量版 |
| 27 | Qwen3.5-Plus | `qwen3.5-plus` | 阿里(通义千问) | 991k | 旗舰全能版 |
| 28 | MiMo-V2.5-Pro | `mimo-v2.5-pro` | 小米 | 1M | 小米旗舰 |

#### 图像生成模型（2 个）

| 序号 | 模型名称 | Model ID | 厂商 | 支持任务 |
|------|----------|----------|------|----------|
| 1 | HY-Image-V3.0 | `hy-image-v3.0` | 腾讯混元 | 文生图、图生图 |
| 2 | HY-Image-Lite | `hy-image-lite` | 腾讯混元 | 文生图（轻量） |

#### 视频生成模型（19 个）

**腾讯混元/优图系列（4 个）**

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | HY-Video-1.5 | `hy-video-1.5` | 腾讯混元 | 通用视频生成 |
| 2 | YT-Video-2.0 | `yt-video-2.0` | 腾讯优图 | 广告创意视频 |
| 3 | YT-Video-HumanActor | `yt-video-humanactor` | 腾讯优图 | 数字人/人像驱动 |
| 4 | YT-Video-FX | `yt-video-fx` | 腾讯优图 | 视频特效 |

**快手可灵系列（9 个）**

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 5 | Kling-Video-v3 | `kl-video-v3` | 快手 | 最新旗舰，产品形态保持最稳 |
| 6 | Kling-Video-v2.6 | `kl-video-v2-6` | 快手 | 上一代旗舰 |
| 7 | Kling-Video-v2.5-turbo | `kl-video-v2-5-turbo` | 快手 | 高速生成版 |
| 8 | Kling-Video-v2.1-master | `kl-video-v2-1-master` | 快手 | 大师版（品质优先） |
| 9 | Kling-Video-v2.1 | `kl-video-v2-1` | 快手 | 标准版 |
| 10 | Kling-Video-v2-master | `kl-video-v2-master` | 快手 | 大师版 v2 |
| 11 | Kling-Video-v1.6 | `kl-video-v1-6` | 快手 | 稳定版 |
| 12 | Kling-Video-v1.5 | `kl-video-v1-5` | 快手 | 经济版 |
| 13 | Kling-Video-v1 | `kl-video-v1` | 快手 | 入门版 |

**生数科技 Vidu 系列（6 个）**

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 14 | Vidu-Video-q3-pro | `vd-video-q3-pro` | 生数科技 | 最新旗舰，中文场景最优 |
| 15 | Vidu-Video-q3-turbo | `vd-video-q3-turbo` | 生数科技 | Q3 高速版 |
| 16 | Vidu-Video-q2-pro | `vd-video-q2-pro` | 生数科技 | Q2 Pro 版 |
| 17 | Vidu-Video-q2-pro-fast | `vd-video-q2-pro-fast` | 生数科技 | Q2 Pro 极速版 |
| 18 | Vidu-Video-q2-turbo | `vd-video-q2-turbo` | 生数科技 | Q2 Turbo 版 |
| 19 | Vidu-Video-q2 | `vd-video-q2` | 生数科技 | Q2 基础版 |

#### 3D 生成模型（3 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | HY-3D-3.0 | `hy-3d-3.0` | 腾讯混元 | 高质量 3D 模型 |
| 2 | HY-3D-3.1 | `hy-3d-3.1` | 腾讯混元 | 最新版 3D 模型 |
| 3 | HY-3D-Express | `hy-3d-express` | 腾讯混元 | 快速预览 3D |

#### 多模态理解模型（4 个）

| 序号 | 模型名称 | Model ID | 厂商 | 上下文窗口 | 适用场景 |
|------|----------|----------|------|------------|----------|
| 1 | YT-VITA | `youtu-vita` | 腾讯优图 | 128k | 视频/图片理解 |
| 2 | HY-Vision-2.0-Instruct | `hy-vision-2.0-instruct` | 腾讯混元 | 44k | 图片理解（快思考） |
| 3 | HY-Vision-1.5-Thinking | `hunyuan-t1-vision-20250916` | 腾讯混元 | 40k | 图片理解（深度思考） |
| 4 | HY-Vision-Video | `hunyuan-turbos-vision-video-20250728` | 腾讯混元 | 32k | 视频理解 |

#### 向量模型（4 个）

| 序号 | 模型名称 | Model ID | 厂商 | 输出维度 | 适用场景 |
|------|----------|----------|------|----------|----------|
| 1 | Kinfra-Text-Embedding-0.6b | `kinfra-text-embedding-0.6b` | 腾讯 | 1024 | 轻量文本向量 |
| 2 | Kinfra-Text-Embedding-4b | `kinfra-text-embedding-4b` | 腾讯 | 2560 | 高质量文本向量 |
| 3 | Kinfra-VL-Embedding-2b | `kinfra-vl-embedding-2b` | 腾讯 | 2048 | 轻量多模态向量 |
| 4 | Kinfra-VL-Embedding-8b | `kinfra-vl-embedding-8b` | 腾讯 | 4096 | 高精度多模态向量 |

---

### 2.2 阿里云百炼全模型（30+ 个）

#### 文本生成模型（9 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Qwen3.8-Max | `qwen3.8-max` | 阿里(通义千问) | 最新旗舰，多模态推理 |
| 2 | Qwen3.7-Plus | `qwen3.7-plus` | 阿里(通义千问) | 全能主力 |
| 3 | Qwen3.7-Flash | `qwen3.7-flash` | 阿里(通义千问) | 高速轻量 |
| 4 | Qwen-Max（经典） | `qwen-max` | 阿里(通义千问) | 经典稳定版 |
| 5 | DeepSeek-V4-Pro（阿里直供） | `deepseek-v4-pro` | DeepSeek | 旗舰文本 |
| 6 | DeepSeek-V4-Flash（阿里直供） | `deepseek-v4-flash` | DeepSeek | 高速版 |
| 7 | Kimi K3（三方直供） | `kimi/kimi-k3` | 月之暗面 | 长文本理解 |
| 8 | GLM-5.2（阿里直供） | `glm-5.2` | 智谱 AI | 逻辑推理 |
| 9 | MiniMax-M3（三方直供） | `MiniMax/MiniMax-M3` | MiniMax | 旗舰文本 |
| 10 | Mimo v2.5 Pro（三方直供） | `xiaomi/mimo-v2.5-pro` | 小米 | 小米旗舰 |

#### 图像生成模型（4 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Qwen-Image-3.0-Pro | `qwen-image-3.0-pro` | 阿里(通义万相) | 创意海报/品牌视觉 |
| 2 | Wan2.7-Image-Pro | `wan2.7-image-pro` | 阿里(通义万相) | 电商设计/产品图 |
| 3 | HappyHorse-1.1-T2V | `happyhorse-1.1-t2v` | 阿里 | 文生视频 |
| 4 | HappyHorse-1.1-I2V | `happyhorse-1.1-i2v` | 阿里 | 图生视频 |
| 5 | HappyHorse-1.1-R2V | `happyhorse-1.1-r2v` | 阿里 | 参考图生视频 |
| 6 | HappyHorse-1.0-Video-Edit | `happyhorse-1.0-video-edit` | 阿里 | 视频编辑 |

#### 3D 生成模型（2 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Tripo H3.1 | `Tripo/Tripo-H3.1` | 影眸科技 | 高质量 3D 模型 |
| 2 | Tripo P1.0 | `Tripo/Tripo-P1.0` | 影眸科技 | 快速 3D 预览 |

#### 语音合成 TTS（2 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Qwen-Audio-3.0-TTS-Plus | `qwen-audio-3.0-tts-plus` | 阿里(通义听悟) | 情绪化语音合成 |
| 2 | MiniMax Speech-2.8-HD | `MiniMax/speech-2.8-hd` | MiniMax | 高保真语音合成 |

#### 音乐生成（1 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Fun-Music-V1 | `fun-music-v1` | 阿里 | BGM/配乐生成 |

#### 语音识别 ASR（4 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Qwen-Audio-3.0-ASR-Flash-Streaming | `qwen-audio-3.0-asr-flash-streaming` | 阿里 | 实时流式语音识别 |
| 2 | Qwen-Audio-3.0-ASR-Flash-Filetrans | `qwen-audio-3.0-asr-flash-filetrans` | 阿里 | 文件转写 |
| 3 | Qwen3.5-Omni-Plus-Realtime | `qwen3.5-omni-plus-realtime` | 阿里 | 实时全模态交互 |
| 4 | Qwen3.5-Omni-Plus | `qwen3.5-omni-plus` | 阿里 | 全模态理解 |

#### 语音转语音 S2S（2 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Qwen-Audio-3.0-Realtime-Plus | `qwen-audio-3.0-realtime-plus` | 阿里 | 实时语音对话 |
| 2 | Qwen3.5-Omni-Plus | `qwen3.5-omni-plus` | 阿里 | 端到端语音交互 |

#### 向量与重排序模型（3 个）

| 序号 | 模型名称 | Model ID | 厂商 | 适用场景 |
|------|----------|----------|------|----------|
| 1 | Text-Embedding-V4 | `text-embedding-v4` | 阿里 | 文本向量化 |
| 2 | Tongyi-Embedding-Vision-Plus | `tongyi-embedding-vision-plus` | 阿里 | 多模态向量化 |
| 3 | Qwen3-Rerank | `qwen3-rerank` | 阿里 | 搜索结果重排序 |

---

### 2.3 模型路由策略（按产线和阶段分配）

模型路由策略的核心原则：每个阶段用最适合该阶段任务的模型，不追求单一模型全能。

#### 文本创作（文案主创）

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 爆款分析/结构化大纲 | DeepSeek-V4-Pro (tencent) `deepseek-v4-pro-202606` | Qwen3.8-Max (alibaba) `qwen3.8-max` |
| 高温创意初稿 | DeepSeek-V4-Pro (tencent) temp=0.85-0.95 | Qwen3.5-Plus (tencent) `qwen3.5-plus` |
| 反 AI 化重写 | Qwen3.7-Plus (alibaba) `qwen3.7-plus` | Hy-Role-Latest (tencent) `hunyuan-role-latest` |
| 质量交叉评分 | DeepSeek-V4-Flash (tencent) `deepseek-v4-flash-202605` | GLM-5.2 (tencent) `glm-5.2` |
| 多平台适配裁剪 | Qwen3.5-Flash (tencent) `qwen3.5-flash` | Qwen3.7-Flash (alibaba) `qwen3.7-flash` |
| 长文本摘要/结构化 | Kimi K3 (tencent) `kimi-k3` | GLM-5.2 (tencent) `glm-5.2` |
| 代码类/技术文档 | Kimi K2.7 Code (tencent) `kimi-k2.7-code` | Qwen3.8-Max (alibaba) `qwen3.8-max` |
| 角色扮演/口语化润色 | Hy-Role-Latest (tencent) `hunyuan-role-latest` | Qwen3.7-Plus (alibaba) `qwen3.7-plus` |
| 翻译 | Hy-MT2-Pro (tencent) `hy-mt2-pro` | Qwen3.5-Plus (tencent) `qwen3.5-plus` |

#### 图像生成

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 通用商业图片 | HY-Image-V3.0 (tencent) `hy-image-v3.0` | Qwen-Image-3.0-Pro (alibaba) `qwen-image-3.0-pro` |
| 电商产品图 | Wan2.7-Image-Pro (alibaba) `wan2.7-image-pro` | HY-Image-V3.0 (tencent) `hy-image-v3.0` |
| 创意海报/品牌视觉 | Qwen-Image-3.0-Pro (alibaba) `qwen-image-3.0-pro` | HY-Image-V3.0 (tencent) `hy-image-v3.0` |
| 快速预览/缩略图 | HY-Image-Lite (tencent) `hy-image-lite` | Qwen-Image-3.0-Pro (alibaba) `qwen-image-3.0-pro` |

#### 视频生成

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 产品形态保持（带货） | Kling-Video-v3 (tencent) `kl-video-v3` | HappyHorse-1.1-I2V (alibaba) `happyhorse-1.1-i2v` |
| 中文场景适配 | Vidu-Video-q3-pro (tencent) `vd-video-q3-pro` | Kling-Video-v2.5-turbo (tencent) `kl-video-v2-5-turbo` |
| 快速生成 | Vidu-Video-q3-turbo (tencent) `vd-video-q3-turbo` | Kling-Video-v2.5-turbo (tencent) `kl-video-v2-5-turbo` |
| 数字人出镜 | YT-Video-HumanActor (tencent) `yt-video-humanactor` | Kling-Video-v3 (tencent) `kl-video-v3` |
| 视频特效 | YT-Video-FX (tencent) `yt-video-fx` | HappyHorse-1.0-Video-Edit (alibaba) `happyhorse-1.0-video-edit` |
| 艺术化风格 | Vidu-Video-q2-pro (tencent) `vd-video-q2-pro` | Kling-Video-v2.1-master (tencent) `kl-video-v2-1-master` |

#### 配音 TTS

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 中文口播/带货 | Qwen-Audio-3.0-TTS-Plus (alibaba) `qwen-audio-3.0-tts-plus` | MiniMax Speech-2.8-HD (alibaba) `MiniMax/speech-2.8-hd` |
| 高保真配音 | MiniMax Speech-2.8-HD (alibaba) `MiniMax/speech-2.8-hd` | Qwen-Audio-3.0-TTS-Plus (alibaba) `qwen-audio-3.0-tts-plus` |
| 品牌定制声音 | 自部署 Fish Audio (Bert-VITS2) | MiniMax Speech-2.8-HD (alibaba) `MiniMax/speech-2.8-hd` |

#### 视觉理解（产品分析/质量审核）

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 图片理解（快） | HY-Vision-2.0-Instruct (tencent) `hy-vision-2.0-instruct` | Qwen3.5-Omni-Plus (alibaba) `qwen3.5-omni-plus` |
| 图片理解（深度） | HY-Vision-1.5-Thinking (tencent) `hunyuan-t1-vision-20250916` | Qwen3.8-Max (alibaba) `qwen3.8-max` |
| 视频理解 | YT-VITA (tencent) `youtu-vita` | HY-Vision-Video (tencent) `hunyuan-turbos-vision-video-20250728` |

#### 背景音乐 BGM

| 场景 | 首选模型（provider） | 备选模型（provider） |
|------|---------------------|---------------------|
| 视频配乐 | Fun-Music-V1 (alibaba) `fun-music-v1` | ccMixter 免版税音乐库 |

---

## 三、四大横切模块：嵌入所有产线所有阶段

这四条横切能力不是独立的"产线"或"步骤"，而是嵌入到所有 10 个类目所有阶段的"基础设施"。每个阶段执行前和执行后都会经过这四个模块。

---

### 3.1 违禁内容检测（Content Safety Gate）

**目标**：零违规内容"逃逸"到最终交付物中。

**检测范围**（六类违禁内容）：

1. **政治敏感**：涉政人物、事件、组织、口号；任何可能导致监管处罚的表述
2. **色情低俗**：裸露、性暗示、擦边内容；图片中的过度暴露
3. **暴力恐怖**：血腥、暴力、武器、恐怖主义相关内容
4. **违法违规**：赌博、毒品、诈骗、传销、非法集资
5. **侵权内容**：未经授权的商标、品牌 Logo、名人肖像、版权图片
6. **虚假信息**：伪造新闻、医疗误导声明、金融欺诈性陈述

**实现机制**：

- **文本输入检测**：在用户 prompt 进入流水线之前，用轻量模型（Qwen3.5-Flash 或 Hy-Role）做第一道快速筛查。prompt 涉及上述六类中任何一类 → 立即拦截并返回"内容不合规"提示
- **文本输出检测**：每个文本阶段产出后，用 DeepSeek-V4-Pro 做深度合规审查。输出结构化审查结果：`{ pass: boolean, riskLevel: 'safe'|'low'|'medium'|'high', violations: string[], suggestion: string }`
- **图片输出检测**：每张生成的图片送 HY-Vision-2.0-Instruct 做视觉安全审查。检查点包括：裸露度、暴力标识、政治符号、品牌 Logo 检测。不通过 → 标记为"不合规"，自动重新生成
- **视频输出检测**：关键帧提取 → 送 YT-VITA 做逐帧安全扫描 → 检测动态违规内容

**硬性规则**：
- 任何阶段检测到 high risk → 整个流水线中止，返回不合规提示
- 检测到 medium risk → 标记并发送人工审核通知（后期功能），当前版本按 high risk 处理
- 检测到 low risk → 允许通过但记录到审计日志

---

### 3.2 去 AI 化检测（Anti-AI Detector）

**目标**：确保最终交付物达到"真人创作感"标准，AI 痕迹评分低于 20/100。

**六维检测体系**：

| 维度 | 检测对象 | 检测指标 | 阈值 |
|------|---------|---------|------|
| 文本句式 | 文案/脚本 | 句式规律性、词汇分布均匀度、逻辑完整度（过度完整=AI痕迹） | < 20/100 |
| 图像纹理 | 图片 | 纹理过度平滑度、构图完美对称度、光影物理合理性 | < 20/100 |
| 语音自然度 | 配音 | 语调重复模式、语速均匀度、呼吸感缺失 | < 15/100 |
| 视频运动 | 视频 | 运动轨迹机械化、帧间风格突变、人物动作规律化 | < 20/100 |
| 数字人拟真 | 数字人 | 眨眼频率规律性、面部微表情单一性、皮肤纹理过度均匀 | < 15/100 |
| 整体感知 | 最终成品 | 综合人感评分（人工评测或辅助模型评测） | > 80/100 |

**反 AI 化技术手段**：

文本层面：
- 高温初稿（temperature 0.85-0.95）→ 打破模型"最合理预测"的机械化模式
- 反 AI 化重写——注入口语化表达、不完整句式、随机语气词、打破排比对仗
- AI 句式黑名单：自动剔除"综上所述""与此同时""可以看出""值得注意的是"等高频 AI 句式
- 注入"人类风格印记"：故意在 1-2 处留下不完美的表达（如省略句、口语夹杂书面语）

图像层面：
- 负向 Prompt 注入反 AI 关键词：plastic skin、perfect symmetry、unrealistic proportions、artificial smoothness、digital art style、studio lighting perfection、oversaturated colors、airbrushed texture、hyper-realistic CGI、uncanny valley
- 增加有机感：随机噪点模拟、非均匀光影、微小色差
- 多版本择优：同组 Prompt 并行生成 4 张，用视觉模型选最"真实感"版本

视频层面：
- 4 选 1 择优策略：每个镜头并行生成 4 版本，DeepSeek 视觉评估选最优
- 帧间一致性检查：产品颜色、形状、材质跨镜头偏差 < 5%
- 加入物理世界的不完美：镜头抖动、光线闪烁变化、背景随机元素

**不达标处理**：
- 任何维度 AI 痕迹评分超过阈值 → 回退到上一个阶段重生成
- 单个阶段最多重试 3 次
- 3 次后仍不达标 → 标记为"AI 痕迹偏高"但仍交付（附质量报告），同时记录到优化队列

---

### 3.3 爆款内容创意（Viral Gene Injector）

**目标**：让每个产出自带"爆款基因"，而非平庸的内容填充。

**爆款因子提取流程**：

1. **实时爆款数据检索**：调用外部平台 API（新榜/飞瓜/蝉妈妈/巨量算数）检索目标品类 × 目标平台近 7-14 天 Top 50 高互动内容
2. **共性结构提取**：DeepSeek-V4-Pro 分析 Top 50 内容的共性——钩子类型分类（冲突型/好奇型/利益型/情感型）、开头 3 秒公式、情绪曲线模板、信息密度分布、金句密度、CTA 转化结构
3. **差异化分析**：找出 Top 50 中未覆盖但有潜力的角度，输出"蓝海突破口"
4. **爆款因子打包**：输出该产线专属的爆款因子包 JSON，注入到后续所有阶段

**爆款因子包 JSON 结构示例**：

```json
{
  "category": "shortVideo",
  "platform": "douyin",
  "dateRange": "2026-07-27 ~ 2026-08-03",
  "hooks": [
    { "type": "curiosity", "template": "你可能不知道的是...", "weight": 0.35 },
    { "type": "conflict", "template": "谁说XXX就一定XXX？", "weight": 0.28 },
    { "type": "benefit", "template": "学会这招，XXX帮你省下XXX", "weight": 0.22 }
  ],
  "emotionCurve": "紧张(0-3s) → 好奇(3-8s) → 震撼(8-12s) → 满足(12-15s)",
  "paceTemplate": { "goldenLineDensity": "每100字1.5条", "cameraChangeInterval": "2.5s", "musicBeatSync": true },
  "ctaPatterns": ["评论区告诉我XXX", "先收藏免得以后找不到", "转发给你身边XXX的人"],
  "blueOceanAngles": ["XXX场景下的YYY需求尚未被充分覆盖"]
}
```

**注入方式**：

- 文案产线：爆款因子注入到 phase 1 `viral_analysis` 和 phase 3 `draft` 阶段，作为 System Prompt 的前缀上下文
- 图片产线：爆款因子中的视觉风格参数（色调/构图/光影）注入到 `visual_strategy` 和 `image_prompt` 阶段
- 视频产线：爆款因子中的节奏模板和钩子结构注入到 `script_generate` 阶段
- 数字人产线：爆款因子中的口播节奏和情绪曲线注入到 `draft` 和 `tts_generate` 阶段

---

### 3.4 质量优先（Quality Gate）

**目标**：每个阶段产出都有质量保障，不达标的回退重做。

**四维质量关卡标准**：

| 维度 | 评分标准 | 通过阈值 |
|------|---------|---------|
| 内容质量 | 信息完整度 / 逻辑连贯度 / 创意新鲜度 / 节奏感 | > 75/100 |
| 技术质量 | 分辨率达标 / 帧率达标 / 口型同步误差 / 帧间一致率 / 无渲染错误 | > 85/100 |
| 平台合规 | 内容安全通过 / 广告法合规 / 版权无侵权 | 100% 通过 |
| 去 AI 化 | 六维 AI 痕迹综合评分 | < 20/100 |

**质量关卡嵌入位置**：

每个阶段结束 → 质量关卡 → 通过则进入下一阶段，不通过则回退到上一阶段重生成。每个阶段最多迭代 3 次。

```
阶段 N 执行 → 质量关卡检查 → [通过] → 阶段 N+1
                           → [不通过(第1次)] → 回退阶段 N-1 → 重新生成 → 质量关卡
                           → [不通过(第2次)] → 回退阶段 N-2 → 重新生成
                           → [不通过(第3次)] → 标记为降级通过，记录到质量报告
```

**特殊处理**：

- 图片/视频阶段的不达标：重新调用生成模型，换种子参数（seed + 随机偏移），避免产生相同结果
- 文本阶段的不达标：回到前一个阶段用不同 temperature 重新生成，而非直接用同一个 prompt 重新调用
- 3 次迭代后仍不达标：标记质量等级为 B 级，附带质量报告，不阻塞流水线继续执行

---

## 四、10 大创作类目：完整产线编排

每个类目都有完整的多阶段编排，确保产出用户可直接使用的最终交付物。

---

### 类目 1：小红书图文

**最终交付物**：可直接发布的小红书图文（1 篇文案 + 1-4 张配图）

**产线类型**：text + image（混合）

**完整阶段编排**（8 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 爆款意图分析 | DeepSeek-V4-Pro | 检索小红书近 7 天同品类 Top 50 内容，提取爆款因子 |
| 2 | 结构化大纲 | DeepSeek-V4-Pro | 输出大纲骨架：钩子→展开→情绪推进→金句→CTA |
| 3 | 高温初稿 | DeepSeek-V4-Pro (temp=0.88) | 打破"完整句式"的 AI 写作惯性 |
| 4 | 反 AI 化重写 | Qwen3.7-Plus | 口语化表达、小红书风格 emoji、话题标签注入 |
| 5 | 违禁内容检测 | DeepSeek-V4-Pro | 文本安全审查 |
| 6 | 质量交叉评审 | DeepSeek-V4-Flash | 四维质量评分 |
| 7 | 配图生成 | HY-Image-V3.0 / Wan2.7-Image-Pro | 根据文案生成 1-4 张配图，4 选 1 择优 |
| 8 | 图片内容安全 | HY-Vision-2.0-Instruct | 配图安全检测 |

**用户可选参数**：文案长度（短/中/长）、配图数量（1-4）、风格（清新/干货/文艺/可爱）、色调方案

---

### 类目 2：图片生成

**最终交付物**：高清商业图片文件（PNG/JPG/WebP）

**产线类型**：image

**完整阶段编排**（6 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 爆款视觉分析 | DeepSeek-V4-Pro | 同类目爆款图片的视觉风格提取 |
| 2 | 视觉策略分析 | DeepSeek-V4-Pro | 构图类型、光影方案、色调体系、景别、视觉重心 |
| 3 | 双重 Prompt 生成 | DeepSeek-V4-Pro + Qwen3.7-Plus | 正向 Prompt（要什么）+ 负向 Prompt（不要什么），反 AI 关键词注入 |
| 4 | 多版本并行生成 | HY-Image-V3.0 + Wan2.7-Image-Pro + Qwen-Image-3.0-Pro | 三引擎各生成 1-2 张，OR 择优 |
| 5 | 去 AI 化评审 + 安全检测 | HY-Vision-2.0-Instruct | 图面真实感评分 + 违禁内容检测 |
| 6 | 最优版输出 | — | 最高分版本 → 导出高清文件 |

**用户可选参数**：图像比例（1:1 / 3:4 / 9:16 / 16:9）、风格（摄影/插画/3D/扁平/水彩）、色调、分辨率（标清/高清/超清）

---

### 类目 3：电商详情页

**最终交付物**：完整详情页素材包（文案段落 + 主图 + 详情图 2-4 张）

**产线类型**：text + image（混合）

**完整阶段编排**（9 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 品类爆款分析 | DeepSeek-V4-Pro | 同类目电商详情页结构提取 |
| 2 | 详情页大纲 | DeepSeek-V4-Pro | 痛点引入→产品登场→功能拆解→信任背书→CTA |
| 3 | 高温初稿 | DeepSeek-V4-Pro (temp=0.85) | 打破电商模板化表达 |
| 4 | 反 AI 化重写 | Qwen3.7-Plus | 电商场景口语化（"姐妹们""这款真的绝了"） |
| 5 | 违禁内容检测 | DeepSeek-V4-Pro | 广告法用语检测（"最好""第一"等禁词） |
| 6 | 质量评审 | DeepSeek-V4-Flash | 四维评分 |
| 7 | 主图生成 | Wan2.7-Image-Pro | 白底产品图 + 场景图 |
| 8 | 详情图生成 | HY-Image-V3.0 + Qwen-Image-3.0-Pro | 功能说明图、对比图、尺寸图 |
| 9 | 图片安全检测 | HY-Vision-2.0-Instruct | 所有图片安全审查 |

---

### 类目 4：自由创意短片（AI 导演模式）— 替换原短视频脚本

**最终交付物**：6镜头叙事短片(30-60s)，BGM配乐自动匹配，品牌配音克隆，端到端60s出片

**产线类型**：text + image + video + audio（全链路）

**定位变更**：V3.1 删除原"短视频脚本"类目——短视频功能的脚本均由各视频类目自行在 pipeline 中生成，不再需要独立的短视频脚本类目。自由创意短片（原类目 11）移至本位置，作为 AI 创作工厂的 AI 导演模式旗舰入口。

**完整阶段编排**（13 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 创意风格对标分析 | DeepSeek-V4-Pro | 分析目标风格的视觉/叙事特征 |
| 2 | 6镜头叙事脚本生成 | Qwen3.8-Max | 高温创意：引入→展开→高潮→转折→结论→余韵 |
| 3 | 叙事节奏反AI化重写 | Qwen3.8-Max / Kimi K3 | 以真人创作者视角重写 |
| 4 | 6镜头分镜视觉化 | Qwen-Image-Max | 每个分镜的视觉关键帧 |
| 5 | 6镜头视频生成 | VD-Video-Q3-Pro / Kling-Video-v3 | 4K@30fps 电影级生成 |
| 6 | 镜头质量评审 + 择优 | DeepSeek-V4-Pro | 每个镜头 4 选 1 择优 |
| 7 | 品牌配音克隆合成 | MiniMax Speech-2.8-HD | 品牌专属声音 |
| 8 | 中英双语字幕生成 | DeepSeek-V4-Pro / Qwen3.8-Max | SRT 双语字幕 |
| 9 | BGM配乐自动匹配 | Fun-Music-V1 | 按视频氛围自动选择 |
| 10 | 版权合规筛查 | DeepSeek-V4-Pro | 音乐/图像/字体版权 |
| 11 | 叙事节奏微调 | Qwen3.8-Max | 最终微调 |
| 12 | 终版艺术感评审 | DeepSeek-V4-Pro | 综合质量评分 |
| 13 | 多平台格式输出 | Qwen3.8-Max | 自动适配横竖屏及多平台 |

**用户可选参数**：总时长(15-60s)、镜头数量(3-12个)、风格(电影/广告/纪录片/Vlog)、画幅(16:9/9:16/1:1)、BGM风格

**反AI化核心要求**：真人出镜、真实场景、户外实景、真人说话、真人写作、真人拍摄效果、真人剪辑

---

### 类目 5：企业宣传视频

**最终交付物**：品牌宣传视频脚本 + AI 生成的分镜视频片段

**产线类型**：text（快速模式）/ text + video（完整模式）

**完整模式编排**（9 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 品牌传播分析 | DeepSeek-V4-Pro | 同行业品牌宣传爆款结构提取 |
| 2 | 品牌故事大纲 | DeepSeek-V4-Pro | 品牌理念→使命感→成就→愿景 |
| 3 | 高温初稿 | DeepSeek-V4-Pro (temp=0.8) | 打破企业宣传片的"假大空" |
| 4 | 真人化重写 | Qwen3.7-Plus | 去掉官方腔，注入真实企业家语言风格 |
| 5 | 违禁内容检测 | DeepSeek-V4-Pro | 广告法/企业宣传合规审查 |
| 6 | 品牌调性评审 | DeepSeek-V4-Flash | 品牌一致性评分 |
| 7 | 【完整模式】视频生成 | Vidu-Video-q3-pro + Kling-Video-v3 | 各分镜并行 4 版择优 |
| 8 | 【完整模式】帧间一致性检查 | HY-Vision-2.0-Instruct | 品牌视觉元素一致性 |
| 9 | 【完整模式】配音 + BGM | Qwen-Audio-3.0-TTS-Plus + Fun-Music-V1 | 配音 + 背景音乐 |

---

### 类目 6：产品宣传视频

**最终交付物**：完整带货视频 MP4（脚本 → TTS 配音 → 产品图转视频 → 字幕合成）

**产线类型**：text + image + video（全链路）

**完整阶段编排**（12 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 带货爆款分析 | DeepSeek-V4-Pro | 同类产品带货视频 Top 50 结构提取 |
| 2 | 产品视觉分析 | HY-Vision-2.0-Instruct | 产品特征：材质/颜色/卖点/视觉记忆点 |
| 3 | 分镜脚本生成 | DeepSeek-V4-Pro (temp=0.85) | 8 镜头爆款带货分镜：钩子→展示→对比→情感→特写→CTA |
| 4 | 反 AI 化重写 | Qwen3.7-Plus | 带货口语化（"来，看这里""就这个细节"） |
| 5 | 违禁内容检测 | DeepSeek-V4-Pro | 广告法禁词 + 产品宣传合规 |
| 6 | 转化力评审 | DeepSeek-V4-Flash | 转化力评分 + 改进建议 |
| 7 | 产品图生成 | Wan2.7-Image-Pro + HY-Image-V3.0 | 为每个镜头生成配套产品图 |
| 8 | 图生视频 | Kling-Video-v3 (首选) / Vidu-Video-q3-pro (备选) | 每个镜头 4 选 1 择优 |
| 9 | 帧间一致性检查 | HY-Vision-2.0-Instruct | 产品颜色/形状/材质跨镜头一致性 > 95% |
| 10 | 配音合成 | Qwen-Audio-3.0-TTS-Plus | 情绪标注 + 三引擎择优 |
| 11 | 字幕渲染 | 图像渲染引擎 | 字幕写入视频帧（避开产品主体） |
| 12 | 最终质量审核 | HY-Vision-Video | 完整视频质量评分 |

**这是 10 个商业化类目中流水线最长、最复杂的类目**（12 阶段），也是最能体现 AI 创作工厂核心价值的标杆类目。

---

### 类目 7：探店视频

**最终交付物**：探店视频脚本 + AI 生成的分镜视频片段

**产线类型**：text（快速模式）/ text + video（完整模式）

**完整阶段编排**（8 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 探店爆款分析 | DeepSeek-V4-Pro | 同类探店爆款 Top 50 结构提取 |
| 2 | 高温初稿 | DeepSeek-V4-Pro (temp=0.88) | 探店脚本初稿 |
| 3 | 真人探店口语化 | Qwen3.7-Plus | 注入探店博主真实语言风格 |
| 4 | 违禁内容检测 | DeepSeek-V4-Pro | 食品安全/广告法审查 |
| 5 | 真实感评审 | DeepSeek-V4-Flash | 探店真实感评分 |
| 6 | 【完整模式】视频生成 | Vidu-Video-q3-pro | 中文场景探店画面生成 |
| 7 | 【完整模式】帧间一致性检查 | HY-Vision-2.0-Instruct | 场景/光线一致性 |
| 8 | 【完整模式】配音 + BGM | Qwen-Audio-3.0-TTS-Plus + Fun-Music-V1 | 配音 + 探店氛围 BGM |

---

### 类目 8：真人 MV 视频

**最终交付物**：MV 拍摄脚本 + AI 生成的 MV 视频 MP4

**产线类型**：text（快速模式）/ text + image + video（完整模式）

**完整阶段编排**（10 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 流行趋势分析 | DeepSeek-V4-Pro | MV 热门风格/色调/节奏提取 |
| 2 | MV 创意脚本 | DeepSeek-V4-Pro (temp=0.9) | 歌词/文案 → MV 视觉概念 |
| 3 | 艺术表达润色 | Qwen3.7-Plus | 诗化/意象化表达 |
| 4 | 违禁内容检测 | DeepSeek-V4-Pro | 版权/肖像权审查 |
| 5 | 艺术感评审 | DeepSeek-V4-Flash | 艺术表现力评分 |
| 6 | 关键帧图片生成 | Qwen-Image-3.0-Pro + HY-Image-V3.0 | 每个分镜的关键帧视觉 |
| 7 | 图生视频 | Kling-Video-v3 + Vidu-Video-q3-pro | 每个镜头 4 选 1 |
| 8 | 帧间一致性 + 安全检测 | HY-Vision-2.0-Instruct | 人像一致性 + 内容安全 |
| 9 | 配音/BGM 合成 | Qwen-Audio-3.0-TTS-Plus + Fun-Music-V1 | 配音 + 背景音乐 |
| 10 | 最终质检 | HY-Vision-Video | 完整视频综合质量评分 |

---

### 类目 9：萌宠卡通短视频

**最终交付物**：脚本 + AI 生成的卡通风格短视频 MP4

**产线类型**：text（快速模式）/ text + image + video（完整模式）

**完整阶段编排**（8 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 萌宠/卡通爆款分析 | DeepSeek-V4-Pro | 萌宠类/卡通类 Top 50 爆款提取 |
| 2 | 高温创意脚本 | DeepSeek-V4-Pro (temp=0.92) | 极致创意发散 |
| 3 | 可爱风润色 | Qwen3.7-Plus | 萌系语言风格注入 |
| 4 | 违禁内容检测 | DeepSeek-V4-Pro | 动物保护/儿童内容合规 |
| 5 | 趣味性评审 | DeepSeek-V4-Flash | 可爱度/趣味度评分 |
| 6 | 【完整模式】视觉素材生成 | HY-Image-V3.0 + Qwen-Image-3.0-Pro | 卡通风格关键帧 |
| 7 | 【完整模式】视频生成 | Kling-Video-v3 + Vidu-Video-q2-pro | 图生视频（卡通风格） |
| 8 | 【完整模式】配音 + 音效 | Qwen-Audio-3.0-TTS-Plus + Fun-Music-V1 | 萌系配音 + 活泼 BGM |

---

### 类目 10：数字人

**最终交付物**：口播视频 MP4（脚本 → TTS → 数字人出镜合成）

**产线类型**：text + tts + digital_human（全链路）

**完整阶段编排**（9 阶段）：

| 阶段 | 名称 | 主力模型 | 说明 |
|------|------|---------|------|
| 1 | 口播爆款分析 | DeepSeek-V4-Pro | 数字人口播 Top 50 爆款结构提取 |
| 2 | 口播脚本生成 | DeepSeek-V4-Pro (temp=0.85) | 适合数字人口播的脚本结构 |
| 3 | 自然口语化重写 | Qwen3.7-Plus | 去书面化，注入自然口语节奏 |
| 4 | 违禁内容检测 | DeepSeek-V4-Pro | 口播内容安全审查 |
| 5 | 情绪标注 | DeepSeek-V4-Pro | 为脚本插入精确的情绪/语速/停顿标签 |
| 6 | 自然配音合成 | Qwen-Audio-3.0-TTS-Plus + MiniMax Speech-2.8-HD | 三引擎并行择优 |
| 7 | 数字人出镜合成 | YT-Video-HumanActor | 口型同步 + 动作随机化 + 光影融合 |
| 8 | 拟真度评审 | HY-Vision-2.0-Instruct | 面部自然度 + 口型同步率 + 光影一致性 |
| 9 | 最终质检 | HY-Vision-Video | 完整数字人视频质量评分 |

**数字人反 AI 化特化措施**：
- 眨眼间隔 2-8 秒随机分布（不精确每 5 秒）
- 头部微动 2-5 像素随机变化
- 身体前倾/后仰 1-3 度波动
- 瞳孔不规则微跳变
- 唇部边缘 2-4 像素高斯模糊（消除 Wav2Lip 方形贴图边界）
- 光照参数根据背景图动态匹配（色温/方向/强度/散射度）

---

## 五、流水线编排引擎（Pipeline Orchestrator）

### 5.1 架构设计

```
用户输入（prompt + 类目选择 + 参数）
    │
    ▼
┌──────────────────────────────────────────────┐
│           Pipeline Orchestrator               │
│                                               │
│  1. 解析类目配置 → 加载阶段列表                │
│  2. 检查 API Key 覆盖率                       │
│  3. 启动阶段循环：                             │
│     for each phase:                           │
│       ├── [前置] 违禁内容检测（输入安全）        │
│       ├── [执行] 调用阶段主力模型               │
│       ├── [后置] 质量关卡评审                   │
│       ├── [后置] 去 AI 化检测                  │
│       ├── [后置] 违禁内容检测（输出安全）        │
│       └── [判定] 通过 → 下一阶段 / 不通过 → 回退 │
│  4. 所有阶段完成 → 打包最终交付物               │
└──────────────────────────────────────────────┘
    │
    ▼
最终交付物（文本/图片/视频/数字人 + 质量报告）
```

### 5.2 阶段间数据传递

每个阶段产出结构化 JSON，携带下游阶段所需的所有上下文：

```typescript
interface PhaseOutput {
  phaseId: string;
  phaseName: string;
  status: 'pass' | 'retry' | 'fail';
  retryCount: number;
  content: string;          // 实际产出内容
  metadata: {
    modelId: string;        // 使用的模型 ID
    modelProvider: string;  // 模型平台
    tokensUsed: number;     // Token 消耗
    duration: number;       // 耗时 (ms)
    temperature: number;    // 温度参数
  };
  qualityScores: {
    contentQuality: number;   // 内容质量 0-100
    technicalQuality: number; // 技术质量 0-100
    compliance: number;       // 合规评分 0-100
    antiAiScore: number;      // 去 AI 化评分 0-100（越低越好）
  };
  safetyCheck: {
    passed: boolean;
    riskLevel: 'safe' | 'low' | 'medium' | 'high';
    violations: string[];
  };
  viralFactors: {           // 该阶段注入的爆款因子快照
    hookType: string;
    emotionCurve: string;
    paceTemplate: any;
  };
  // 阶段特定数据
  imageUrls?: string[];     // 图片阶段：生成的图片 URL
  videoUrls?: string[];     // 视频阶段：生成的视频 URL
  audioUrl?: string;        // 配音阶段：生成的音频 URL
}
```

### 5.3 并行化策略

流水线编排引擎自动识别可并行执行的阶段：

- **图片/视频生成的并行择优**：同一组 Prompt 同时发送给多个生成引擎（如 HY-Image-V3.0 + Wan2.7-Image-Pro + Qwen-Image-3.0-Pro），等待全部返回后选最优
- **配音三引擎并行**：同一段标注文案同时发给 Qwen-Audio-3.0-TTS-Plus + MiniMax Speech-2.8-HD + Fish Audio，选最优
- **多镜头视频并行生成**：产品宣传视频的 8 个镜头可以全部并行生成（每个镜头各 4 候选），而非串行等待
- **质量评审独立并行**：去 AI 化检测、违禁内容检测、质量评分可以三路并行执行

---

## 六、API Key 管理策略

### 6.1 双 Provider 独立管理

用户需要在两个平台各自申请 API Key：

- **腾讯云 TokenHub**：访问 https://console.cloud.tencent.com/tokenhub → 创建 API Key → 充值 → 复制 Key
- **阿里云百炼**：访问 https://bailian.console.aliyun.com → 创建 API Key → 充值 → 复制 Key

### 6.2 前端配置入口

在 AI 创作工厂页面顶部提供"API Key 配置"按钮，弹窗中：

1. 显示当前 Key 配置状态（已配置/未配置）
2. 分别展示两个平台的 Key 输入框（加密存储到 localStorage）
3. 显示各平台当前余额（如果 Key 已配置）
4. 提供"测试连接"按钮验证 Key 有效性
5. 显示每个类目需要的 Key 覆盖情况

### 6.3 成本估算

每个类目在提交前显示预估 Token 消耗和费用（基于模型定价）：

| 类目 | 快速模式预估 | 完整模式预估 | 主要成本模型 |
|------|-------------|-------------|-------------|
| 小红书图文 | ~0.5 元/次 | ~2 元/次 | DeepSeek-V4-Pro + HY-Image-V3.0 |
| 图片生成 | — | ~1.5 元/次 | HY-Image-V3.0 × 4 |
| 电商详情页 | ~0.8 元/次 | ~3 元/次 | DeepSeek-V4-Pro + Wan2.7-Image-Pro |
| 自由创意短片 | ~0.5 元/次 | ~12 元/次 | VD-Video-Q3-Pro + Kling-Video-v3 × 6 镜头 + MiniMax Speech + BGM |
| 企业宣传视频 | ~0.5 元/次 | ~8 元/次 | Vidu-Video-q3-pro × 6 镜头 |
| 产品宣传视频 | — | ~15 元/次 | Kling-Video-v3 × 8 镜头 + TTS |
| 探店视频 | ~0.4 元/次 | ~6 元/次 | Vidu-Video-q3-pro × 5 镜头 |
| 真人 MV 视频 | ~0.4 元/次 | ~12 元/次 | Kling-Video-v3 + Qwen-Image-3.0-Pro |
| 萌宠卡通 | ~0.4 元/次 | ~6 元/次 | Kling-Video-v3 × 5 镜头 |
| 数字人 | — | ~10 元/次 | YT-Video-HumanActor + TTS × 2 |


注：以上费用为估算值，实际以各平台 API 实时定价为准。

---

## 七、部署与配置架构

### 7.1 服务分层

```
用户浏览器
    │
    ├── API Key (localStorage，前端直连模型 API)
    │
    ▼
腾讯云 TokenHub API ◄── 直接调用（Chat/Image/Video/TTS/3D）
    │
阿里云百炼 API ◄── 直接调用（Chat/Image/Video/TTS/Music/ASR）
    │
    ▼
智枢 Server ─── 流水线编排引擎 / 质量关卡 / 违禁检测 / 日志 / 审计
```

### 7.2 关键设计决策

1. **模型 API 前端直连**：用户浏览器直接调用 TokenHub/百炼 API，智枢 Server 不代理模型请求。这避免了用户数据的二次传输，也避免了服务端成为成本黑洞
2. **编排逻辑后端执行**：流水线编排、质量关卡、违禁内容检测、去 AI 化检测等核心逻辑在智枢 Server 端执行，不依赖前端可靠性
3. **API Key 客户端存储**：API Key 加密存储在浏览器 localStorage，服务端不存储任何用户的 API Key
4. **审计日志**：每次调用都记录：用户 ID + 时间戳 + 类目 + 阶段 + 模型 ID + Token 消耗 + 质量评分 + 合规结果。日志存储在服务端数据库

---

## 八、实施路线图

### 第一期：基础设施（第 1-2 周）

- [ ] 更新 `category-config.ts` 中的模型注册表，纳入全部 90+ 模型
- [ ] 实现四大横切模块：违禁内容检测器、去 AI 化检测器、爆款基因注入器、质量关卡引擎
- [ ] 搭建流水线编排引擎核心框架（支持阶段回退和重试）
- [ ] 实现 Provider API 适配层（腾讯云 TokenHub + 阿里云百炼 OpenAI 兼容格式）

### 第二期：文本产线全链路跑通（第 3-4 周）

- [ ] 小红书图文：8 阶段全链路 → 输出图文成品
- [ ] 电商详情页：9 阶段全链路 → 输出详情页素材包
- [ ] 自由创意短片：AI 导演模式 → 输出可用创意短片

### 第三期：视频产线全链路跑通（第 5-7 周）

- [ ] 产品宣传视频：12 阶段全链路 → 输出完整带货视频 MP4
- [ ] 企业宣传视频：9 阶段 → 输出品牌宣传视频
- [ ] 探店视频：8 阶段 → 输出探店视频
- [ ] 真人 MV 视频：10 阶段 → 输出 MV 视频
- [ ] 萌宠卡通短视频：8 阶段 → 输出卡通短视频

### 第四期：数字人产线 + 自由创意短片 + 优化闭环（第 8-10 周）

- [ ] 数字人产线：9 阶段 → 输出口播视频 MP4
- [ ] 自由创意短片产线：9 阶段 → 输出创意视频 MP4（含人物一致性锚定机制）
- [ ] 实现 A/B 测试框架：支持同一 prompt 生成 2 个版本对比
- [ ] 接入发布后数据回灌：播放量/完播率/互动率 → 自动优化爆款因子参数
- [ ] 建立模型效果看板：各模型在各阶段的成功率/质量评分/成本统计

---

## 九、最终总结

智枢 AI 创作工厂 v3.0 的核心升级在于五个关键词：**质量优先、完整交付、全模型开放、安全零容忍、配置成体系**。

第一，**质量优先**。v3.0 新增第十章"质量优先最高配置方案"，将两平台 90+ 个模型中真正属于"旗舰级"的 30 余个顶级模型全部按类目和阶段逐一编排。腾讯DeepSeek-V4-Pro 取代 DeepSeek V4 Pro 成为分析主力，千问 Qwen 3.8 Max 取代 Qwen 3.7 Max 成为创意主力，MiniMax Speech-2.8-HD 取代千问 TTS Plus 成为配音主力，Vidu Q3 Pro / Q3 Turbo / Q2 Pro 三款引擎按场景分流补充可灵。新增 BGM 配乐阶段和品牌声音克隆阶段，补齐了 v2.1 缺失的两块关键拼图。v3.0 的代价是单条产线成本平均上涨 50%-75%，但品质提升显著——这正是"质量优先"的含义。

第二，**完整交付**。10 个类目全部产出最终可交付物——文案、图片、视频、数字人口播、创意短片，而不是中间产物。产品宣传视频产线的 12 阶段全链路——从爆款分析到图生视频到配音到字幕合成——是商业类目中最完整、最能体现工厂价值的标杆类目。自由创意短片（AI 导演模式）则以 11 阶段链路覆盖了从概念到成片的完整导演工作流。

第三，**全模型开放**。腾讯云 TokenHub 的 60 个模型和阿里云百炼的 30+ 个模型全部纳入注册表和路由策略。每个阶段都用"最适合该任务"的模型而不是"一个模型吃遍天"。用户自行选择平台和模型组合，消费自担。

第四，**安全零容忍**。违禁内容检测、去 AI 化检测、爆款基因注入、质量关卡——这四条横切能力嵌入所有类目所有阶段。每个阶段执行后过四个检查点，不通过则回退重来（最多 3 次）。v3.0 额外引入 Qwen 3.5 Omni Plus 全模态审核，实现视频 + 音频 + 文字三重联合审核，在创意自由和内容安全之间找到更精准的平衡点。

第五，**配置成体系**。第十一章定义了视频生产配置系统，将配音（14 种含 8 种方言）、字幕（中英文双语）、横幅贴片叠加层（10 种类型 × 8 种视觉样式）、背景音乐（9 种风格）四大配置体系全部纳入统一类型系统和前端表单。用户勾选即注入 prompt，不用手动编写。三端（Web / APK / shared）共享类型定义，确保一致性。

第六，**成本透明**。每个类目在提交前展示预估费用，用户明明白白消费。v3.0 提供"质量优先"和"效率优先"两套配置，用户一键切换。快速模式和完整模式按需选择，丰俭由人。

---

## 十、质量优先最高配置方案

> **设计目标**：在 10 个类目、总计 100+ 个流水线阶段中，每个阶段都使用两平台（腾讯云 TokenHub + 阿里云百炼）当前可用的质量最高的模型，不降级、不妥协。
> **版本**：v3.0（自蓝皮书 v2.1 升级而来）
> **生效期**：2026-08-04 起作为"质量优先"默认方案，替代 v2.1 的"效率优先"默认方案。用户侧仍可手动降级或切换平台。

### 10.1 最高配置模型选择总原则

| 任务类型 | 质量优先首选模型 | 所属平台 | 质量排序理由 |
|----------|-----------------|---------|-------------|
| 复杂推理 / 深度分析 / 策略规划 | **DeepSeek-V4-Pro** | 腾讯云 TokenHub | 腾讯自研旗舰，128K 上下文，Thinking + Function Calling，在复杂推理和多步规划上优于 DeepSeek V4 Pro |
| 创意文案 / 文学创作 / 影视脚本 | **千问 Qwen 3.8 Max** | 阿里云百炼 | 阿里最新旗舰，多模态推理，文案创作和叙事能力在所有模型中最强 |
| 长篇文本处理 / 摘要 / 改写 | **月之暗面 Kimi K3** | 腾讯云 TokenHub | 128K+ 长文本处理之王，摘要质量顶级 |
| 极长文本 / 合同 / 报告解析 | **智谱 GLM-5.2** | 腾讯云 TokenHub | 100 万 token 上下文窗口，128K 输出，极端长文本唯一选择 |
| 长篇创作 / 小说 / 剧本 | **MiniMax M3** | 腾讯云 TokenHub | 1M 上下文，长篇内容一致性在所有模型中最佳 |
| 人设创作 / 角色扮演 / 互动剧本 | **混元创角 Hy-Role-Latest** | 腾讯云 TokenHub | 角色一致性专用模型，无可替代 |
| 去 AI 化检测 — 中文 | **千问 Qwen 3.8 Max** | 阿里云百炼 | 语言自然度最高，AI 痕迹最低 |
| 去 AI 化检测 — 英文 | **Kimi K3** | 腾讯云 TokenHub | 1M 上下文，中英双语顶级，英文自然度在 TokenHub 可用模型中最高 |
| 质量审核 / 评分 | **DeepSeek V4 Pro** | 腾讯云 TokenHub | 逻辑严谨，评分公正，适合做裁判模型 |
| 文生图 — 电商 / 产品 | **通义万象 Wan2.7-Image-Pro** | 阿里云百炼 | 电商场景效果最佳，文字渲染精度最高 |
| 文生图 — 创意 / 海报 | **通义万象 Qwen-Image-3.0-Pro** | 阿里云百炼 | 创意构图和海报设计能力强，支持多轮编辑 |
| 文生图 — 写实 / 高质量 | **混元图像 HY-Image-V3.0** | 腾讯云 TokenHub | 写实人像和场景还原度最高 |
| 图生视频 — 产品宣传 / 企业宣传 | **可灵 Kling-Video-v3** | 腾讯云 TokenHub | 物理模拟和画面稳定性最强，商业视频首选 |
| 图生视频 — 中文场景 / 社交媒体 | **生数科技 Vidu-Video-q3-pro** | 腾讯云 TokenHub | "中文场景最优"，字幕渲染和中文语义理解最强 |
| 图生视频 — 快速出片 / MV / Vlog | **生数科技 Vidu-Video-q3-turbo** | 腾讯云 TokenHub | 生成速度最快，适合快速迭代 |
| 图生视频 — 艺术化 / 创意短片 | **生数科技 Vidu-Video-q2-pro** | 腾讯云 TokenHub | 艺术风格独特，创意短片最佳选择 |
| 视频编辑 / 局部替换 / 消物修复 | **HappyHorse 1.0 VideoEdit** | 阿里云百炼 | 视频编辑专用，消物和局部替换精准，model ID: happyhorse-1.0-video-edit |
| 文生视频 — 阿里侧 | **happyhorse-1.1-t2v** | 阿里云百炼 | 阿里侧最佳文生视频，与千问生态联动 |
| 数字人口播 — 人像动画 | **有道 YT-Video-HumanActor** | 腾讯云 TokenHub | 口型同步和表情自然度最优 |

| 配音 TTS — 高保真 / 多情感 | **MiniMax Speech-2.8-HD** | 阿里云百炼 | 高保真语音合成引擎，情感表达丰富度远高于千问 TTS Plus，支持 30+ 语言 |
| 配音 TTS — 中文多方言 / 多角色 | **千问 Qwen-Audio-3.0-TTS-Plus** | 阿里云百炼 | 支持中文方言和多角色切换，覆盖 MiniMax 不擅长的场景 |
| 品牌定制声音 / 声音克隆 | **自部署 Fish Audio (Bert-VITS2)** | 自部署 | 唯一支持品牌专属声音定制的引擎，千问和 MiniMax 均无法实现 |
| BGM 配乐 / 背景音乐生成 | **Fun-Music-V1** | 阿里云百炼 | 唯一可用的 AI 背景音乐生成引擎，支持多种风格和情绪 |
| 全模态交互 / 实时对话 | **Qwen 3.5 Omni Plus** | 阿里云百炼 | 文本 + 图像 + 视频 + 音频一体化，唯一全模态模型 |
| 实时语音对话 / 数字人交互 | **Qwen 3.5 Omni Plus Realtime** | 阿里云百炼 | 端到端实时语音，延迟低至 200ms |

### 10.2 10 个类目的最高配置流水线

以下每一个阶段都明确标注了质量优先的首选模型和平台。格式：`模型名称 @ 平台`。

---

#### 类目 1：新媒体爆款文案

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 热点分析 / 选题挖掘 | **DeepSeek-V4-Pro** | 腾讯云 | 取代 DeepSeek V4 Pro，推理和分析能力更强 |
| 2. 标题生成（5 选 1+） | **千问 Qwen 3.8 Max** | 阿里云 | 取代 Qwen 3.7 Max，标题创意和吸引力更高 |
| 3. 正文撰写 | **千问 Qwen 3.8 Max** | 阿里云 | 同上，文案流畅度和感染力更强 |
| 4. 改写润色 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 5. 去 AI 化检测 → 重写 | **千问 Qwen 3.8 Max** | 阿里云 | 自然度最高，AI 痕迹最低 |
| 6. 违禁内容审核 | **DeepSeek-V4-Pro** | 腾讯云 | 腾讯安全审核体系最完善 |
| 7. 最终质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 裁判模型，公正客观 |

---

#### 类目 2：社交媒体短图文

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 热点分析 | **DeepSeek-V4-Pro** | 腾讯云 | 取代 DeepSeek V4 Pro |
| 2. 短文案生成 | **千问 Qwen 3.8 Max** | 阿里云 | 取代 Qwen 3.7 Max |
| 3. 配图提示词 | **千问 Qwen 3.8 Max** | 阿里云 | 提示词创意更好 |
| 4. 配图生成 | **Qwen-Image-3.0-Pro** | 阿里云 | 社交图创意和文字渲染最佳 |
| 5. 去 AI 味重写 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 6. 违禁检测 | **DeepSeek-V4-Pro** | 腾讯云 | 同上 |
| 7. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 3：电商营销全案

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 竞品分析 | **DeepSeek-V4-Pro** | 腾讯云 | 取代 DeepSeek V4 Pro，竞争策略分析更深 |
| 2. 商品文案 | **千问 Qwen 3.8 Max** | 阿里云 | 取代 Qwen 3.7 Max |
| 3. 营销文案 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 4. 电商主图 | **Wan2.7-Image-Pro** | 阿里云 | 电商场景效果最佳 |
| 5. 详情页长图 | **Wan2.7-Image-Pro** | 阿里云 | 同上，长图一致性更好 |
| 6. 去 AI 化重写 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 7. 违禁检测 | **DeepSeek-V4-Pro** | 腾讯云 | 同上 |
| 8. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 4：自由创意短片（AI 导演模式）— 替换原短视频脚本

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 创意风格对标分析 | **DeepSeek-V4-Pro** | 腾讯云 | 风格/叙事特征深度分析 |
| 2. 6镜头叙事脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 高温创意（6镜头叙事结构） |
| 3. 叙事节奏反AI化重写 | **千问 Qwen 3.8 Max** / Kimi K3 | 阿里云 | 真人创作者视角重写 |
| 4. 6镜头分镜视觉化 | **Qwen-Image-Max** / Z-Image-Turbo | 阿里云 | 分镜关键帧生成 |
| 5. 6镜头视频生成 | **VD-Video-Q3-Pro** / Kling-Video-v3 | 阿里/快手 | 4K@30fps 电影级生成 |
| 6. 镜头质量评审+择优 | **DeepSeek-V4-Pro** | 腾讯云 | 每镜头 4 选 1 择优 |
| 7. 品牌配音克隆 | **MiniMax Speech-2.8-HD** | 腾讯云 | 品牌专属声音合成 |
| 8. 中英双语字幕 | **DeepSeek-V4-Pro** / Qwen3.8-Max | 腾讯/阿里 | SRT双语字幕 |
| 9. BGM配乐匹配 | **Fun-Music-V1** | 阿里云 | 自动匹配视频氛围 |
| 10. 版权合规筛查 | **DeepSeek-V4-Pro** | 腾讯云 | 音乐/图像/字体版权 |
| 11. 叙事节奏微调 | **千问 Qwen 3.8 Max** | 阿里云 | 节奏精调 |
| 12. 终版艺术感评审 | **DeepSeek-V4-Pro** | 腾讯云 | 综合质量评分 |
| 13. 多平台格式输出 | **千问 Qwen 3.8 Max** | 阿里云 | 多平台横竖屏适配 |

---

#### 类目 5：企业宣传视频

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 爆款视频文案分析 | **DeepSeek-V4-Pro** | 腾讯云 | 取代 DeepSeek V4 Pro |
| 2. 分镜脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 取代 Qwen 3.7 Max |
| 3. 旁白文案 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 4. 分镜图生成 | **HY-Image-V3.0** | 腾讯云 | 企业级品质感最重要 |
| 5. 图生视频 | **可灵 Kling-Video-v3** | 腾讯云 | 企业宣传视频画面稳定性要求最高 |
| 6. 配音 TTS | **MiniMax Speech-2.8-HD** | 阿里云 | **关键升级**：取代千问 TTS Plus，企业配音高保真要求 |
| 7. BGM 配乐生成 | **Fun-Music-V1** | 阿里云 | **新增阶段**：企业宣传必备 BGM，之前完全缺失 |
| 8. 字幕合成 | **千问 Qwen 3.8 Max** | 阿里云 | 字幕时间轴和内容极准确 |
| 9. 数字人口播（可选） | **YT-Video-HumanActor** | 腾讯云 | 企业领导人/品牌代言人数字口播 |
| 10. 多模态审核 | **Qwen 3.5 Omni Plus** | 阿里云 | 视频 + 音频 + 文字联合审核 |
| 11. 去 AI 化检测 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 12. 最终质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 6：产品宣传视频

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 爆款拆解 | **DeepSeek-V4-Pro** | 腾讯云 | 取代 DeepSeek V4 Pro |
| 2. 产品卖点文案 | **千问 Qwen 3.8 Max** | 阿里云 | 取代 Qwen 3.7 Max |
| 3. 分镜脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 4. 产品图优化 | **Wan2.7-Image-Pro** | 阿里云 | 产品图电商级渲染 |
| 5. 创意镜头图 | **Qwen-Image-3.0-Pro** | 阿里云 | 创意镜头表现力 |
| 6. 图生视频 | **可灵 Kling-Video-v3** | 腾讯云 | 物理模拟最稳定 |
| 7. 中文场景视频 | **Vidu-Video-q3-pro** | 腾讯云 | **新增**：中文产品标签/字幕最准确 |
| 8. 配音 TTS | **MiniMax Speech-2.8-HD** | 阿里云 | **关键升级**：取代千问 TTS Plus |
| 9. BGM 配乐 | **Fun-Music-V1** | 阿里云 | **新增阶段** |
| 10. 字幕合成 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 11. 去 AI 化检测 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 12. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 7：口播/数字人视频

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 口播文案撰写 | **千问 Qwen 3.8 Max** | 阿里云 | 口播需要口语化、自然流畅 |
| 2. 品牌定制声音 | **Fish Audio (Bert-VITS2)** | 自部署 | **关键升级**：品牌专属声音克隆，千问/MiniMax 均不支持 |
| 3. 配音 TTS | **MiniMax Speech-2.8-HD** | 阿里云 | 备用高保真配音 |
| 4. 数字人动画 | **YT-Video-HumanActor** | 腾讯云 | 口型同步 + 人像驱动一体化，TokenHub 可用数字人模型 |
| 5. BGM 垫音 | **Fun-Music-V1** | 阿里云 | **新增阶段** |
| 6. 实时交互（可选） | **Qwen 3.5 Omni Plus Realtime** | 阿里云 | **新增**：实时语音 + 数字人交互 |
| 7. 多模态审核 | **Qwen 3.5 Omni Plus** | 阿里云 | 视频 + 音频联合审核 |
| 8. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 8：探店/Vlog 视频

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 探店文案 | **千问 Qwen 3.8 Max** | 阿里云 | Vlog 叙事需要文学性 |
| 2. 分镜脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 3. 镜头描述图 | **Qwen-Image-3.0-Pro** | 阿里云 | 生活场景表现力好 |
| 4. 图生视频 | **Vidu-Video-q3-turbo** | 腾讯云 | **关键升级**：快速出片 + 中文场景最优 |
| 5. 配音 TTS | **MiniMax Speech-2.8-HD** | 阿里云 | **关键升级** |
| 6. BGM 配乐 | **Fun-Music-V1** | 阿里云 | **新增阶段**：Vlog BGM 是灵魂 |
| 7. 字幕合成 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 8. 去 AI 化检测 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 9. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 9：音乐 MV 短片

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 歌词分析 / 情感提取 | **DeepSeek-V4-Pro** | 腾讯云 | 歌词情感分析需要深层理解 |
| 2. MV 概念文案 | **千问 Qwen 3.8 Max** | 阿里云 | 艺术概念创作 |
| 3. 分镜脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 4. 视觉风格图 | **Qwen-Image-3.0-Pro** | 阿里云 | 创意视觉表现 |
| 5. 图生视频 | **Vidu-Video-q2-pro** | 腾讯云 | **关键升级**：艺术化风格，MV 表现力最佳 |
| 6. BGM 配乐 | **Fun-Music-V1** | 阿里云 | MV 配乐是核心 |
| 7. 歌词字幕 | **千问 Qwen 3.8 Max** | 阿里云 | 歌词时间轴精准 |
| 8. 去 AI 化检测 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 9. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

#### 类目 10：萌宠 / 生活类短视频

| 阶段 | 最高配置模型 | 平台 | 说明 |
|------|------------|------|------|
| 1. 萌宠文案 / 故事 | **千问 Qwen 3.8 Max** | 阿里云 | 温馨叙事 |
| 2. 分镜脚本 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 3. 萌宠图生成 | **HY-Image-V3.0** | 腾讯云 | 动物写实还原度最高 |
| 4. 图生视频 | **Vidu-Video-q3-turbo** | 腾讯云 | **关键升级**：快速出片 |
| 5. 配音 TTS | **MiniMax Speech-2.8-HD** | 阿里云 | **关键升级** |
| 6. BGM 配乐 | **Fun-Music-V1** | 阿里云 | **新增阶段** |
| 7. 字幕合成 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 8. 去 AI 化检测 | **千问 Qwen 3.8 Max** | 阿里云 | 同上 |
| 9. 质量评分 | **DeepSeek V4 Pro** | 腾讯云 | 同上 |

---

### 10.3 最高配置 vs v2.1 默认配置对比

| 对比维度 | v2.1 默认配置 | v3.0 质量优先最高配置 | 质量提升 |
|----------|-------------|---------------------|---------|
| 腾讯文本旗舰 | DeepSeek V4 Pro | **DeepSeek-V4-Pro** | DeepSeek-V4-Pro 是腾讯云文本旗舰，复杂推理 > 上一代 V4 |
| 阿里文本旗舰 | Qwen 3.7 Max | **Qwen 3.8 Max** | 3.8 是最新旗舰，文案创意和自然度更强 |
| 长文本处理 | 缺失（回退到 DS V4 Pro） | **Kimi K3 / GLM-5.2** | 长文本专属引擎，极端长文本不丢失信息 |
| 长篇创作 | 缺失 | **MiniMax M3** | 1M 上下文 + 长篇一致性，品牌故事/小说必备 |
| 角色一致性 | 缺失 | **混元创角 Hy-Role-Latest** | 角色扮演和创意短片的人物一致性锚定 |
| 文生图 | HY-Image-V3.0（腾讯侧）+ Qwen-Image-3.0-Pro（阿里侧） | 增加 **Wan2.7-Image-Pro** | 电商和产品图效果明显提升 |
| 图生视频 | 可灵 Kling-Video-v3 独占 | 可灵 + **Vidu Q3 Pro / Q3 Turbo / Q2 Pro** | 中文场景、快速出片、艺术化各有最佳引擎 |
| 阿里视频 | 缺失 | **HappyHorse 1.1 / 1.0 VideoEdit 系列** | 文生视频 + 视频编辑能力补齐 |
| 配音 TTS | 千问 TTS Plus 独占 | **MiniMax Speech-2.8-HD**（主力）+ 千问 TTS Plus（方言/多角色） | 高保真度大幅提升 |
| 品牌声音克隆 | 缺失 | **Fish Audio (Bert-VITS2)** | 唯一品牌定制声音方案 |
| BGM 配乐 | **完全缺失** | **Fun-Music-V1** | 新增独立 BGM 阶段，6 个类目受益 |
| 全模态交互 | 缺失 | **Qwen 3.5 Omni Plus / Realtime** | 实时数字人对话能力 |
| 违禁审核 | 混元（文本侧） | 文本：DeepSeek-V4-Pro + 多模态：**Qwen 3.5 Omni Plus** | 视频 + 音频 + 文字三重审核 |

---

### 10.4 成本预估

质量优先最高配置的模型全部为 premium 级别，单价高于 v2.1 效率优先配置。

**文本阶段成本对比**（以新媒体爆款文案为例，约 10,000 token 输入 + 5,000 token 输出）：

| 模型 | v2.1 成本 / 次 | v3.0 成本 / 次 | 增幅 |
|------|---------------|---------------|------|
| DeepSeek V4 Pro（v2.1 分析主力） | ¥0.015 | — | — |
| DeepSeek-V4-Pro（v3.0 分析主力） | — | ¥0.025 | +67% |
| Qwen 3.7 Max（v2.1 创作主力） | ¥0.012 | — | — |
| Qwen 3.8 Max（v3.0 创作主力） | — | ¥0.018 | +50% |

**视频阶段成本对比**（以企业宣传视频为例，10 个分镜 × 5s 视频）：

| 阶段 | v2.1 | v3.0 | 新增 BGM 等 |
|------|------|------|-------------|
| 图生视频 | 可灵 KLING 3.0 约 ¥8.0 | 可灵 + Vidu 约 ¥10.0 | — |
| 配音 TTS | 千问 TTS Plus 约 ¥0.5 | MiniMax Speech-2.8-HD 约 ¥2.0 | — |
| BGM 配乐 | 无 | Fun-Music-V1 约 ¥1.5 | 新增阶段 |
| **单条视频合计** | **约 ¥15.0** | **约 ¥22.0** | **+47%** |

**各类目预估单次产线成本（完整模式）**：

| 类目 | v2.1 成本 | v3.0 成本 | 增幅 |
|------|----------|----------|------|
| 新媒体爆款文案 | ¥0.20 | ¥0.35 | +75% |
| 社交媒体短图文 | ¥0.35 | ¥0.55 | +57% |
| 电商营销全案 | ¥0.80 | ¥1.20 | +50% |
| 自由创意短片 | ¥11.10 | ¥22.00 | +98%（含 4K 视频+BGM+品牌配音） |
| 企业宣传视频 | ¥15.00 | ¥22.00 | +47% |
| 产品宣传视频 | ¥14.00 | ¥20.00 | +43% |
| 口播/数字人视频 | ¥8.00 | ¥14.00 | +75% |
| 探店/Vlog 视频 | ¥10.00 | ¥16.00 | +60% |
| 音乐 MV 短片 | ¥12.00 | ¥18.00 | +50% |
| 萌宠/生活短视频 | ¥7.00 | ¥11.00 | +57% |


---

### 10.5 模型注册表补充（v3.0 新增）

以下模型在 `model-registry.ts` v2.1 中缺失，需补充注册：

```typescript
// ─── 阿里云百炼新增 ───
{
  modelId: 'qwen3.8-max',
  displayName: '通义千问 3.8 Max',
  provider: 'alibaba',
  type: 'text',
  tier: 'premium',
  priority: 1,
  maxTokens: 131072,
  supportsThinking: true,
  supportsFunctionCalling: true,
  tags: ['旗舰', '创意文案', '多模态推理', '文学创作'],
  description: '阿里最新旗舰模型，多模态推理，文案创作和叙事能力强，推荐用于创意文案类目所有阶段',
}
{
  modelId: 'qwen3.5-omni-plus',
  displayName: '通义千问 3.5 Omni Plus',
  provider: 'alibaba',
  type: 'multimodal',
  tier: 'premium',
  priority: 1,
  maxTokens: 131072,
  supportsThinking: true,
  tags: ['全模态', '视频审核', '音频审核', '联合审核'],
  description: '全模态模型——文本 + 图像 + 视频 + 音频一体化，用于多模态内容审核和全模态交互',
}
{
  modelId: 'qwen3.5-omni-plus-realtime',
  displayName: '通义千问 3.5 Omni Plus Realtime',
  provider: 'alibaba',
  type: 'realtime',
  tier: 'premium',
  priority: 1,
  supportsRealtime: true,
  tags: ['实时语音', '数字人交互', '低延迟'],
  description: '端到端实时语音对话，延迟低至 200ms，用于数字人实时交互场景',
}
{
  modelId: 'happyhorse-1.1-t2v',
  displayName: 'HappyHorse 1.1 T2V',
  provider: 'alibaba',
  type: 'video',
  tier: 'premium',
  priority: 1,
  tags: ['文生视频', '阿里视频'],
  description: '阿里侧最佳文生视频引擎，与千问生态联动',
}
{
  modelId: 'happyhorse-1.0-video-edit',
  displayName: 'HappyHorse 1.0 VideoEdit',
  provider: 'alibaba',
  type: 'video',
  tier: 'premium',
  priority: 2,
  tags: ['视频编辑', '消物', '局部替换'],
  description: '阿里视频编辑引擎，消物和局部替换精准',
}
{
  modelId: 'fun-music-v1',
  displayName: 'Fun-Music-V1',
  provider: 'alibaba',
  type: 'audio',
  tier: 'premium',
  priority: 1,
  tags: ['BGM', '配乐', '背景音乐'],
  description: 'AI 背景音乐生成引擎，支持多种风格和情绪，用于视频配乐和 BGM 生成',
}

// ─── 腾讯云 TokenHub 新纳入 ───
{
  modelId: 'vd-video-q3-pro',
  displayName: 'Vidu Q3 Pro',
  provider: 'tencent',
  type: 'video',
  tier: 'premium',
  priority: 2,
  tags: ['中文场景', '社交媒体', '图生视频'],
  description: '生数科技 Vidu 系列——中文场景最优，字幕渲染和中文语义理解最强',
}
{
  modelId: 'vd-video-q3-turbo',
  displayName: 'Vidu Q3 Turbo',
  provider: 'tencent',
  type: 'video',
  tier: 'premium',
  priority: 2,
  tags: ['快速出片', 'Vlog', '短视频'],
  description: '生数科技 Vidu 系列高速版，生成速度最快，适合快速迭代场景',
}
{
  modelId: 'vd-video-q2-pro',
  displayName: 'Vidu Q2 Pro',
  provider: 'tencent',
  type: 'video',
  tier: 'premium',
  priority: 3,
  tags: ['艺术化', '创意短片', 'MV'],
  description: '生数科技 Vidu 系列艺术化版本，艺术风格独特，创意短片和 MV 最佳选择',
}
```

---

### 10.6 BGM 阶段新增规范

质量优先配置在 6 个类目（企业宣传视频、产品宣传视频、口播/数字人、探店/Vlog、音乐 MV、萌宠短视频）中新增独立的 BGM 配乐阶段。BGM 阶段设计规范如下：

**触发时机**：视频预览图确认后、字幕合成前（或与配音同步并行）。

**输入参数**：
- `style`：BGM 风格（激昂/舒缓/温馨/活泼/悲伤/科技感/中国风/史诗/电子/轻音乐）
- `tempo`：BPM 范围（慢速 60-80 / 中速 90-120 / 快速 130-160）
- `duration`：BGM 时长（秒，默认与视频总时长一致）
- `intro`：是否需要前奏淡入（默认 true）
- `outro`：是否需要尾声淡出（默认 true）

**模型**：`fun-music-v1 @ alibaba`（唯一选择）

**输出格式**：MP3（320kbps），16-bit，44.1kHz 立体声

**质量检查点**：BGM 生成后与配音混合预览，检查音量平衡（BGM 音量应低于配音 8-12dB）、情绪匹配度、节奏同步度。不通过则重新生成（最多 3 次，每次调整 style 描述）。

---

### 10.7 品牌声音克隆阶段新增规范

质量优先配置在口播/数字人视频类目中新增品牌声音克隆阶段。

**前置条件**：用户上传 10-30 分钟的高质量干音样本（单声道 16-bit 16kHz WAV），需包含不同情绪状态（平静/兴奋/低落/疑问/强调）。

**引擎**：自部署 **Fish Audio (Bert-VITS2)**。部署于腾讯云 CVM，通过内网 API 调用。

**流程**：
1. 干音样本质量检测（信噪比 > 30dB，无背景噪音，无混响）
2. 声音特征提取 + 声纹注册
3. Bert-VITS2 微调训练（约 30 分钟，GPU T4 实例）
4. 合成验证（随机文本对比原音，MOS 评分 ≥ 4.0）
5. 注册为永久品牌声音模板（可跨类目复用）

**成本**：训练一次性 ¥15.0，后续每次合成 ¥0.05 / 100 字。声音模板保存 30 天，过期需重新训练。

**回退策略**：若品牌声音训练失败或用户不愿等待，自动回退到 MiniMax Speech-2.8-HD 通用高保真配音。

---

## 十一、视频生产配置系统（配音 / 字幕 / 横幅 / BGM）

> **定位**：本章定义 AI 创作工厂的视频生产增强配置体系，覆盖配音（含方言）、字幕（中英文双语）、横幅贴片叠加层（Banner/Lower Third）、背景音乐四大类可配置项。所有配置在 Web 端 AI 创作工厂页面和 APK 移动端同步可用，用户勾选后自动注入到视频生成 prompt 中。
> **版本**：v1.0（首次纳入蓝皮书 v3.0）
> **生效期**：2026-08-04 起

### 11.1 配置系统架构

视频生产配置系统是夹在用户交互层和 AI 视频生成层之间的增强层。用户在表单中勾选配音、字幕、横幅、BGM 选项后，系统通过 `buildVideoPrompt()` 函数自动将这些选择转化为结构化 prompt 片段，拼接到原始 prompt 中发给视频生成 AI。

```
用户表单选择（配音/字幕/横幅/BGM）
        │
        ▼
buildVideoPrompt() ── 配置 → Prompt 片段转化
        │
        ▼
增强后的完整 prompt ── 送往视频生成 AI
```

配置在三端均可用:
- **Web 端**: `web/lib/content/types.ts` + `web/lib/ai/factory-service.ts`
- **APK 移动端**: `apk/src/services/content.service.ts`
- **共享类型**: `shared/types/video-production.ts`（三端共用）

### 11.2 配音配置（14 种）

覆盖普通话、粤语、英语三大语系，以及 8 种中国地方方言。配音选项在调用 AI 视频 API 时自动注入对应 prompt 描述。

| 选项值 | 显示标签 | 注入 Prompt 片段 |
|--------|---------|-----------------|
| `none` | 无配音 | — |
| `female-mandarin` | 女声-普通话 | 使用女声普通话配音 |
| `male-mandarin` | 男声-普通话 | 使用男声普通话配音 |
| `female-cantonese` | 女声-粤语 | 使用女声粤语配音 |
| `male-cantonese` | 男声-粤语 | 使用男声粤语配音 |
| `female-english` | 女声-英文 | 使用女声英语配音 |
| `male-english` | 男声-英文 | 使用男声英语配音 |
| `sichuan` | 四川话 | 使用四川话方言配音 |
| `dongbei` | 东北话 | 使用东北话方言配音 |
| `shanghai` | 上海话 | 使用上海话方言配音 |
| `minnan` | 闽南话 | 使用闽南话方言配音 |
| `henan` | 河南话 | 使用河南话方言配音 |
| `hunan` | 湖南话 | 使用湖南话方言配音 |
| `shaanxi` | 陕西话 | 使用陕西话方言配音 |
| `tianjin` | 天津话 | 使用天津话方言配音 |

**类型定义**（`shared/types/video-production.ts`）:

```typescript
export interface VoiceoverConfig {
  type: 'none' | 'female-mandarin' | 'male-mandarin' | 'female-cantonese'
    | 'male-cantonese' | 'female-english' | 'male-english'
    | 'sichuan' | 'dongbei' | 'shanghai' | 'minnan'
    | 'henan' | 'hunan' | 'shaanxi' | 'tianjin';
  speed?: number;  // 语速 0.5-2.0，默认 1.0
  pitch?: number;  // 音调 -12 ~ +12 半音，默认 0
  volume?: number; // 音量 0-100，默认 80
}
```

配音阶段在蓝皮书 10.2 节已定义了模型路由: **MiniMax Speech-2.8-HD** 作为主力（高保真/多情感），**千问 Qwen-Audio-3.0-TTS-Plus** 作为方言/多角色场景的补充。品牌定制声音走 **Fish Audio (Bert-VITS2)** 自部署引擎。

### 11.3 字幕配置（4 种）

| 选项值 | 显示标签 | 注入 Prompt 片段 |
|--------|---------|-----------------|
| `none` | 无字幕 | — |
| `chinese` | 中文 | 添加中文字幕，白色文字带半透明黑底，底部居中 |
| `english` | 英文 | 添加英文字幕，白色文字带半透明黑底，底部居中 |
| `bilingual` | 双语 | 添加中英文双语字幕，中文在上英文在下，白色文字带半透明黑底 |

**类型定义**:

```typescript
export interface SubtitleConfig {
  type: 'none' | 'chinese' | 'english' | 'bilingual';
  fontSize?: number;        // 字号，默认 24
  fontColor?: string;       // 字体颜色，默认 '#FFFFFF'
  bgColor?: string;         // 背景色，默认 'rgba(0,0,0,0.6)'
  strokeColor?: string;     // 描边色，默认 '#000000'
  strokeWidth?: number;     // 描边宽度，默认 1
  position?: 'bottom' | 'top' | 'middle'; // 位置，默认 bottom
}
```

### 11.4 横幅/贴片叠加层配置（10 种类型 × 8 种视觉样式）

横幅系统是本次 v3.0 蓝皮书新增的核心配置模块。用户在 AI 创作工厂页面以多选下拉框方式勾选所需叠加元素，系统自动组合并注入到视频生成 prompt。

#### 11.4.1 横幅类型

| 选项值 | 显示标签 | 说明 | 注入 Prompt 描述 |
|--------|---------|------|-----------------|
| `none` | 无横幅 | 不使用任何叠加元素 | — |
| `opening-title` | 片头标题 | 视频开头的标题展示 | 视频开头居中显示大字标题，渐变蓝紫背景，持续3秒 |
| `lower-third` | 人名标注条 | 画面下方信息条 | 画面底部有人名/职位信息标注条，深色半透明背景，约出现5秒 |
| `closing-credits` | 片尾落款 | 视频结尾品牌Logo+口号 | 视频结尾底部显示品牌落款和口号，淡入淡出效果 |
| `call-to-action` | 行动号召 | 引导用户点击/关注/购买 | 底部显示醒目红色行动号召按钮，引导用户点击 |
| `watermark` | 水印 | 半透明品牌水印 | 右下角半透明品牌水印"@智枢AI"，全程显示 |
| `scene-divider` | 场景分隔 | 场景切换过渡提示 | 场景切换时显示章节过渡提示文字 |
| `speech-bubble` | 说话气泡 | 模拟对话气泡框 | 底部左侧显示对话气泡框，模拟角色说话 |
| `bullet-comment` | 弹幕风格 | 飘过的弹幕文字 | 画面顶部有弹幕文字从右到左飘过 |
| `brand-logo` | 品牌角标 | 角落品牌Logo标识 | 右上角显示品牌Logo角标，全程显示 |
| `progress-hint` | 进度提示 | 预告接下来内容 | 显示"接下来"的进度提示文字 |

#### 11.4.2 视觉样式预设（8 种）

每个横幅类型可套用以下视觉效果之一:

| 样式 ID | 样式名称 | 背景 | 文字 | 边框 | 适用场景 |
|---------|---------|------|------|------|---------|
| `dark-glass` | 深色半透明 | `rgba(0,0,0,0.7)` | `#FFFFFF` | 无 | 默认通用样式 |
| `brand-gradient` | 品牌渐变 | `linear-gradient(135deg, #667eea, #764ba2)` | `#FFFFFF` | 无 | 品牌宣传/企业视频 |
| `clean-card` | 干净卡片 | `rgba(255,255,255,0.95)` | `#1a1a2e` | `1px solid #e0e0e0` | 商务/专业场景 |
| `frosted-glass` | 毛玻璃 | `rgba(255,255,255,0.2)` + `backdrop-filter: blur(10px)` | `#FFFFFF` | `1px solid rgba(255,255,255,0.3)` | 时尚/高端场景 |
| `bold-cta` | 醒目红底 | `#e74c3c` | `#FFFFFF` | 无 | 行动号召专用 |
| `minimal-line` | 极简线框 | `transparent` | `#333333` | `2px solid #333333` | 极简设计/现代风 |
| `luxury-gold` | 高级金色 | `linear-gradient(135deg, #1a1a1a, #2d2d2d)` | `#d4a574` | `1px solid #d4a574` | 奢侈品/高端定位 |
| `subtitle-bar` | 字幕通栏 | `rgba(0,0,0,0.85)` | `#FFFFFF` | 无 | 底部全宽信息条 |

#### 11.4.3 类型定义

```typescript
export interface BannerOverlay {
  id: string;
  type: BannerType;
  label: string;
  content: string;          // 默认文案
  subContent?: string;      // 副文案（如职位/地点）
  position: BannerPosition; // 位置
  duration: number;         // 显示时长（秒）
  startTime?: number;       // 开始时间（秒），不指定则自动计算
  animation: BannerAnimation; // 入场动效
  style: BannerStylePreset;   // 视觉样式
  textColor?: string;
  bgColor?: string;
  fontSize?: number;
  opacity?: number;
  zIndex?: number;
}

export type BannerType = 'opening-title' | 'lower-third' | 'closing-credits'
  | 'call-to-action' | 'watermark' | 'scene-divider' | 'speech-bubble'
  | 'bullet-comment' | 'brand-logo' | 'progress-hint';

export type BannerPosition = 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type BannerAnimation = 'fadeIn' | 'slideUp' | 'slideLeft'
  | 'slideRight' | 'scaleIn' | 'typewriter' | 'none';
```

#### 11.4.4 按视频类目的推荐横幅组合

`video-overlay-config.ts` 中的 `createBannerPreset()` 工厂函数根据视频类目自动推荐横幅组合:

| 视频类目 | 推荐横幅组合 | 理由 |
|---------|-------------|------|
| 企业宣传视频 | `opening-title` + `lower-third` + `brand-logo` + `closing-credits` | 品牌全覆盖: 标题→人名条→角标→落款 |
| 产品宣传视频 | `opening-title` + `call-to-action` + `watermark` + `closing-credits` | 带货标配: 标题→CTA→水印→落款 |
| 探店/Vlog | `opening-title` + `lower-third` + `scene-divider` | 场景流转: 标题→地点标注→章节分隔 |
| 数字人口播 | `opening-title` + `lower-third` + `brand-logo` | 身份展示: 标题→人名条→角标 |
| 音乐 MV | `opening-title` + `progress-hint` + `closing-credits` | 创意引导: 标题→进度→落款 |
| 萌宠短视频 | `opening-title` + `speech-bubble` + `closing-credits` | 趣味互动: 标题→气泡→落款 |
| 自由创意短片 | `opening-title` + `scene-divider` + `closing-credits` | 章节导航: 标题→分隔→落款 |

用户也可以不依赖推荐，在"横幅/贴片"多选下拉框中自由勾选任意组合。传入 `['auto']` 则自动使用推荐组合。

### 11.5 背景音乐配置（9 种风格）

| 选项值 | 显示标签 | 注入 Prompt 片段 |
|--------|---------|-----------------|
| `none` | 无背景音乐 | — |
| `dynamic` | 动感 | 添加动感背景音乐 |
| `lyrical` | 抒情 | 添加抒情背景音乐 |
| `business` | 商务 | 添加商务背景音乐 |
| `cheerful` | 欢快 | 添加清新欢快背景音乐 |
| `relaxing` | 舒缓 | 添加舒缓背景音乐 |
| `suspense` | 悬疑 | 添加悬疑背景音乐 |
| `tech` | 科技 | 添加科技感背景音乐 |
| `classical` | 古典 | 添加古典背景音乐 |

**类型定义**:

```typescript
export interface BgmConfig {
  style: 'none' | 'dynamic' | 'lyrical' | 'business' | 'cheerful'
    | 'relaxing' | 'suspense' | 'tech' | 'classical';
  tempo?: number;         // BPM，默认 120
  volume?: number;        // 音量 0-100，默认 30（低于配音 8-12dB）
  fadeIn?: boolean;       // 淡入，默认 true
  fadeOut?: boolean;      // 淡出，默认 true
  loop?: boolean;         // 循环播放，默认 true
}
```

BGM 生成引擎使用 **Fun-Music-V1 @ 阿里云百炼**（见蓝皮书 10.6 节 BGM 阶段新增规范），输出格式 MP3 320kbps / 16-bit / 44.1kHz 立体声。

### 11.6 统一生产配置类型

`shared/types/video-production.ts` 定义了聚合所有配置项的顶层类型:

```typescript
export interface VideoProductionConfig {
  voiceover: VoiceoverConfig;
  subtitle: SubtitleConfig;
  banners: BannerOverlay[];
  bgm: BgmConfig;
}
```

### 11.7 Prompt 注入机制

`web/lib/ai/factory-service.ts` 中的 `buildVideoPrompt()` 函数是配置系统的核心枢纽。它接收 `GenerateVideoParams`，依次检查配音、字幕、横幅、BGM 四项配置，将非空/非 `'none'` 的配置转化为自然语言 prompt 片段，用中文句号拼接后返回增强 prompt。

```typescript
function buildVideoPrompt(params: GenerateVideoParams): string {
  const parts = [params.prompt];
  
  // 字幕 → "添加中文字幕，白色文字带半透明黑底，底部居中"
  // 配音 → "使用女声粤语配音"
  // BGM  → "添加科技感背景音乐"
  // 横幅 → "视频叠加元素：片头居中大字标题...；底部行动号召按钮..."
  
  return parts.filter(Boolean).join('。');
}
```

### 11.8 前端表单集成

**Web 端** (`web/app/customer/ai-factory/page.tsx`): 视频类目下展示四行配置项:
- 第一行: 配音（单选下拉，14 选项）+ 字幕（单选下拉，4 选项）
- 第二行: 背景音乐（单选下拉，9 选项）+ 横幅/贴片（多选下拉，11 选项，最多显示 2 个标签）
- 第三行: 视频尺寸 + 时长

**APK 移动端** (`apk/src/services/content.service.ts`): 同等配置选项，通过 `content.service.ts` 统一导出。

配图类目不展示配音/横幅选项，只有视频类目才会渲染这些表单控件。

### 11.9 配置系统文件索引

| 文件 | 职责 |
|------|------|
| `shared/types/video-production.ts` | 配音/字幕/横幅/BGM 统一类型定义（三端共用） |
| `web/lib/content/types.ts` | Web 端选项列表（`bannerOverlayOptions` 等） |
| `web/lib/ai/video-overlay-config.ts` | 横幅预设库：10 种类型 × 8 种样式 + `createBannerPreset()` |
| `web/lib/ai/factory-service.ts` | `buildVideoPrompt()` 增强 prompt 注入 + `overlayBanners` 参数 |
| `web/app/customer/ai-factory/page.tsx` | AI 创作工厂表单："横幅/贴片"多选下拉 |
| `apk/src/services/content.service.ts` | APK 端选项列表（含方言配音 + 横幅选项） |
| `apk/src/services/index.ts` | APK 端统一导出 |

---

## 附录 A：模型 ID 速查表

### A.1 腾讯云 TokenHub 文本模型 ID

```
hy3, hy3-preview, hy-mt2-pro, hy-mt2-plus, hy-mt2-lite, hunyuan-role-latest, hy-role,
deepseek-v4-flash-202605, deepseek-v4-pro-202606, deepseek-v4-flash, deepseek-v4-pro,
deepseek-v3.2, glm-5.2, glm-5.1, glm-5v-turbo, glm-5-turbo, glm-5,
kimi-k2.7-code-highspeed, kimi-k3, kimi-k2.7-code, kimi-k2.6, kimi-k2.5,
minimax-m3, minimax-m2.7, minimax-m2.5, qwen3.5-flash, qwen3.5-plus, mimo-v2.5-pro
```

### A.2 腾讯云 TokenHub 多媒体模型 ID

```
图片: hy-image-v3.0, hy-image-lite
视频: hy-video-1.5, yt-video-2.0, yt-video-humanactor, yt-video-fx,
     kl-video-v3, kl-video-v2-6, kl-video-v2-5-turbo, kl-video-v2-1-master, kl-video-v2-1,
     kl-video-v2-master, kl-video-v1-6, kl-video-v1-5, kl-video-v1,
     vd-video-q3-pro, vd-video-q3-turbo, vd-video-q2-pro, vd-video-q2-pro-fast,
     vd-video-q2-turbo, vd-video-q2
3D: hy-3d-3.0, hy-3d-3.1, hy-3d-express
视觉理解: youtu-vita, hy-vision-2.0-instruct, hunyuan-t1-vision-20250916,
         hunyuan-turbos-vision-video-20250728
```

### A.3 阿里云百炼模型 ID

```
文本: qwen3.8-max, qwen3.7-plus, qwen3.7-flash, qwen-max,
     deepseek-v4-pro, deepseek-v4-flash, kimi/kimi-k3, glm-5.2,
     MiniMax/MiniMax-M3, xiaomi/mimo-v2.5-pro
图像: qwen-image-3.0-pro, wan2.7-image-pro
      happyhorse-1.1-t2v, happyhorse-1.1-i2v, happyhorse-1.1-r2v, happyhorse-1.0-video-edit
3D: Tripo/Tripo-H3.1, Tripo/Tripo-P1.0
音频: qwen-audio-3.0-tts-plus, MiniMax/speech-2.8-hd, fun-music-v1
     qwen-audio-3.0-asr-flash-streaming, qwen-audio-3.0-asr-flash-filetrans
     qwen3.5-omni-plus-realtime, qwen3.5-omni-plus
     qwen-audio-3.0-realtime-plus
向量: text-embedding-v4, tongyi-embedding-vision-plus, qwen3-rerank
```

---

## 附录 B：反 AI 关键词库

### 图片负向 Prompt 词库

```
plastic skin, perfect symmetry, unrealistic proportions, artificial smoothness,
digital art style, studio lighting perfection, oversaturated colors, airbrushed texture,
hyper-realistic CGI, uncanny valley, clone face, dead eyes, wax figure skin,
uniform skin tone, poreless surface, cartoonish anatomy, impossible lighting,
matte painting look, 3D render look, video game character, over-posed posture,
obvious compositing, inconsistent shadows, floating objects, weird hands,
extra fingers, merged limbs, distorted face, asymmetric eyes, text artifacts
```

### 文本 AI 句式黑名单

```
综上所述、因此可以得出、值得注意的是、我们可以看到、显而易见、与此同时、
不可否认、从某种意义上说、一方面...另一方面、不仅如此、更重要的是、
在此背景下、随着...的发展、在...的推动下、纵观、众所周知、毋庸置疑、
可谓是、堪称、无独有偶、换言之、这也就意味着
```

---

## 附录 C：质量评分标准细则

### 文本质量评分（0-100）

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| 信息完整度 | 25% | 是否覆盖了用户需求的所有信息点 |
| 逻辑连贯度 | 20% | 是否存在逻辑断层或跳跃 |
| 创意新鲜度 | 20% | 表达是否新颖，还是陈词滥调 |
| 节奏感 | 15% | 段落长短交替、金句密度、阅读节奏 |
| 去 AI 化 | 20% | 是否像真人写的（不自洽的语法也算分） |

### 图片质量评分（0-100）

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| 指令遵循度 | 30% | 是否准确呈现 prompt 要求的元素 |
| 光影自然度 | 20% | 光照/阴影是否符合物理规律 |
| 构图质量 | 15% | 是否遵循基本构图法则 |
| 纹理真实感 | 15% | 是否有 AI 特有的过度平滑/过度锐化 |
| 去 AI 化 | 20% | 整张图的"人感" |

### 视频质量评分（0-100）

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| 帧间一致性 | 25% | 产品/人物跨镜头一致性 |
| 运动自然度 | 20% | 运动轨迹是否机械化 |
| 配音同步度 | 15% | 音画同步误差 |
| 画面稳定性 | 15% | 无闪烁/抖动/跳帧 |
| 去 AI 化 | 25% | 整体观感是否像人拍的 |

### 数字人质量评分（0-100）

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| 面部自然度 | 30% | 眨眼/微表情/皮肤纹理 |
| 口型同步率 | 25% | 音画延迟 < 80ms |
| 光影一致性 | 20% | 光照方向/色温与背景匹配 |
| 动作自然度 | 15% | 头部微动/身体晃动不规律性 |
| 去 AI 化 | 10% | 整体恐怖谷效应评分 |

---

## 附录 D：v3.0 平台验证声明

**验证日期**：2026-08-04

本蓝皮书 v3.0 版本已完成与腾讯云 TokenHub 官方模型列表（https://cloud.tencent.com/document/product/1823/130051）和阿里云百炼官方模型列表的逐项交叉验证。验证结果：

### 已验证正确的部分（~95%）

两个平台的核心模型全部经官方文档确认存在，包括但不限于：Qwen 3.8 Max（2026-08-03 上线）、Qwen 3.7 Max、DeepSeek V4 Pro/Flash、Kimi K3、MiniMax M3、GLM-5.2、DeepSeek-V4-Pro、混元图像 V3.0、可灵 Kling-Video-V3、Vidu Q3/Q2 全系列、混元创角 Hy-Role-Latest、千问 TTS Plus、千问全模态 Omni Plus/Realtime、WAN 2.7 图像 Pro、Qwen-Image-3.0-Pro、MiniMax Speech-2.8-HD、HappyHorse 1.1 系列、HappyHorse 1.0 VideoEdit、Fun-Music-V1、YT-Video-HumanActor 等。

### 已修正的 3 处错误

1. **"去 AI 化检测 — 英文"选型**：原列出 Claude 4.5 Sonnet，但 Claude 系列不存在于腾讯云 TokenHub。已改为 **Kimi K3 @ 腾讯云 TokenHub**（1M 上下文，中英双语顶级，英文自然度在 TokenHub 可用模型中最高）。

2. **HappyHorse 视频编辑版本号**：原列出 HappyHorse-VE2.1-VideoEdit，该版本号不正确。官方 model ID 为 **happyhorse-1.0-video-edit**。T2V 模型 ID 也已校正为 `happyhorse-1.1-t2v`（非 `happyhorse-t2v-1.1`）。

3. **数字人唇形融合模型**：原列出 YT-Video-HumanFace-Fusion 作为独立唇形驱动模型，该模型不存在于 TokenHub。已验证 YT-Video-HumanActor 本身已包含口型同步能力，作为 TokenHub 上唯一的数字人驱动模型，同时承担人像驱动和唇形同步功能。类目 7 流水线已精简步骤。

### 验证方法

每条模型 ID 均通过以下两种方法之一验证：
- 腾讯云 TokenHub：直接读取官方文档页面（cloud.tencent.com/document/product/1823/130051）获取完整模型列表，逐项比对
- 阿里云百炼：通过官方帮助文档和公告确认公开发布的 model ID

### 结论

v3.0 蓝皮书描述的工作流已在两个平台完全可实现。所有 10 个类目的模型流水线均可通过本蓝皮书定义的 model ID 在两平台调用。`server/src/services/model-registry.ts` 已同步新增所有 v3.0 模型（Vidu 系列、HappyHorse 系列、MiniMax Speech-2.8-HD、Fun-Music-V1、Qwen3.8-Max），可直接在代码中使用。
