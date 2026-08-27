# 智枢AI 每日安全审计报告

**审计日期**：2026-08-27（第 18 个审计日）
**审计范围**：desktop-ui/（原 web/）、server/ 依赖漏洞 + 全仓硬编码凭据扫描
**执行方式**：npm audit + 静态凭据模式扫描

---

## 一、npm audit 漏洞清单

### 1.1 desktop-ui/（5 HIGH，CRITICAL 0，较 08-25 的 11 HIGH 显著下降）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `next`（直接依赖，^14.2.35） | HIGH | 20+ 公告（最高 CVSS 8.6 SSRF GHSA-p9j2-gv94-2wf4，另含 DoS / XSS / 缓存投毒 / 中间件绕过等） | 升级 next@**16.3.3**（破坏性，需回归测试） |
| `postcss`（经 next 传递） | HIGH | 路径遍历 .map 文件泄露 GHSA-r28c-9q8g-f849（CVSS 7.5）、任意文件读取 GHSA-6g55-p6wh-862q | 随 next@16.3.3 |
| `glob`（经 eslint-config-next） | HIGH | CLI 命令注入 GHSA-5j98-mcp5-4vw2（CWE-78，CVSS 7.5） | 升级 eslint-config-next@**16.3.3**（破坏性） |
| `eslint-config-next`（含 @next/eslint-plugin-next，直接依赖） | HIGH | 依赖 glob 命令注入链 | 升级 16.3.3（破坏性） |

> 已消解（08-25 存在）：`xlsx`（已从依赖中移除，原型污染 + ReDoS）、`js-yaml`、`nanoid`、`minimatch`、`@typescript-eslint/parser + typescript-estree`（均不再出现在漏洞列表）。

### 1.2 server/（2 HIGH，CRITICAL 0，较 08-25 的 2 HIGH + 2 moderate 下降）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `image-size`（经 pptxgenjs） | HIGH | ICNS/JXL/HEIF 解析无限循环 DoS ×2（GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq，CWE-835，CVSS 7.5） | 升级 pptxgenjs（当前 ^4.0.1） |
| `pptxgenjs`（直接依赖，^4.0.1） | HIGH | 依赖 image-size 漏洞链 | npm audit 建议降级至 1.1.5，需人工评估实际修复版本 |

> 已消解（08-25 存在）：`exceljs` 已升级至 **^4.4.0**，其内置 `uuid` 漏洞（GHSA-w5hq-g745-h8pq）随之消除。

### 1.3 汇总与趋势

| 目录 | CRITICAL | HIGH | MODERATE | 08-25 对比 |
|------|----------|------|----------|-----------|
| desktop-ui/ | 0 | 5 | 0 | 11 HIGH → **5 HIGH**（-6） |
| server/ | 0 | 2 | 0 | 2 HIGH + 2 mod → **2 HIGH**（-2） |

**合计：7 HIGH / 0 CRITICAL，较 08-25 的 13 HIGH 减少 6 个。CRITICAL=0 连续 21 天。**

**修复建议版本更新**：npm 官方于 8 月 26 日前后发布 next/eslint-config-next **16.3.3**（08-25 时修复建议为 16.3.2）。

---

## 二、硬编码凭据检查 — 已全部修复

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `ai-client.ts:256-263` | ✅ **已修复** | `ENCRYPTION_KEY` 缺失即抛错拒绝启动，并校验 32 字节长度，默认密钥回退已移除 |
| `user-api-key.service.ts:14-21` | ✅ **已修复** | 同上，fail-fast + 32 字节校验 |
| `admin-api-providers.ts:8-13` | ✅ **已修复** | `API_KEY_ENCRYPTION_KEY` 缺失即拒绝启动，密钥经 sha256 派生 |
| `deploy/deploy.sh` / `server/.env.example` | ✅ 通过 | 无硬编码 |

**结论：连续 13 天的 P0 硬编码凭据 CRITICAL 已于 08-26/27 修复，密钥管理全面 fail-fast。**

---

## 三、监控盲区状态 — 已消除

| 盲区项 | 状态 |
|--------|------|
| `multer`（CVE-2026-2359 + CVE-2026-5079） | ✅ **已消除**：`^1.4.5-lts.1` → `^2.2.0`（连续 22 天的盲区解除） |

---

## 四、修复建议

npm 依赖层面 CRITICAL 已连续 21 天为 0，且今日 P0/P1 多项修复落地，风险显著下降。

### P1 — desktop-ui 依赖升级（需回归测试）
| 动作 | 风险 |
|------|------|
| 升级 next + eslint-config-next 至 **16.3.3**（修复 4 个 HIGH 漏洞包） | 破坏性变更（14.x → 16.x），需回归核心页面与构建 |

### P2 — server 依赖
| 动作 | 说明 |
|------|------|
| 升级 pptxgenjs 至安全版本 | 当前 ^4.0.1 经 image-size 存在 DoS 漏洞；npm audit 建议降至 1.1.5 需人工评估（可能存在版本倒挂），建议检查 image-size 是否有独立修复版本并升级传递依赖 |

### 建议持续项
- 保持每日 audit 监控（当前 7 HIGH 全部集中于 next 系列与 pptxgenjs，修复路径清晰）
- 升级前执行 `npm run build` 与 scripts/verify-login.sh 回归验证

---

## 五、结论

本次审计（08-27）为近期**最大改善节点**：高危漏洞由 13 个降至 7 个（-46%），P0 硬编码凭据 CRITICAL 修复、multer 盲区消除、xlsx 依赖移除、exceljs 升级 4.4.0 全部落地。剩余 7 个 HIGH 全部集中于 next 系列（4 个，修复版 16.3.3）与 pptxgenjs/image-size（2 个），修复路径清晰，CRITICAL=0 已连续 21 天。建议优先安排 next 16.3.3 的升级回归测试。

---
*本报告由每日自动安全审计生成，仅供参考。*
