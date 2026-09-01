# 智枢 AI · AI 模型配置最终版（实测验证版）

> **版本**：V1.0（最终版）
> **发布日期**：2026-09-01
> **事实来源**：`desktop-ui/lib/ai/category-config.ts`（配置层）＋ `server/src/services/ai-client.ts` / `desktop-ui/lib/ai/factory-service.ts`（执行层）＋ 2026-08-31 客户账号（13166262006）真实接口实测
> **取代文档**：本文档为 AI 模型配置唯一权威文档，取代以下未经实测的理论版本：`AI创作工厂模型配置总蓝皮书.md`（V3.1）、`智枢AISaaS系统AI模型配置总蓝皮书.md`（V2.1）、`ai-factory-model-standard.md`（V3.0）、`ai_model_three_provider_routing_plan_v1.md`（V1 规划方案）。上述文档已删除，请勿再引用。
> **需求依据**：《智枢AI_开发需求大纲_真实版.md》第 7 章（M6 三服务商多模型路由）

---

## 一、三服务商接入总览

系统采用"三服务商多模型路由"架构（M6）：腾讯云 TokenHub、阿里云百炼、火山方舟。API Key 由客户在系统内配置（用户自带 Key / 管理后台 `/api/admin/api-providers` 配置），密钥加密存储，平台不代付。

| Provider | 平台 | 申请入口 | baseUrl | Chat 端点 |
|---|---|---|---|---|
| `tencent` | 腾讯云 TokenHub | https://console.cloud.tencent.com/tokenhub | `https://tokenhub.tencentmaas.com` | `/v1/chat/completions` |
| `alibaba` | 阿里云百炼 | https://bailian.console.aliyun.com | `https://dashscope.aliyuncs.com` | `/compatible-mode/v1/chat/completions` |
| `volcano` | 火山方舟 | https://console.volcengine.com/ark | `https://ark.cn-beijing.volces.com/api/v3` | `/chat/completions` |

注意：
- 腾讯 TokenHub 视频用原生 submit+poll 模式（`/v1/api/video/submit`），非 OpenAI 兼容格式。
- 阿里 WAN 系列异步模型用 `image-generation` 端点；千问图像系列同步模型用 `multimodal-generation` 端点。
- 火山方舟无 TTS/声音复刻端点（方舟 `/audio/speech` 实测 404）；火山语音为独立 openspeech 服务，需 appid/token，不走方舟 API Key，当前不可用。

## 二、模型注册表（含实测状态）

> 实测状态图例：✅ PASS＝真实客户账号接口调用通过；❌ FAIL＝调用失败（已标注原因与处理）；⚠️ 未实测＝配置就绪、有降级兜底，未经生产实测。

### 2.1 文本 / 推理 / 分析

| registryKey | 模型 | 服务商 | 角色 | 实测 |
|---|---|---|---|---|
| `deepseek-v4-pro-tc` | DeepSeek V4 Pro | 腾讯 | 结构化分析/大纲/评审/合规 | ✅ PASS |
| `qwen3.8-max` | Qwen 3.8 Max | 阿里 | 高质量创作/复杂推理 | ✅ PASS |
| `kimi-k3` | Kimi K3 | 腾讯 | 英文去AI化/中英双语/1M上下文 | ✅ PASS |
| `doubao-seed-2.1-pro` | Doubao Seed 2.1 Pro | 火山 | 创作/推理/视频理解/多模态 | ✅ PASS |
| `glm-5.2` | GLM 5.2（方舟） | 火山 | 字幕/去AI化/中英双语 | ✅ PASS |
| `qwen3.7-max` | Qwen 3.7 Max | 阿里 | 文案主创（闲置） | — |
| `qwen-max-aly` | Qwen Max 经典 | 阿里 | 辅助文案（闲置） | — |
| `qwen3.7-plus` | Qwen 3.7 Plus | 阿里 | 多平台适配（闲置） | — |
| `doubao-seed-2.1-turbo` | Doubao 2.1 Turbo | 火山 | 高频生产（闲置） | — |
| `doubao-seed-2.0-pro` / `2.0-lite` | Doubao 2.0 | 火山 | 通用（闲置） | — |
| `doubao-seed-1.6` / `1.6-thinking` | Doubao 1.6 | 火山 | 通用/深度推理（闲置） | — |
| `deepseek-v4-volcano` | DeepSeek V4（方舟） | 火山 | 结构化分析（闲置） | — |
| `kimi-k2.7` | Kimi K2.7（方舟） | 火山 | 长文本/字幕（闲置） | — |
| `minimax-m3` | MiniMax M3（方舟） | 火山 | 创意文案（闲置） | — |

### 2.2 图像

| registryKey | 模型 | 服务商 | 角色 | 实测 |
|---|---|---|---|---|
| `qwen-image-max` | 千问图像 Max | 阿里 | 创意图像主力 | ✅ PASS |
| `qwen-image-edit` | 千问图像编辑 | 阿里 | 图像增强/编辑 | ✅ PASS |
| `wan2.7-image-pro-aly` | WAN 2.7 图像 Pro | 阿里 | 电商商品主图 | ✅ PASS |
| `z-image-turbo` | Z-Image Turbo | 阿里 | 快速出图兜底 | ✅ PASS |
| `doubao-seedream-5.0-pro` | Seedream 5.0 Pro | 火山 | 图像生成主力 | ✅ PASS |
| `hy-image-v3` | 混元 Image 3.0 | 腾讯 | 图像备选 | ✅ PASS |
| `doubao-seededit-3.0-i2i` | SeedEdit 3.0 I2I | 火山 | 图像编辑 | ❌ 404，需客户在火山方舟控制台开通该模型权限（非代码问题）；未开通时走 qwen-image-edit 主链路 |
| `qwen-image-3.0-pro` | 千问图像 3.0 Pro | 阿里 | 创意海报（闲置） | — |
| `hy-image-lite` | 混元 Image Lite | 腾讯 | 快速预览（闲置） | — |
| `doubao-seedream-5.0-lite` / `4.0` | Seedream Lite/4.0 | 火山 | 备用（闲置） | — |

### 2.3 视频

| registryKey | 模型 | 服务商 | 角色 | 实测 |
|---|---|---|---|---|
| `kling-video-v3` | 可灵 KLING 3.0 | 腾讯 | 图生视频主力 | ✅ PASS（需开通计费） |
| `hy-video-1.5` | 混元视频 1.5 | 腾讯 | 视频备选 | ✅ PASS |
| `vd-video-q3-pro` | Vidu Q3 Pro | 腾讯 | 电影级文生视频 | ✅ PASS |
| `doubao-seedance-1.0-pro` | Seedance 1.0 Pro | 火山 | 视频三级兜底 | ✅ PASS（2.5 版本实测 404 不存在，一律用 1.0 Pro） |
| `happyhorse-1.0-video-edit` | HappyHorse 1.0 VideoEdit | 阿里 | 视频修复/消物 | ⚠️ 未实测（执行层失败自动返回原视频） |
| `yt-video-2.0` | 优图视频 2.0 | 腾讯 | 图生视频（闲置） | — |
| `vd-video-q3-turbo` | Vidu Q3 Turbo | 腾讯 | 快速视频（闲置） | — |
| `happyhorse-1.1-t2v` | HappyHorse 1.1 T2V | 阿里 | 文生视频（闲置） | — |

### 2.4 配音 / 声音复刻 / BGM

| registryKey | 模型 | 服务商 | 角色 | 实测 |
|---|---|---|---|---|
| `minimax-speech-2.8-hd` | MiniMax Speech 2.8 HD | 腾讯 | 高保真配音（TokenHub sync_tts 端点） | ✅ PASS |
| `minimax-voice-clone` | MiniMax 音色复刻 | 腾讯 | 声音复刻（TokenHub sync_clone） | ✅ PASS（正式使用前需先 sync_clone 生成 voice_id） |
| `minimax-music-v3.0` | MiniMax Music V3.0 | 腾讯 | BGM 真生成（`/v1/wand/minimax-music/generation` 同步返回） | ✅ PASS |
| `minimax-music-v2.6` | MiniMax Music V2.6 | 腾讯 | BGM 兜底 | ✅ PASS |
| `qwen-audio-3.0-tts-plus` | 千问 TTS Plus | 阿里 | 配音兜底（modelId=qwen-tts） | ✅ PASS |
| `doubao-seed-audio-1.0` | Doubao Seed Audio 1.0 | 火山 | 配音兜底 | ✅ PASS |
| `fun-music-v1` | Fun Music V1（百聆） | 阿里 | BGM 备选 | ❌ 403，需百炼控制台申请邀测开通；未开通不影响产线（BGM 由 minimax-music 承担） |
| `doubao-voice-clone-2.0` | 声音复刻 2.0（火山） | 火山 | 声音复刻 | ❌ 不可用（火山语音为独立 openspeech 服务，方舟 API Key 无效），注册保留勿用 |

### 2.5 视觉 / 视频理解 / 数字人

| registryKey | 模型 | 服务商 | 角色 | 实测 |
|---|---|---|---|---|
| `hy-vision-2.0` | 混元 Vision 2.0 | 腾讯 | 图片视觉安全复核 | ⚠️ 未实测（服务端 /vision-review 双路由：混元Vision→豆包多模态，任一路成功即返回） |
| `qwen-vl-max` | 千问视觉 Max | 阿里 | 视觉复核三级兜底 | ⚠️ 未实测（配置就绪） |
| `yt-vita-1.5` | YT-VITA 视频理解 | 腾讯 | 素材理解/剪辑点识别 | ✅ PASS |
| `yt-video-humanactor` | 数字人（数人） | 腾讯 | 数字人口播 | ⚠️ 未实测（失败自动降级 kling-video-v3） |

## 三、11 个创作类目逐阶段路由

> 路由原则：`primaryModel → fallbackModel → tertiaryModel` 三级，三云互备，任何一家故障产线不中断；质量最优模型一律放在 primary（可灵 / 千问图像 Max / MiniMax 2.8HD / DeepSeek V4 Pro / Qwen 3.8 Max 不动）。

### 1. 小红书图文（xiaohongshu，11 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis 爆款分析 | deepseek-v4-pro-tc | qwen3.8-max | doubao-seed-2.1-pro |
| outline 大纲 | deepseek-v4-pro-tc | — | — |
| draft 初稿 | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite 反AI化 | qwen3.8-max | kimi-k3 | — |
| image_generate 配图 | qwen-image-max | doubao-seedream-5.0-pro | — |
| image_enhance 增强 | qwen-image-edit | doubao-seededit-3.0-i2i | — |
| visual_review 视觉复核 | hy-vision-2.0 | doubao-seed-2.1-pro | qwen-vl-max |
| compliance_check 合规 | deepseek-v4-pro-tc | — | — |
| quality_review 评审 | deepseek-v4-pro-tc | — | — |
| style_calibration 校准 | qwen3.8-max | deepseek-v4-pro-tc | — |
| platform_adapt 适配 | qwen3.8-max | deepseek-v4-pro-tc | — |

### 2. 图片生成（image，9 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| visual_strategy | deepseek-v4-pro-tc | — | — |
| viral_analysis | deepseek-v4-pro-tc | — | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| image_prompt | qwen3.8-max | deepseek-v4-pro-tc | — |
| image_generate | qwen-image-max | doubao-seedream-5.0-pro | hy-image-v3 |
| image_enhance | qwen-image-edit | doubao-seededit-3.0-i2i | — |
| image_select | deepseek-v4-pro-tc | — | — |
| visual_review | hy-vision-2.0 | doubao-seed-2.1-pro | qwen-vl-max |
| compliance_check | deepseek-v4-pro-tc | — | — |

### 3. 电商详情页（ecommerce，12 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| outline | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| image_generate 主图 | wan2.7-image-pro-aly | hy-image-v3 | doubao-seedream-5.0-pro |
| image_generate 详情图 | qwen-image-max | doubao-seedream-5.0-pro | — |
| image_enhance | qwen-image-edit | doubao-seededit-3.0-i2i | — |
| visual_review | hy-vision-2.0 | doubao-seed-2.1-pro | qwen-vl-max |
| compliance_check | deepseek-v4-pro-tc | — | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

### 4. 短视频（shortVideo · AI导演模式，13 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| script_generate 分镜 | qwen-image-max | z-image-turbo | — |
| video_generate | vd-video-q3-pro | kling-video-v3 | doubao-seedance-1.0-pro |
| image_select | deepseek-v4-pro-tc | — | — |
| brand_voice_clone | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | glm-5.2 |
| bgm_generate | minimax-music-v3.0 | minimax-music-v2.6 | — |
| compliance_check | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

### 5. 智能剪辑（smartEdit，10 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| edit_plan 剪辑脚本 | deepseek-v4-pro-tc | qwen3.8-max | doubao-seed-2.1-pro |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| clip_analysis 素材理解 | yt-vita-1.5 | doubao-seed-2.1-pro | — |
| shot_order 卡点 | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| subtitle_generate | kimi-k3 | glm-5.2 | — |
| bgm_generate（方案） | qwen3.8-max | deepseek-v4-pro-tc | — |
| color_grading 调色 | deepseek-v4-pro-tc | qwen3.8-max | — |
| local_compose（FFmpeg 无模型） | qwen3.8-max | — | — |
| compliance_check | deepseek-v4-pro-tc | — | — |

### 6. 企业宣传视频（enterpriseVideo，11 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| outline | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| video_generate | kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |
| compliance_check | deepseek-v4-pro-tc | — | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

### 7. 产品宣传视频（productVideo，15 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| outline | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| image_generate 关键帧 | wan2.7-image-pro-aly | qwen-image-max | — |
| image_select | deepseek-v4-pro-tc | — | — |
| video_generate | kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |
| video_edit 形态修复 | happyhorse-1.0-video-edit | doubao-seededit-3.0-i2i | — |
| compliance_check 帧间一致 | deepseek-v4-pro-tc | — | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |
| compliance_check 广告法终审 | deepseek-v4-pro-tc | — | — |

### 8. 探店视频（storeTour，10 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| video_generate | kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |
| compliance_check | deepseek-v4-pro-tc | — | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

### 9. 真人MV（personMv，13 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| image_generate | qwen-image-max | z-image-turbo | — |
| video_generate | kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |
| video_edit | happyhorse-1.0-video-edit | doubao-seededit-3.0-i2i | — |
| compliance_check | deepseek-v4-pro-tc | — | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| compliance_check 版权终审 | deepseek-v4-pro-tc | — | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

### 10. 萌宠卡通（cartoonVideo，10 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| image_generate | qwen-image-max | z-image-turbo | — |
| video_generate | kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | qwen-audio-3.0-tts-plus | minimax-speech-2.8-hd | — |
| compliance_check | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| quality_review | deepseek-v4-pro-tc | — | — |

### 11. 数字人（digitalHuman，11 阶段）
| 阶段 | primary | fallback | tertiary |
|---|---|---|---|
| viral_analysis | deepseek-v4-pro-tc | — | — |
| draft | qwen3.8-max | deepseek-v4-pro-tc | — |
| anti_ai_rewrite | qwen3.8-max | kimi-k3 | — |
| compliance_check 情绪标记 | deepseek-v4-pro-tc | — | — |
| digital_human 出镜 | yt-video-humanactor | kling-video-v3 | — |
| subtitle_generate | deepseek-v4-pro-tc | qwen3.8-max | — |
| tts_generate | minimax-speech-2.8-hd | qwen-audio-3.0-tts-plus | — |
| compliance_check 合规 | deepseek-v4-pro-tc | — | — |
| style_calibration | qwen3.8-max | deepseek-v4-pro-tc | — |
| quality_review | deepseek-v4-pro-tc | — | — |
| platform_adapt | qwen3.8-max | deepseek-v4-pro-tc | — |

## 四、全局默认兜底链

阶段未单独配置 fallback/tertiary 时，执行层 `tryFallbackChain` 自动套用 `DEFAULT_FALLBACK_MODELS`（三云互备，仅 primary 缺 Key 或调用失败时触发）：

| 主模型 | 一级兜底 | 二级兜底 |
|---|---|---|
| deepseek-v4-pro-tc | qwen3.8-max | doubao-seed-2.1-pro |
| qwen3.8-max | deepseek-v4-pro-tc | doubao-seed-2.1-pro |
| kimi-k3 | qwen3.8-max | glm-5.2 |
| kling-video-v3 | hy-video-1.5 | doubao-seedance-1.0-pro |

## 五、五大横切能力（所有产线必经）

| 横切能力 | 实现方式 |
|---|---|
| 违禁内容检测 | 文本：deepseek-v4-pro-tc 合规筛查；图片视觉复核：hy-vision-2.0 → doubao-seed-2.1-pro → qwen-vl-max 三云路由 |
| 去AI化 | qwen3.8-max → kimi-k3 → glm-5.2（真人创作者视角重写） |
| 爆款创意注入 | viral_analysis 阶段（deepseek-v4-pro-tc → qwen3.8-max → doubao-seed-2.1-pro） |
| 质量优先 | quality_review / image_select 阶段 deepseek-v4-pro-tc 评审，不达标回退重生成 |
| AIGC 标识 | 文案注明 + 视频水印 + 合规筛查 aigcFlag（xiaohongshu / ecommerce / smartEdit / digitalHuman 已配显式标识） |

## 六、2026-08-31 真实接口实测记录

实测账号：客户账号 13166262006（userId=501c7b7a-9fd7-4cca-99dd-1f3ae068b75b，名"郝好"，三云 Key 已配）。脚本 `scripts/diag_p1_verify.ts`（v4，服务器 tsx 跑通）：

- ✅ 腾讯 DeepSeek V4 Pro 文本、火山 doubao-seed-2.1-pro 文本、火山 seedream-5.0-pro 图像
- ✅ 阿里 qwen-image-edit 图像编辑（正确格式：POST `multimodal-generation/generation`，body 用 `input.messages` 结构；基础版不支持 size 参数，实现中已去除）
- ✅ 腾讯 TokenHub minimax-music-v3.0 音乐生成（`/v1/wand/minimax-music/generation` 同步返回，实测 121.6s）
- ✅ 腾讯 minimax-speech-2.8-hd TTS（`/v1/wand/minimax-tts/sync_tts`）、minimax-voice-clone（sync_clone）
- ❌ 阿里 MiniMax Music：百炼无此模型（400），已确认 MiniMax Music 仅在腾讯 TokenHub 上架
- ❌ 阿里 fun-music-v1：403 Access denied（需百炼控制台申请邀测开通）
- ❌ 火山 doubao-seededit-3.0-i2i：404（需客户在火山方舟控制台开通该模型权限）
- ❌ 火山 TTS：方舟 /audio/speech 404（火山语音为独立 openspeech 服务）

## 七、已知限制与遗留事项

1. **火山 SeedEdit 权限**：`doubao-seededit-3.0-i2i` 需客户在火山方舟控制台开通权限后复测；未开通时该 fallback 不生效，但 primary（qwen-image-edit）不受影响。
2. **阿里 fun-music 邀测**：开通后可作为 BGM 备选，不影响产线。
3. **3 条未实测链路**（配置就绪 + 降级兜底，建议后续实测）：`hy-vision-2.0` 视觉复核、`happyhorse-1.0-video-edit` 视频修复、`yt-video-humanactor` 数字人。
4. **品牌音色**：正式使用前需先经 `sync_clone` 生成 voice_id。
5. **客户端 Key 依赖**：桌面端优先本地流水线（Key 存 localStorage），服务端仅用客户自配 Key，无系统兜底 Key；缺 Key 时走降级链或报"没有可用的 API 密钥"。

## 八、变更记录

| 日期 | 版本 | 说明 |
|---|---|---|
| 2026-09-01 | V1.0 | 最终版发布：以实测后 `category-config.ts`（三服务商三级路由）为唯一权威；删除 4 份未经实测的理论配置文档 |
