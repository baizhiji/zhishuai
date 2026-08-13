# 综合AI模型服务商选型研究报告：火山方舟、阿里云百炼、腾讯云 TokenHub

**研究日期**：2026-08-12
**研究背景**：智枢AI SaaS 需在火山方舟、阿里云百炼、腾讯云 TokenHub 三家综合大模型服务商中，以"质量优先"原则选择两家作为主力供应商。本报告将三家各自接入的第三方模型生态一并纳入评估，而非仅比较自研模型。

---

## 执行摘要

以"质量优先 + 第三方模型一并计入"的视角重新评估后，结论维持为**选火山方舟 + 阿里云百炼**，但理由已发生根本性修正：上一轮认为"TokenHub 价值只在便宜"的认知被官方文档推翻——TokenHub 实为三家之中**第三方聚合覆盖最全**的平台（Kimi K3、可灵 V3、MiniMax 视频/语音/音乐全家桶均在其列）。真正让 TokenHub 出局的，不是"模型差"，而是它**缺乏平台独占的自研能力天花板**，且其独家第三方模型（Kimi K3、MiniMax 系列）在另外两家或已接入、或可通过原厂直连替代。而火山方舟与百炼分别拥有"多模态自研第一梯队"和"文本+智能体自研第一梯队"的独占优势，且双方第三方覆盖高度互补，组合后每个场景都有自研天花板 + 第三方补充的双保险。

---

## 一、三家平台第三方接入全景（2026年8月时点）

### 1. 火山方舟（火山引擎）

**自研能力**：豆包/Seed 系列文本、Seedance 2.5 视频（30 秒原生生成、50 素材参考、音画联合）、Seedream 5.0 图像、Doubao-Seed-Audio 1.0 + 声音复刻 2.0 语音。

**第三方接入**：以文本为主，集中在 Coding Plan 订阅中。2026 年 5 月 18 日上架 DeepSeek-V4-Flash/Pro，6 月 17 日新增 GLM-5.2、Kimi-K2.7-Code，7 月扩展至 GLM-5.2、Kimi-K2.7、MiniMax-M3、DeepSeek-V4 系列、Doubao-Seed-2.0 系列。**未接入第三方视频/图像/语音模型**，多模态完全依赖自研。

**定价特征**：40 元/月 Lite、200 元/月 Pro 双档位；差异化抵扣系数（豆包/Qwen 为 1，DeepSeek 为 2，MiniMax/Kimi/GLM 为 5），通过定价倾斜引导流量至自家生态。2026 年 4 月曾因算力承压出现 429 错误、首字延迟超 1 分钟、5 小时限额触发频繁等投诉。

### 2. 阿里云百炼

**自研能力**：Qwen3.8-Max 文本旗舰（SuperCLUE 2026 年 7 月榜单第一）、Qwen3.7-Plus 混合智能体（GUI 操控实测 11 小时独立开发，国产独一档）、Wan3.0 视频（2026 年 8 月公测，原生 30 秒视频生成）、qwen-image 图像。

**第三方接入**：2026 年 5 月 20 日阿里云峰会宣布"百炼全面开放"，定位"AI 时代最开放的云"，首批接入智谱 GLM-5.1、MiniMax M2.7、月之暗面 Kimi K2.6、PixVerse-v6、可灵 Kling-v3-omni、Vidu Q3-Pro、Tripo-H3.1、阶跃星辰 mimo-v2.5-pro，共十余家头部厂商，并通过千问云官网对外售卖。2026 年 7 月模型广场已覆盖 deepseek-v4-pro/flash、kimi-k2.7-code、glm-5.2、MiniMax-M2.7、mimo-v2.5-pro。**Kimi K3（2026 年 7 月 17 日发布）已同步上架百炼**，与月之暗面官方同价。

**定价特征**：Coding Plan 整合千问、GLM、Kimi、MiniMax 顶级模型；Lite 套餐已于 2026 年 3 月 20 日停售，聚焦 Pro 档（200 元/月）。

### 3. 腾讯云 TokenHub

**自研能力**：混元 Hy3 文本（竞争力排名约第 6，落后豆包、通义、DeepSeek、智谱、百度）、Hy-Image-3.0 图像、HY-Video-1.5 视频、HY-3D 3D 生成、Hy-ASR 语音识别。

**第三方接入**：三家之中覆盖最全（2026 年 8 月 12 日官方模型列表）：
- 文本：DeepSeek-V4-Flash/Pro（**标注原厂直供**）、GLM-5.2/5.1/5、**Kimi K3**/K2.7-Code/K2.6/K2.5、MiniMax-M3/M2.7、Qwen3.5-Flash/Plus、MiMo-V2.5-Pro
- 视频：**MiniMax-Video-H3**/v2.3、可灵 Kling-Video-V3/omni/turbo/V2.6/O1、Vidu-Video-q3.0-pro/q2 系列、PixVerse-v6.0/v5.6/c1、YT 系列
- 图像：Vidu-Image-q2、Hy-Image-3.0
- 语音：**MiniMax-Speech-2.8**/2.6/02 系列、MiniMax-Music-v2.6、**MiniMax-Voice-Clone**（音色复刻）、MiniMax-Voice-Design、WAND-Dubbing-Clone 配音克隆、WAND-ASR
- 3D：HY-3D-3.0/3.1；多模态：YT-VITA、HY-Vision；向量：Kinfra 系列

**定价特征**：TokenPlan 订阅制（个人版约 28 元/月起），一次订阅可切换 MiniMax-M2.7、Kimi-K2.5/2.6、GLM-5/5.1/5.2 等。2026 年 3 月全面上新，属于后发跟随策略。

---

## 二、关键差异分析

### 差异 1：第三方模型的"最新时效性"

Kimi K3（2026 年 7 月 17 日发布，2.8 万亿参数、100 万 token 上下文、全球最大开放权重模型之一）发布后：百炼与 TokenHub 均第一时间上架，火山方舟仍停留在 Kimi-K2.7。在新旗舰跟进速度上，百炼与 TokenHub 领先，火山方舟偏慢——但火山方舟的 DeepSeek-V4、GLM-5.2、MiniMax-M3 跟进速度尚可。

### 差异 2：多模态第三方覆盖

这是三家的最大分野。TokenHub 是唯一一个"视频全家桶 + 语音全家桶"平台：可灵 V3、MiniMax-H3、Vidu、PixVerse 四家视频模型齐备，MiniMax 语音/音乐/音色复刻全套在列。百炼次之（可灵 + Vidu + PixVerse 视频，缺 MiniMax 视频与语音）。火山方舟第三方多模态基本空白，完全依赖自研 Seedance/Seedream/Seed-Audio。

### 差异 3：自研天花板与不可替代性

| 维度 | 火山方舟 | 百炼 | TokenHub |
|------|---------|------|----------|
| 文本 | 豆包（TOP 3 之外） | **Qwen3.8-Max 第 1** | 混元（第 6） |
| 智能体/Agent | 一般 | **Qwen3.7-Plus 国产独一档** | 无亮点 |
| 视频 | **Seedance 2.5 第一梯队** | Wan3.0（8 月公测） | 混元视频（第三梯队） |
| 语音 | **Seed-Audio + 声音复刻 2.0 国产最强** | 一般 | 靠第三方 MiniMax |
| 图像 | **Seedream 5.0 第一梯队** | qwen-image | 混元/Vidu 图像 |

百炼的 Qwen3.7-Plus 混合智能体（GUI 操控）与火山的 Seed-Audio/声音复刻 2.0，是两家最不可替代的独占能力；TokenHub 的混元在所有模态均无第一梯队自研，其价值全部依赖第三方聚合。

---

## 三、组合推演

### 组合 A：火山方舟 + 阿里云百炼（推荐）

- **文本**：Qwen3.8-Max（第一）+ DeepSeek-V4 + GLM-5.2 + Kimi K3 + MiniMax-M2.7 = 最强文本阵容
- **智能体**：Qwen3.7-Plus 混合智能体（国产第一）
- **视频**：Seedance 2.5 + Wan3.0 + 可灵 V3 + Vidu Q3 + PixVerse v6 = 双自研 + 三家第三方
- **语音**：Seed-Audio + 声音复刻 2.0（国产最强）
- **图像**：Seedream 5.0 + qwen-image + 可灵/Vidu 图像
- **短板**：缺 MiniMax-H3 视频与 MiniMax 语音/音乐（可直连 MiniMax 原厂补足）

### 组合 B：火山方舟 + TokenHub

- **文本**：豆包 + DeepSeek-V4 + GLM-5.2 + Kimi K3 + MiniMax-M3 + Qwen3.5 = 覆盖最全，但**无 Qwen3.8-Max 文本天花板**
- **智能体**：弱（缺 Qwen3.7-Plus）
- **视频**：Seedance 2.5 + MiniMax-H3 + 可灵 V3 + Vidu + PixVerse + 混元 = 最全视频阵容
- **语音**：Seed-Audio + MiniMax-Speech 2.8 + Voice-Clone + WAND = 最强语音阵容
- **短板**：文本与智能体无天花板能力

### 组合 C：百炼 + TokenHub

- **文本**：Qwen3.8-Max + DeepSeek-V4 + GLM-5.2 + Kimi K3 + MiniMax-M3 = 最强文本阵容
- **智能体**：Qwen3.7-Plus（第一）
- **视频**：Wan3.0 + MiniMax-H3 + 可灵 V3 + Vidu + PixVerse = 最全视频阵容
- **语音**：MiniMax-Speech 2.8 + Voice-Clone + WAND（强，但缺 Seed-Audio）
- **图像**：Vidu-Image + qwen-image（缺 Seedream 5.0）
- **短板**：缺火山多模态自研三件套（Seedance/Seedream/Seed-Audio）

---

## 四、结论

**质量优先 + 第三方计入 → 选火山方舟 + 阿里云百炼。**

核心逻辑有三层：

第一，**平台独占的天花板能力才是质量的关键，第三方模型谁都能调**。百炼的 Qwen3.8-Max 文本第一与 Qwen3.7-Plus 混合智能体、火山的 Seedance 2.5 / Seedream 5.0 / Seed-Audio 多模态第一梯队，都是任何第三方模型无法替代的独占优势。TokenHub 的全部价值来自第三方聚合，而第三方模型在百炼/火山上同样能调到（Kimi K3 百炼已上架，DeepSeek-V4、GLM-5.2、MiniMax 两家都有）。

第二，**两家第三方覆盖互补且冗余**。百炼全面开放战略（可灵/Vidu/PixVerse/GLM/Kimi/MiniMax/DeepSeek 文本+视频）与火山 Coding Plan（DeepSeek-V4/GLM-5.2/Kimi-K2.7/MiniMax-M3 文本）合流后，文本第三方全覆盖、视频第三方双覆盖，单一供应商风险对冲。

第三，**TokenHub 出局不等于"差"**。它的第三方聚合（尤其 MiniMax 语音全家桶、MiniMax-H3 视频、Kimi K3 原厂直供）在三家中最全，是"锦上添花"型的优秀平台；但它缺乏自研天花板，且其独家第三方均可通过直连原厂或百炼获得，作为第二家会与火山形成"第三方重复、自研缺位"的浪费结构。

### 什么情况下应改为选 TokenHub

若智枢AI 后续出现以下任一情形，组合 B（火山 + TokenHub）值得重估：视频/语音/音乐创作工坊权重超过文本与智能体，需要"一个 Key 调用 MiniMax 视频+语音+音乐+音色复刻全家桶"且不愿与 MiniMax 原厂单独签；或与腾讯云生态深度绑定（当前部署于腾讯云 CVM，内网互通与统一计费有便利性）成为硬约束。在这些前提下，TokenHub 的多模态第三方聚合价值会超过百炼的文本/智能体优势。

---

## 五、对智枢AI 的落地建议

1. **百炼保留为主力文本 + 智能体通道**：Qwen3.8-Max 承载 AI 聊天、智能客服文本内核；Qwen3.7-Plus 承载 Agent/工作流场景；Kimi K3 可作为长文档/深度推理补充。
2. **新增火山方舟作为多模态通道**：Seedance 2.5（AI 创作工坊视频）、Seedream 5.0（图像创作）、Doubao-Seed-Audio 1.0 + 声音复刻 2.0（现有 voice-clone 功能升级）。
3. **TokenHub 保留为第三方补充通道（第三供应商）**：其订阅制套餐可作为价格敏感客户跑低质量文本量的成本方案，以及 MiniMax 语音/视频全家桶的按需入口，但不当质量主力。
4. **基础设施无需改动**：`ApiProvider` + `ApiUsageLog` 计费基建支持多 provider 登记，火山方舟新增一个 provider 即可接入。
5. **风险提示**：火山方舟 2026 年 4 月出现过算力承压（429、首字延迟超 1 分钟）的公开投诉，接入时需关注其并发配额与限额策略，质量优先场景下建议保留百炼作为文本主通道以分散风险。

---

## 参考来源

1. [腾讯云 TokenHub 模型列表（官方文档，2026-08-12）](https://cloud.tencent.com/document/product/1823/130051)
2. [阿里云百炼平台全面开放，接入十余家头部AI厂商前沿模型（ZOL）](https://ai.zol.com.cn/1184/11844213.html)
3. [阿里云百炼平台将接入智谱 GLM-5.1、MiniMax M2.7 等第三方模型（同花顺）](https://stock.10jqka.com.cn/hks/20260520/c676839917.shtml)
4. [阿里云百炼支持哪些 AI 模型（码笔记，2026-07-08）](https://www.mabiji.com/aliyunbailian/aimoxing.html)
5. [阿里云百炼全链路模型服务应用构建（官方文档）](https://docs.aliyun.com/zh/model-studio/)
6. [火山方舟 Coding Plan：DeepSeek-V4 系列加入（2026-05-22）](https://www.cnblogs.com/youring2/p/20113129)
7. [2026年7月国内主流 Coding Plan 对比（CSDN，2026-07-08）](https://blog.csdn.net/zhangay1998/article/details/162555439)
8. ["模型超市"越开越多：字节、阿里、腾讯竞相整合（蓝鲸财经，2026-04-24）](https://baijiahao.baidu.com/s?id=1863325754258983397&wfr=spider&for=pc)
9. [Kimi K3 百度百科（2026-07-17 发布）](https://baike.baidu.com/item/Kimi%20K3/67522238)
10. [5大主流平台 Kimi K3 实测（含阿里云百炼上架，2026-08）](https://www.cnblogs.com/vibecodinghuanzhe/p/22396404)
11. [火山方舟功能发布公告（官方文档，2026-07-24）](https://www.volcengine.com/docs/82379/2477433?lang=zh)
12. [云厂商大模型推理平台对比选型 2026 版（SegmentFault，2026-07-06）](https://segmentfault.com/a/1190000047979049)
13. [2026 年 8 月大模型性能全景：Claude 登顶文本、Kimi 称霸编码（知乎）](https://zhuanlan.zhihu.com/p/2068902612842328752)
14. [火山方舟上线视频生成模型 Seedance 2.0 mini（ZOL，2026-06-16）](https://ai.zol.com.cn/1200/12000573.html)
