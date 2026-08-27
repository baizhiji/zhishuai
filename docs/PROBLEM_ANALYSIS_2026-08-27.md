# 智枢AI系统试用问题分析报告

**日期**：2026-08-27
**范围**：APK 端 + 电脑端（desktop-ui）双端排查，含后端 API
**状态**：仅分析，未修改任何代码

---

## 1. 客服二维码在手机端不显示

**根因**：后端返回相对路径，APK 端未拼接服务器地址。

- 后端 `server/src/routes/support.ts:66`：管理员通过文件上传二维码时，数据库存储的 url 是相对路径 `/uploads/support_qrcode_xxx.jpg`（管理员直接填完整 URL 时才会存绝对地址）。
- 电脑端客服页面用 `absUrl(url)` 把相对路径拼成完整 URL，所以电脑端能显示。
- APK 端 `apk/src/screens/SupportQRScreen.tsx`：`const url = data?.url ?? data?.qrCodeUrl ?? ''` 后直接 `source={{ uri: url }}`，React Native 的 `<Image>` 无法加载 `/uploads/...` 这种无域名的相对路径，因此不显示。
- 附加：SESSION_MEMORY 记录此前有"待管理员在后台重新上传正式企业微信二维码"的待办，需确认当前库中 `support_qrcode` 是否有值。

**影响**：APK 端必现（只要库里存的是相对路径）；电脑端正常。

## 2. 生成内容时上传的素材不能预览

- APK 端 `apk/src/screens/AICreateDetailScreen.tsx` 的 `renderCommonFields` 上传列表：每个已上传文件只渲染「图标 + 文件名 + 删除按钮」，图片/视频均无缩略图、点击无预览。
- 电脑端 `desktop-ui/app/customer/ai-factory/page.tsx` 使用 AntD `Upload listType="picture-card"`：图片有缩略图，但视频/文档仍只显示文件图标，无法预览内容。

**影响**：APK 端完全无预览；电脑端图片可预览、视频/文档不可预览。

## 3. 上传素材没有说明要求（格式/大小/数量）

- APK 端上传区域只有"上传文档/图片/视频"文字和按钮，无任何格式、大小、数量说明。`DocumentPicker` 里的类型限制（pdf/word/txt 等）用户完全不可见。
- 电脑端 `Upload` 组件设置了 `maxCount={10}` 和 `beforeUpload` 限制，但 UI 上没有任何文字提示；也没有格式、大小说明。
- 后端 `server/src/routes/materials.ts` 实际有完整约束（文件 100MB 上限、图片 MIME 白名单、文档扩展名白名单），但两端 UI 均未向用户展示这些规则，用户只能试错。

**影响**：两端均无说明，违反"先告知再使用"的体验预期。

## 4. 生成的内容没有在内容中心里

**根因**：生成完成后两端都不会自动保存到内容中心，需手动点击保存；且保存内容不完整。

- 电脑端 `ai-factory/page.tsx`：生成后仅同步"生成历史"（`POST /ai-enhanced/history`），内容中心需手动点"保存到内容中心"；保存时只传 `content: generatedContent`（文本），图片/视频 URL 不保存；且 `if (!generatedContent) return`，纯图片/视频类目无文本时无法保存。
- APK 端 `AICreateDetailScreen.tsx` `handleSave`：mixed 类目只保存文本；图片/视频类目调用 `handleSave(url)`，保存的是 URL 字符串而非媒体本身。
- 后端 `POST /materials` 仅接受 title/content/type 等字段，没有 images 数组，多张配图无法入库。

**影响**：两端一致。用户期望"生成后内容自动进入内容中心"，当前必须手动保存且图文类目保存不完整。

## 5. 手机端内容中心筛选条件包含旧的/未使用的类目

**根因**：APK 端内容中心直接用历史遗留的全量 `contentCategoryConfig` 生成筛选条件，与真实创作工厂类目不一致。

- APK 端 `apk/src/services/content.service.ts` 的 `contentCategoryConfig` 包含旧类目：标题、话题/标签、文案生成、图生文等（还有 AI短剧/AI漫剧预留项、爆款内容创意等）。
- APK 端 `MaterialsScreen.tsx` 筛选弹窗用 `Object.entries(contentCategoryConfig)` 全部生成筛选按钮，因此出现"标题/话题标签/文案生成/图生文"等从未出现在创作工厂里的条件。
- APK 创作工厂 `AICreateCenterScreen.tsx` 实际只展示 12 个类目。
- 电脑端 `desktop-ui/lib/content/types.ts` 的 `contentCategoryConfig` 只有当前 12 个类目（无标题/话题标签/文案生成/图生文），电脑端筛选正常。

**影响**：APK 端；电脑端无此问题（但电脑端仍含 AI短剧/AI漫剧两个预留类目）。

## 6. 生成内容时没有显示真实的进度

- APK 端：生成中仅显示 ActivityIndicator 转圈 + "AI 生成中"文案，无任何进度信息。
- 电脑端 `ai-factory/page.tsx`：`setInterval(() => setProgress(prev => (prev >= 90 ? prev : prev + Math.random() * 15)), 300)` —— 是随机数模拟的假进度，不是真实任务进度。
- 后端视频生成为长轮询（可灵→混元→Seedance→万相四路降级），无进度查询接口；图片生成阿里百炼为异步任务（task_id 轮询），但前端无感知。

**影响**：两端均无真实进度，用户只能干等。

## 7. 小红书图文生成只有图片、没有文本（文字被"堆"在图片里）

**根因**：APK 端 mixed 类目生成链路与文案形态不符合"图文"预期。

- APK 端 mixed 类目（小红书图文/电商详情页）流程：`generateText`（`POST /ai-enhanced/post`，contentType=content_creativity）→ 后端返回"爆款内容创意蓝图"（`CREATIVE_SYSTEM_PROMPT`：爆款潜力分析 + 3 个创意方向 + TOP3 标题 + 完整正文 + 发布策略）；随后 `generateImage`（`POST /ai-chat/image`）→ 3 张配图。
- 结果区代码逻辑上"文本卡片 + 图片卡片"都会渲染，但存在以下问题导致用户实际看到"只有图片"：
  - 生成的是"创意蓝图"分析长文，不是小红书可直接发布的「标题+正文+标签」文案结构，用户不把它当作"文本结果"；
  - 配图 prompt 仅 `生成一张{风格}风格的图片，主题：{description}`，腾讯 HY-Image-V3.0 / 阿里 wan2.7 / 火山 ark 等生图模型会把 prompt 中的文字渲染进画面，形成"文字海报"（即用户说的"把文字堆在图片里"）；
  - `needUpload: true` 强制上传素材，但 mixed 分支生成时 `uploadedFiles` 完全未使用，素材形同虚设；
  - 若 generateText 请求超时/失败（后端 max_tokens=2048 生成较慢），`generatedContent` 为空 → 结果区只显示图片，无文本。
- 电脑端小红书图文用 `buildTextPrompt`（结构化文案 prompt）+ `buildImagePrompt` 生成，文本+图片均展示，问题相对轻，但同样存在"配图文字化"风险。

**影响**：APK 端明显；电脑端部分存在。

## 8. 生成的水印不对（当前显示【AI生成】）

**根因**：产品没有真正实现品牌水印叠加，用户看到的是生图/生视频模型平台自带的水印。

- 产品设计的水印/标识（之前确定的内容）：
  - 文本 AIGC 标识：`server/src/services/aigc-label.ts` 中 `AIGC_LABEL = '【智枢AI生成】'`，文案追加"本内容由【智枢AI生成】，请注意甄别。"（蓝皮书规定：显式标识统一采用"本内容由智枢AI生成"，短场景"智枢AI生成"）。
  - 视频品牌水印：`bannerOverlayOptions` 中 `watermark` = "右下角半透明品牌水印'@智枢AI'，全程显示"——但只是把描述写进生成 prompt，交给视频模型渲染，不是真实叠加层，模型大概率不会真的打上"@智枢AI"。
- 用户实际看到的【AI生成】来自：生图/生视频平台自带水印（腾讯 HY-Image-V3.0、阿里 wan2.7、火山 ark 出图；可灵/混元视频/Seedance/万相出视频），这些平台的输出内容自带"AI生成"角标，产品端没有任何后处理去水印/加水印。
- 图片生成类目没有走 bannerOverlay 逻辑，因此图片上既没有"@智枢AI"品牌水印，也去不掉平台水印。

**影响**：两端一致。平台水印直接暴露，品牌水印"@智枢AI"/"智枢AI生成"未真正叠加。

---

## 汇总表

| # | 问题 | APK 端 | 电脑端 | 核心根因 |
|---|------|--------|--------|----------|
| 1 | 客服二维码不显示 | 有 | 无 | APK 未拼接相对路径 URL |
| 2 | 上传素材不能预览 | 有（完全无） | 部分（视频/文档无） | APK 上传列表仅图标+文件名 |
| 3 | 上传无要求说明 | 有 | 有 | UI 未展示格式/大小/数量规则 |
| 4 | 内容不在内容中心 | 有 | 有 | 生成后不自动保存、媒体不保存 |
| 5 | 内容中心筛选含旧类目 | 有 | 无 | APK 用全量旧 config 生成筛选 |
| 6 | 无真实进度 | 有（仅转圈） | 有（假进度） | 前端模拟/无进度接口 |
| 7 | 小红书图文无文本 | 明显 | 较轻 | 生成"创意蓝图"+配图文字化+素材未用 |
| 8 | 水印显示【AI生成】 | 有 | 有 | 平台水印暴露，品牌水印未叠加 |

## 建议修复方向（供确认，未实施）

1. 客服二维码：后端在 qrcode 接口把相对路径拼成完整 URL，或 APK 端加 `toAbsoluteUrl` 处理。
2. 上传预览：APK 上传列表对图片显示缩略图、视频可点击播放预览。
3. 上传说明：两端上传区展示格式/大小/数量限制（对齐后端已存在的校验规则）。
4. 内容中心：生成完成后自动保存到 /materials；保存时附带媒体 URL（后端 /materials 增加 images 字段）。
5. 筛选条件：APK 端内容中心改用与创作工厂一致的类目白名单生成筛选。
6. 真实进度：后端生成任务增加进度/阶段查询接口，两端轮询展示。
7. 小红书图文：APK 文案生成改为「标题+正文+标签」结构化输出；配图 prompt 明确"画面不要出现任何文字"；素材参与配图；若文本失败给出明确提示。
8. 水印：生成结果增加品牌水印后处理（图片叠加"@智枢AI"/"智枢AI生成"，视频叠角标）；文本标识保持"本内容由【智枢AI生成】"。

> 注：问题 8 需要与你确认目标水印文案与样式（蓝皮书为"本内容由智枢AI生成"，视频横幅预设为"@智枢AI"），确认后再实施。
