# AI 创作工厂 — 模型角色质量标准 V3.0

> 版本：V3.0（精简版）
> 更新日期：2026-08-05
> 基础：代码 `web/lib/ai/category-config.ts` 当前实际配置
> 用途：所有类目的模型配置以此为唯一参考标准。蓝皮书、本文档、代码三端必须一致。

## 核心原则

1. **质量优先，按需选择**：每个阶段的模型选择基于该阶段的具体任务和该类目的内容特征
2. **10 类目制**：删除短视频脚本（内容由各视频类目自行写脚本）、删除爆款内容创意（能力已内嵌各 pipeline 的 viral_analysis 阶段）
3. **四横切零容忍**：违禁内容检测(/compliance_check)、去AI化重写(/anti_ai_rewrite)、爆款基因注入(viral_analysis + outline)、质量关卡(quality_review)嵌入所有类目全部阶段
4. **产出去AI化**：所有文本产出必须真人创作者视角——真人出镜、真实场景、户外实景、真人说话、真人写作、真人拍摄效果、真人剪辑

## 模型角色标准

| 角色 | 首选模型 | 用途 | 选择理由 |
|------|---------|------|---------|
| 复杂推理/深度分析/策略规划 | **DeepSeek V4 Pro (TC)** | viral_analysis, outline, visual_strategy | 逻辑严谨、多步推理最强 |
| 创意文案/文学创作/影视脚本 | **千问 Qwen 3.8 Max** | draft, anti_ai_rewrite, style_calibration, platform_adapt | 最强中文创意写作、口语化能力 |
| 配图Prompt工程 | **千问 Qwen 3.8 Max** | image_prompt | 图片描述需要创意+技术结合 |
| 质量审核/评分 | **DeepSeek V4 Pro (TC)** | quality_review, image_select | 客观、逻辑性强，适合评审角色 |
| 合规筛查 | **DeepSeek V4 Pro (TC)** | compliance_check | 结构化判断、规则匹配能力强 |
| 长篇文本改写(双语) | **Kimi K3** | anti_ai_rewrite(备选) | 英文/双语场景的首选，中文场景的强力备选 |
| 人声 TTS | **MiniMax Speech 2.8 HD** | tts_generate (非卡通类) | 真人自然度最高，消除恐怖谷 |
| 萌音 TTS | **千问 Qwen TTS Plus** | tts_generate (卡通类) | 萌系角色配音最优 |
| 电商商品图 | **万相 Wan 2.7 Image Pro (阿里)** | image_generate (电商) | 电商白底图/商品图效果最佳 |
| 创意视觉图 | **千问 Qwen Image Max** | image_generate (创意/MV/卡通) | 创意风格多样性最好 |
| 商业视频 | **可灵 Kling Video V3** | video_generate (商业/带货) | 产品保留度最高 |
| 电影级视频 | **VD Video Q3 Pro** | video_generate (电影/艺术) | 叙事质感最佳 |
| BGM配乐 | **Fun Music V1** | bgm_generate | 唯一AI BGM引擎 |

## 逐类目模型决策（代码实际配置导出）

### 1. 小红书图文 (xiaohongshu)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 爆款意图深度分析 |
| outline | deepseek-v4-pro-tc | 结构化大纲策略规划 |
| draft | qwen3.8-max | 创意文案首选 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 中文口语化最强 + 强双语备选 |
| image_generate | qwen-image-max | 生活美学配图风格最佳 |
| compliance_check | deepseek-v4-pro-tc | 安全合规评审 |
| quality_review | deepseek-v4-pro-tc | 客观质量评分 |
| style_calibration | qwen3.8-max | 定稿润色 |
| platform_adapt | qwen3.8-max | 平台格式适配 |

### 2. 图片生成 (image)
| 阶段 | 模型 | 理由 |
|------|------|------|
| visual_strategy | deepseek-v4-pro-tc | 视觉策略属于复杂分析 |
| viral_analysis | deepseek-v4-pro-tc | 风格对标分析 |
| image_prompt | qwen3.8-max / deepseek-v4-pro-tc | 创意Prompt + 分析备选 |
| image_generate | qwen-image-max / z-image-turbo | 出图质量最优 + 快速备选 |
| image_enhance | qwen-image-max | 原生增强最优 |
| image_select | deepseek-v4-pro-tc | 评审客观 |
| compliance_check | deepseek-v4-pro-tc | 安全审查 |

### 3. 电商详情页 (ecommerce)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 品类爆款分析 |
| outline | deepseek-v4-pro-tc | 详情页结构规划 |
| draft | qwen3.8-max | 电商文案创作 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 电商口语化 + 英文国际化备选 |
| image_generate(主图) | wan2.7-image-pro-aly | 白底商品图最佳 |
| image_generate(详情) | qwen-image-max | 场景图创意 |
| compliance_check | deepseek-v4-pro-tc | 广告法合规 |
| quality_review | deepseek-v4-pro-tc | 转化力评审 |

### 4. 自由创意短片 (cinemaShort) — 替换原短视频脚本
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 创意风格对标 |
| draft | qwen3.8-max | 6镜头叙事脚本 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 叙事节奏反AI化（真人创作者视角） |
| script_generate(分镜) | qwen-image-max / z-image-turbo | 分镜视觉化 |
| video_generate | vd-video-q3-pro / kling-video-v3 | 电影级质感首选 + 商业备选 |
| image_select | deepseek-v4-pro-tc | 镜头质量评审 |
| brand_voice_clone | minimax-speech-2.8-hd | 品牌配音克隆 |
| subtitle_generate | deepseek-v4-pro-tc / qwen3.8-max | 中英双语字幕 |
| bgm_generate | fun-music-v1 | BGM自动匹配 |
| compliance_check | deepseek-v4-pro-tc | 版权合规 |
| quality_review | deepseek-v4-pro-tc | 艺术感终审 |
| style_calibration | qwen3.8-max | 叙事节奏微调 |
| platform_adapt | qwen3.8-max | 多平台格式输出 |

### 5. 企业宣传视频 (enterpriseVideo)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 品牌传播分析 |
| outline | deepseek-v4-pro-tc | 品牌故事规划 |
| draft | qwen3.8-max | 品牌文案创作 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 去官方腔 |
| script_generate | qwen-image-max | 品牌视觉化 |
| video_generate | kling-video-v3 | 品牌画面生成 |
| video_edit | happyhorse-1.0-video-edit | 品牌元素修复 |
| image_select | deepseek-v4-pro-tc | 品牌一致性审查 |
| tts_generate | minimax-speech-2.8-hd | 专业品牌配音 |
| subtitle_generate | deepseek-v4-pro-tc | 双语字幕 |
| compliance_check | deepseek-v4-pro-tc | 企业数据合规 |
| quality_review | deepseek-v4-pro-tc | 品牌调性评审 |

### 6. 产品宣传视频 (productVideo)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 带货对标分析 |
| outline | deepseek-v4-pro-tc | 8镜头分镜规划 |
| draft | qwen3.8-max | 带货脚本 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 带货口语化 |
| image_prompt | deepseek-v4-pro-tc | 产品视觉分析 |
| image_generate(关键帧) | wan2.7-image-pro-aly | 产品图质感 |
| video_generate | kling-video-v3 | 产品视频保留度最高 |
| video_edit | happyhorse-1.0-video-edit | 产品形态修复 |
| tts_generate | minimax-speech-2.8-hd | 带货配音 |
| subtitle_generate | deepseek-v4-pro-tc | 双语字幕 |
| compliance_check | deepseek-v4-pro-tc | 广告法终审 |
| quality_review | deepseek-v4-pro-tc | 转化力评审 |

### 7. 探店视频 (storeTour)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 探店对标 |
| draft | qwen3.8-max | 探店脚本(高温创意) |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 真人探店口语 |
| video_generate | kling-video-v3 | 探店环境画面生成 |
| tts_generate | minimax-speech-2.8-hd | 第一视角自然配音 |
| subtitle_generate | deepseek-v4-pro-tc | 双语字幕 |
| compliance_check | deepseek-v4-pro-tc | 广告标识检查 |
| quality_review | deepseek-v4-pro-tc | 真实感评审 |

### 8. 真人MV视频 (personMv)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 流行趋势分析 |
| draft | qwen3.8-max | MV创意脚本 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 艺术表达润色 |
| image_generate | qwen-image-max | MV视觉关键帧 |
| video_generate | kling-video-v3 | 图生视频 |
| video_edit | happyhorse-1.0-video-edit | 人物一致性修复 |
| tts_generate | minimax-speech-2.8-hd | 人声+伴奏 |
| subtitle_generate | deepseek-v4-pro-tc | 歌词同步字幕 |
| compliance_check | deepseek-v4-pro-tc | 版权合规(音乐/肖像/字体) |
| quality_review | deepseek-v4-pro-tc | 艺术感评审 |

### 9. 萌宠卡通短视频 (cartoonVideo)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 爆款对标 |
| draft | qwen3.8-max | 创意脚本(高温) |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 可爱风润色 |
| image_generate | qwen-image-max | 卡通素材 |
| video_generate | kling-video-v3 | 动画视频生成 |
| tts_generate | qwen-audio-3.0-tts-plus | 萌音配音(此场景 Qwen > MiniMax) |
| subtitle_generate | deepseek-v4-pro-tc | 卡通字幕 |
| compliance_check | deepseek-v4-pro-tc | 儿童安全/动物保护审查 |
| quality_review | deepseek-v4-pro-tc | 趣味性评审 |

### 10. 数字人 (digitalHuman)
| 阶段 | 模型 | 理由 |
|------|------|------|
| viral_analysis | deepseek-v4-pro-tc | 口播对标 |
| draft | qwen3.8-max | 口播脚本 |
| anti_ai_rewrite | qwen3.8-max / kimi-k3 | 说话而非朗读 |
| digital_human | yt-video-humanactor | 数字人出镜 |
| tts_generate | minimax-speech-2.8-hd | 自然配音(消除恐怖谷) |
| subtitle_generate | deepseek-v4-pro-tc | 双语字幕 |
| compliance_check | deepseek-v4-pro-tc | 合规(肖像/辟谣) |
| quality_review | deepseek-v4-pro-tc | 拟真度评审 |

## 各阶段通用反AI化要求

所有类目共享以下反AI化原则：
- anti_ai_rewrite 必须以真人创作者视角重写：真人出镜感、真实场景感、真人说话语气、真人写作风格、真人拍摄效果描述、真人剪辑逻辑
- 视频类目 subtitle_generate 默认中英双语
- 视频类目 tts_generate 默认自然配音，支持方言配音(四川话/东北话/粤语/上海话/闽南话/河南话/湖南话/陕西话/天津话)
- compliance_check 覆盖内容安全 + 广告法 + 版权
- 图片类目分辨率≥2048x2048，视频类目≥1080p@30fps（cinemaShort 4K）
- 爆款分析(viral_analysis)和8维评分(outline)内嵌在每个类目的前两个阶段，不是独立功能

## 变更审计清单

修改 `category-config.ts` 前必须：
1. 对照本文档确认目标模型在各阶段的最佳选择
2. 同步更新 `requiredModels` 数组
3. 确保 MODIFY_INFO 中已注册目标模型
4. 在本文档末尾添加变更记录

### 变更记录

#### 2026-08-05 V3.0 大版本升级
- 删除短视频脚本 (shortVideo)，由自由创意短片 (cinemaShort) 替换为位置 4
- 删除爆款内容创意 (content-creativity) 独立类目，其能力内嵌各 pipeline 的 viral_analysis 阶段
- 去除 hy3 模型引用，全部改为 deepseek-v4-pro-tc（与代码保持一致）
- 10 类目制：最终 1-xiaohongshu / 2-image / 3-ecommerce / 4-cinemaShort / 5-enterpriseVideo / 6-productVideo / 7-storeTour / 8-personMv / 9-cartoonVideo / 10-digitalHuman
- 全部图片分辨率升级为 2048x2048，视频升级为 1080p@30fps，cinemaShort 4K@30fps
- 明确反AI化原则：真人出镜/真实场景/户外实景/真人说话/真人写作/真人拍摄效果/真人剪辑
- 明确字幕中英双语默认、方言配音支持

#### 2026-08-04 V2.0 修正（已废弃）
- 新增 hy3 模型注册（已废弃，V3.0 回退为 deepseek-v4-pro-tc）
- 全部 11 个类目 viral_analysis → hy3（已废弃）
