# 智枢AI 系统 AI 模型配置「9 个方面」达成度评估报告

**评估日期**：2026-09-01
**评估对象**：智枢AI AI创作工厂（电脑端 desktop-ui + 手机端 APK + 生产服务端）
**评估标准**：2026-08-31 会话确定的 9 项横切能力（audit_category_capability.ts 审计矩阵）

---

## 一、结论摘要

电脑端工作区代码层面已**全部满足** 9 个方面（审计脚本结论"无配置问题"）。昨天（8/31）确实做过两类实际测试并都通过——①生产环境客户手机端链路端到端实测（续18，已部署代码，小红书图文/图片/视频真实生成）；②真实三云 Key 直连第三方接口的格式实测（续25，qwen-image-edit、minimax-music、sync_tts 等 PASS）。这两类测试证明了"配置与代码是正确的、可运行的"。但测试没有改变生产环境的代码版本：**续19-26 的全部代码改动只存在于本地工作区，从未 commit、从未部署**（SESSION_MEMORY 每条均标注"未部署远端，待用户确认"）。2026-09-01 生产服务器实测确认：`vision-review`=0、`aigc-badge`=0、`sync_tts`=0、`realismType`=0、`model-registry` 仍为旧 modelId——9 项中的视觉复核、视频 AIGC 角标、真实感词库、TTS 修正等在生产环境均未生效。因此**"配置正确、接口可行"（昨天已验证）与"上线可用"（尚未达成）是两回事**：要真正让 9 项在用户可用的环境中生效，还需提交、部署生产服务端、重新发布桌面安装包三步。

补充说明（针对用户质疑）：电脑端与手机端确实是同一套生产服务端的两个出口，两端共享服务端模型路由/API Key/降级逻辑，服务端模型配置与效果两端天然一致。上一版报告把 APK 端本地清单列为"半满足"是误导——该清单无任何 UI 引用、不影响任何实际效果，APK 端是否达标完全取决于服务端状态。区别仅在于：桌面端独有"AI创作工厂 11 类目完整流水线"（9 个方面即此场景），APK 端只提供轻量 AI 助手对话/诊断/文档生成，不走完整流水线，因此 9 项的实际生效载体是桌面端工厂 + 两端共享的生产服务端。

## 二、9 个方面定义与达成口径

| # | 方面 | 审计判定依据 | 适用类目 |
|---|------|-------------|---------|
| 1 | 反AI化 | 流水线含 anti_ai_rewrite 阶段 | 11/11 |
| 2 | 合规筛查 | 流水线含 compliance_check 阶段 | 11/11 |
| 3 | 质量评审 | 流水线含 quality_review 阶段 | 10/11 |
| 4 | 实拍重拍闭环 | quality_review + reviewType=realism | 6/11（6个视频类目） |
| 5 | 视觉复核 | 流水线含 visual_review 阶段 | 3/11（图片三件套） |
| 6 | AIGC标识 | compliance_check + aigcFlag=true | 4/11 |
| 7 | 视频拍摄 | 流水线含 video_generate / digital_human 阶段 | 7/8（smartEdit剪辑类不含） |
| 8 | 字幕 | 流水线含 subtitle_generate 阶段 | 8/8 |
| 9 | 配音 | 流水线含 tts_generate / brand_voice_clone / dialect_voiceover 阶段 | 8/8 |

## 三、三端配置状态对照

| 端 | 状态 | 9 项达成 |
|----|------|---------|
| 电脑端工作区 category-config.ts（未提交 +197 行） | 完整：visual_review 4处、aigcFlag 4处、全类目反AI化/合规，已注册 minimax-music-v3.0、minimax-voice-clone、qwen-vl-max | ✅ 全部满足 |
| 已发布 3.6.1 安装包（HEAD=ac2620c） | visual_review=0 处、aigcFlag 仅 1 处 | ❌ 缺视觉复核 + 大部分AIGC标识 |
| 生产服务端 server/ | 实测（2026-09-01 ssh 检查 150.109.60.130）：ai-realism-prompts.ts 已存在、ai-client.ts 含续18视频三处修复（usedKeyId/getProviderBaseUrl/size，pm2 uptime 23h 与此吻合）；但 vision-review=0、aigc-badge=0、sync_tts=0、realismType=0、model-registry speech-2.8-hd 仍是旧 modelId 'MiniMax/speech-2.8-hd' | ❌ 仅续18部分上线，续19-26 全部未部署 |
| APK 端 ai-chat.service.ts（未提交 +117 行） | RECOMMENDED_MODELS 六类目已更新、ALL_MODELS=9在售+火山双模型；**无任何 UI/业务引用，纯展示性清单，不影响任何实际效果** | ✅ 不受影响（实际能力由共享服务端决定） |

## 四、逐项达成分析

**电脑端工作区（已满足）**：审计脚本跑通 11 个类目全量流水线，无配置问题。反AI化 11/11、合规筛查 11/11、质量评审 10/11、实拍重拍闭环 6/11、视觉复核 3/11、AIGC 标识 4/11、视频拍摄 7/8、字幕 8/8、配音 8/8。未覆盖项均为"类目不适用"（如 smartEdit 剪辑类无重拍闭环、image 无字幕配音），而非配置缺失。执行层 factory-service.ts 已内置三级降级、overlayVideoAIGCBadge、视觉复核中断逻辑。

**已发布 3.6.1 安装包（未满足）**：git show HEAD 验证 category-config.ts 中 visual_review/aigcFlag 仅 1 处命中。即用户当前安装的桌面版**没有视觉复核、没有大多数类目的 AIGC 标识**，工作区新增的 197 行配置全部未进入发布版。

**生产服务端（未满足）**：2026-09-01 直接 ssh 生产服务器实测确认——`/vision-review` 路由 0 处、`aigc-badge` 0 处、`sync_tts` 0 处、`ai-client.ts realismType` 0 处、`model-registry` speech-2.8-hd 仍为旧 modelId（'MiniMax/speech-2.8-hd'，未改为 'minimax-speech-2.8-hd'）；同时 `ai-realism-prompts.ts` 文件已存在、pm2 服务 uptime 23h 与续18 部署时间吻合。即生产 = 3.6.1 基线 + 续18 视频三处修复（客户手机端打通依赖的部分），**续19-26 的视觉复核、AIGC 角标、真实感、M6 火山路由、TTS 修正等全部未部署**。

**APK 端（不受影响）**：apk 本地清单虽已按统一标准更新（9 在售 + 火山双模型），但该文件无任何 UI/业务引用，属纯展示性配置，不影响任何实际效果。移动端真实链路全部经服务端代理（/ai-chat/*、/ai-enhanced/*）承载，与电脑端共享同一服务端——因此用户"电脑端与手机端只是两个出口"的判断正确，APK 端是否达标完全取决于服务端状态，与本地清单无关。区别仅在于桌面端独有的 AI创作工厂完整流水线（9 项场景）与 APK 端轻量 AI 助手（对话/诊断/文档生成）的能力边界不同。

## 五、结论：能否满足 9 个方面

- **配置与接口可行性（昨天已实测验证）**：能。工作区配置完整覆盖 9 项、审计无配置问题；续25 用真实三云 Key 直连第三方接口验证 qwen-image-edit / minimax-music / sync_tts 等格式均正确；续18 在生产环境实测客户手机端图文/图片/视频链路真实生成成功。
- **用户可用环境（今天评估）**：尚不能。已发布 3.6.1 安装包缺视觉复核与大部分 AIGC 标识；生产服务端经 ssh 实测仅上线了续18 部分，续19-26（视觉复核、AIGC 角标、真实感词库、M6 火山路由、TTS 修正等）全部未部署。由于电脑端与手机端共享同一生产服务端，两端实际能力共同受此限制。
- **两者关系**：昨天测试证明"配置是对的、代码能跑通"，今天的评估回答"这些代码是否已进入用户能用的环境"——答案是没有。两结论不矛盾，差距就是未提交 + 未部署 + 未重新发布。

## 六、落地三步（当前阻塞项）

1. **提交推送**：commit 全部未提交修改（12 个修改文件 + 新增审计脚本/报告），push 至 GitHub main 触发 CI。
2. **部署生产服务端**：scp 未提交的 server/ 文件到 150.109.60.130 对应路径 → `pm2 restart zhishuai-api` → 运行 `bash scripts/verify-login.sh` 三角色验证。此步同时提升电脑端与手机端两端的模型能力。
3. **重新发布桌面版**：Tauri 构建新安装包发布到 downloads/，替换 3.6.1（桌面端独有流水线编排配置需随安装包更新）。

## 七、风险与建议

- 生产服务端所有续 18-28 修改均未跑 tsc 构建校验，部署前需在本地 `npm run build:server` 通过。
- 审计报告标注 3 个未经生产实测的调用链：hy-vision-2.0（视觉复核）、happyhorse-1.0-video-edit（视频修复）、yt-video-humanactor（数字人）。视觉复核与数字人均已内置失败降级，不会阻断成片，但建议上线后做一次实测。
- SESSION_MEMORY 续 28 记录（daily=hy3/copywriting=qwen3.7-plus）与实际工作区（kimi-k3/qwen3.8-max）不一致，文档需同步修正。

## 参考依据

- `scripts/audit_category_capability.ts`（9 列审计矩阵定义）
- `docs/audit_category_capability.md`（工作区审计输出，2026-09-01 14:03）
- `git show HEAD:desktop-ui/lib/ai/category-config.ts`（3.6.1 已发布版验证）
- 生产服务器 grep 验证（vision-review/aigc-badge/sync_tts/volcano 各关键修复均为 0 处）
- 本地与生产 ai-client.ts / model-registry.ts MD5 比对
