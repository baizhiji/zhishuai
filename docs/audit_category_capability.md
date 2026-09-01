# AI创作工厂 11 类目能力审计报告

**审计时间**：2026/9/1 14:03:24
**数据源**：desktop-ui/lib/ai/category-config.ts（CATEGORY_PIPELINES + MODEL_INFO）

## 一、类目总览

| 类目 | 阶段数 | 反AI化 | 合规筛查 | 质量评审 | 实拍重拍闭环 | 视觉复核 | AIGC标识 | 视频拍摄 | 字幕 | 配音 |
|------|-------|-------|---------|---------|-------------|---------|---------|---------|------|------|
| 小红书图文(xiaohongshu) | 11 | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| 图片生成(image) | 9 | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — |
| 电商详情页(ecommerce) | 12 | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| 短视频(shortVideo) | 13 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| 智能剪辑(smartEdit) | 10 | ✅ | ✅ | — | — | — | ✅ | — | ✅ | ✅ |
| 企业宣传视频(enterpriseVideo) | 11 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| 产品宣传视频(productVideo) | 15 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| 探店视频(storeTour) | 10 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| 真人MV视频(personMv) | 13 | ✅ | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ |
| 萌宠卡通短视频(cartoonVideo) | 10 | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | ✅ |
| 数字人(digitalHuman) | 11 | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |

## 二、配置问题

无配置问题：全部阶段模型均已注册，requiredModels 覆盖完整。

## 三、横切能力覆盖统计

- 反AI化覆盖：11/11 个类目
- 合规筛查覆盖：11/11
- 质量评审覆盖：10/11
- 实拍重拍闭环（quality_review+realism）：6/11，类目：shortVideo、enterpriseVideo、productVideo、storeTour、personMv、digitalHuman
- 图片视觉复核（visual_review）：3/11，类目：xiaohongshu、image、ecommerce
- AIGC 显式标识（aigcFlag）：4/11，类目：xiaohongshu、ecommerce、smartEdit、digitalHuman

- 视频类目（8 个）：视频拍摄 7/8，字幕 8/8，配音 8/8，重拍闭环 6/8

## 四、模型使用热度（被 N 个类目引用）

| 模型 registryKey | 引用类目数 | 类目 |
|-----------------|-----------|------|
| deepseek-v4-pro-tc (DeepSeek V4 Pro) | 11 | xiaohongshu、image、ecommerce、shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| qwen3.8-max (Qwen 3.8 Max) | 11 | xiaohongshu、image、ecommerce、shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| kimi-k3 (Kimi K3) | 11 | xiaohongshu、image、ecommerce、shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| minimax-speech-2.8-hd (MiniMax Speech 2.8 HD) | 8 | shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| qwen-audio-3.0-tts-plus (千问 TTS Plus) | 8 | shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| minimax-voice-clone (MiniMax 音色复刻) | 8 | shortVideo、smartEdit、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| qwen-image-max (千问图像 Max) | 7 | xiaohongshu、image、ecommerce、shortVideo、productVideo、personMv、cartoonVideo |
| kling-video-v3 (可灵 KLING 3.0) | 7 | shortVideo、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo、digitalHuman |
| z-image-turbo (Z-Image Turbo) | 6 | xiaohongshu、image、ecommerce、shortVideo、personMv、cartoonVideo |
| doubao-seedance-1.0-pro (Doubao Seedance 1.0 Pro) | 6 | shortVideo、enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo |
| doubao-seededit-3.0-i2i (Doubao SeedEdit 3.0 I2I) | 5 | xiaohongshu、image、ecommerce、productVideo、personMv |
| hy-video-1.5 (混元视频 1.5) | 5 | enterpriseVideo、productVideo、storeTour、personMv、cartoonVideo |
| doubao-seed-2.1-pro (Doubao Seed 2.1 Pro) | 4 | xiaohongshu、image、ecommerce、smartEdit |
| doubao-seedream-5.0-pro (Doubao Seedream 5.0 Pro) | 3 | xiaohongshu、image、ecommerce |
| qwen-image-edit (千问图像编辑) | 3 | xiaohongshu、image、ecommerce |
| hy-vision-2.0 (混元 Vision 2.0) | 3 | xiaohongshu、image、ecommerce |
| qwen-vl-max (千问视觉 Max) | 3 | xiaohongshu、image、ecommerce |
| hy-image-v3 (混元 Image 3.0) | 2 | image、ecommerce |
| wan2.7-image-pro-aly (WAN 2.7 图像 Pro) | 2 | ecommerce、productVideo |
| glm-5.2 (GLM 5.2 (方舟)) | 2 | shortVideo、smartEdit |
| happyhorse-1.0-video-edit (HappyHorse 1.0 VideoEdit) | 2 | productVideo、personMv |
| vd-video-q3-pro (Vidu Q3 Pro) | 1 | shortVideo |
| minimax-music-v3.0 (MiniMax Music V3.0) | 1 | shortVideo |
| minimax-music-v2.6 (MiniMax Music V2.6) | 1 | shortVideo |
| yt-vita-1.5 (YT-VITA 视频理解) | 1 | smartEdit |
| yt-video-humanactor (数字人（数人）) | 1 | digitalHuman |

### 闲置模型（MODEL_INFO 已注册但未被任何类目引用）

| 模型 | 是否在"可清理"标注中 |
|------|----------------------|
| qwen3.7-max (Qwen 3.7 Max) | ✅ 已标注可清理
| qwen-max-aly (Qwen Max (经典)) | ✅ 已标注可清理
| qwen3.7-plus (Qwen 3.7 Plus) | ✅ 已标注可清理
| hy-image-lite (混元 Image Lite) | ✅ 已标注可清理
| qwen-image-3.0-pro (千问图像 3.0 Pro) | ✅ 已标注可清理
| yt-video-2.0 (优图视频 2.0) | ✅ 已标注可清理
| vd-video-q3-turbo (Vidu Q3 Turbo) | ✅ 已标注可清理
| happyhorse-1.1-t2v (HappyHorse 1.1 T2V) | ✅ 已标注可清理
| doubao-seed-2.1-turbo (Doubao Seed 2.1 Turbo) | ✅ 已标注可清理
| doubao-seed-2.0-pro (Doubao Seed 2.0 Pro) | ✅ 已标注可清理
| doubao-seed-1.6 (Doubao Seed 1.6) | ✅ 已标注可清理
| doubao-seed-1.6-thinking (Doubao Seed 1.6 Thinking) | ✅ 已标注可清理
| doubao-seed-2.0-lite (Doubao Seed 2.0 Lite) | ✅ 已标注可清理
| doubao-seedream-5.0-lite (Doubao Seedream 5.0 Lite) | ✅ 已标注可清理
| doubao-seedream-4.0 (Doubao Seedream 4.0) | ✅ 已标注可清理
| doubao-seed-audio-1.0 (Doubao Seed Audio 1.0) | ⚠️ 未标注，建议补入清理清单或启用
| doubao-voice-clone-2.0 (声音复刻 2.0（火山）) | ✅ 已标注可清理
| deepseek-v4-volcano (DeepSeek V4 (方舟)) | ✅ 已标注可清理
| kimi-k2.7 (Kimi K2.7 (方舟)) | ✅ 已标注可清理
| minimax-m3 (MiniMax M3 (方舟)) | ✅ 已标注可清理
| fun-music-v1 (Fun Music V1（百聆）) | ✅ 已标注可清理

## 五、建议实测模型（未经验证的调用链）

- **hy-vision-2.0**（混元 Vision 2.0）：visual_review 视觉复核依赖，需实测腾讯 TokenHub 多模态图片 URL 检测（失败时前端降级不阻断）。
- **happyhorse-1.0-video-edit**（HappyHorse 1.0 VideoEdit）：productVideo/personMv 的视频修复环节，未经生产实测；执行层已内置失败降级（返回原视频，不中断成片）。
- **yt-video-humanactor**（数字人）：digitalHuman 的"图片+音频"驱动出镜，服务端有专门分支但未经生产实测；已配置 kling-video-v3 兜底（数字人失败自动降级图生视频）。

