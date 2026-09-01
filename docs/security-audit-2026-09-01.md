# 智枢AI 每日安全审计报告

**审计日期**：2026-09-01（第 20 个审计日）
**审计范围**：desktop-ui/（原 web/）、server/ 依赖漏洞
**执行方式**：npm audit（JSON 输出解析，审计文件 desktop-ui/desktop-ui-audit-20260901.json 与 server/server-audit-20260901.json）

---

## 一、npm audit 漏洞清单

### 1.1 desktop-ui/（5 HIGH，CRITICAL 0，与 08-28 完全一致）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `next`（直接依赖） | HIGH | 20+ 公告（最高 CVSS 8.6 SSRF GHSA-p9j2-gv94-2wf4，另含 DoS / XSS / 缓存投毒 / 中间件绕过 / RSC 反序列化等） | 升级 next@**16.3.4**（破坏性，需回归测试） |
| `postcss`（经 next 传递） | HIGH | 路径遍历 .map 文件泄露 GHSA-r28c-9q8g-f849（CWE-22）、任意文件读取 GHSA-6g55-p6wh-862q | 随 next@16.3.4 |
| `glob`（经 eslint-config-next） | HIGH | CLI 命令注入 GHSA-5j98-mcp5-4vw2（CWE-78，CVSS 7.5） | 升级 eslint-config-next@**16.3.4**（破坏性） |
| `eslint-config-next`（含 @next/eslint-plugin-next，直接依赖） | HIGH | 依赖 glob 命令注入链 | 升级 16.3.4（破坏性） |

### 1.2 server/（2 HIGH，CRITICAL 0，与 08-28 完全一致）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `image-size`（经 pptxgenjs） | HIGH | ICNS/JXL/HEIF 解析无限循环 DoS ×2（GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq，CWE-835，CVSS 7.5） | 升级 pptxgenjs（当前 ^4.0.1） |
| `pptxgenjs`（直接依赖，^4.0.1） | HIGH | 依赖 image-size 漏洞链 | npm audit 建议降级至 1.1.5，需人工评估实际修复版本 |

### 1.3 汇总与趋势

| 目录 | CRITICAL | HIGH | MODERATE | 08-28 对比 |
|------|----------|------|----------|-----------|
| desktop-ui/ | 0 | 5 | 0 | 无变化 |
| server/ | 0 | 2 | 0 | 无变化 |

**合计：7 HIGH / 0 CRITICAL，与 08-28 完全一致。CRITICAL=0 连续 26 天，连续第 20 个审计日无新增高危漏洞。**

---

## 二、状态回顾

- **硬编码凭据**：已修复（08-27 确认 fail-fast 落地，连续 5 个审计日不再出现）
- **multer 盲区**：已消除（^1.4.5-lts.1 → ^2.2.0）
- **8 月 28 日至 9 月 1 日**：npm 未披露影响本依赖树的新高危公告，7 个 HIGH 全部为存量问题
- **唯一变化**：npm 官方发布 next / eslint-config-next **16.3.4** 修复版（08-28 时推荐 16.3.3），修复建议随之更新

---

## 三、修复建议

### P1 — desktop-ui 依赖升级（需回归测试）
| 动作 | 风险 |
|------|------|
| 升级 next + eslint-config-next 至 **16.3.4**（修复 4 个 HIGH 漏洞包） | 破坏性变更（14.x → 16.x），需回归核心页面与构建 |

### P2 — server 依赖
| 动作 | 说明 |
|------|------|
| 升级 pptxgenjs 至安全版本 | 当前 ^4.0.1 经 image-size 存在 DoS 漏洞；npm audit 建议降至 1.1.5 需人工评估（可能存在版本倒挂），建议检查 image-size 是否有独立修复版本并升级传递依赖 |

---

## 四、结论

本次审计（09-01）结果与 08-28 完全一致：**7 HIGH / 0 CRITICAL**，无新增、无改善。剩余 7 个 HIGH 全部为存量问题，集中于 next 系列（4 个，修复版已更新至 16.3.4）与 pptxgenjs/image-size（2 个）。CRITICAL=0 已连续 26 天。建议优先安排 next 16.3.4 的升级回归测试，并评估 pptxgenjs 修复路径。

---
*本报告由每日自动安全审计生成，仅供参考。*
