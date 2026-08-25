# 智枢AI 每日安全审计报告

**审计日期**：2026-08-25（第 19 次）
**审计范围**：desktop-ui/（原 web/）、server/ 依赖漏洞 + 全仓硬编码凭据扫描
**执行方式**：npm audit + 静态凭据模式扫描

---

## 一、npm audit 漏洞清单

### 1.1 desktop-ui/（11 HIGH，CRITICAL 0，与 08-24 一致）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `next` 本体（直接依赖） | HIGH | 20+ 公告（最高 CVSS 8.6 SSRF GHSA-p9j2-gv94-2wf4，另含 DoS / XSS / Cache Poisoning） | 升级 next@**16.3.2**（破坏性，需回归测试） |
| `postcss`（next 内置 + 顶层） | HIGH | 路径遍历 .map 文件泄露 GHSA-r28c-9q8g-f849（CVSS 7.5）、任意文件读取 GHSA-6g55-p6wh-862q | 随 next@16.3.2 |
| `glob`（经 eslint-config-next） | HIGH | CLI 命令注入 GHSA-5j98-mcp5-4vw2（CWE-78，CVSS 7.5） | 升级 eslint-config-next@**16.3.2**（破坏性） |
| `eslint-config-next`（含 @next/eslint-plugin-next） | HIGH | 依赖 glob 命令注入链 | 升级 16.3.2（破坏性） |
| `xlsx`（SheetJS，直接依赖） | HIGH | 原型污染 GHSA-4r6h-8v6p-xvw6（CVSS 7.8）+ ReDoS GHSA-5pgg-2g8v-p4x9 | **无修复版本（NO FIX），需替换依赖** |
| `js-yaml` | HIGH | `!!omap` 解析二次复杂度 DoS CVE-2026-59870（GHSA-5p4m-2wfm-xmqj，CWE-407） | `npm audit fix`（非破坏性） |
| `nanoid` | HIGH | 自定义生成器 size=0 无限循环 GHSA-2v37-7h3g-55p8（CWE-835） | `npm audit fix`（非破坏性） |
| `minimatch` | HIGH | ReDoS ×3（GHSA-3ppc-4f35-3m26 / GHSA-7r86-cg39-jmmj / GHSA-23c5-xmqv-rm74） | `npm audit fix`（非破坏性） |
| `@typescript-eslint/parser` / `typescript-estree` | HIGH | 经 minimatch ReDoS 链 | `npm audit fix`（非破坏性） |

### 1.2 server/（2 HIGH + 2 MODERATE，CRITICAL 0，与 08-24 一致）

| 漏洞包 | 严重性 | 说明 | 修复方式 |
|--------|--------|------|----------|
| `image-size`（经 pptxgenjs） | HIGH | ICNS/JXL/HEIF 解析无限循环 DoS ×2（GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq，CWE-835，CVSS 7.5） | 升级 pptxgenjs@1.1.5（破坏性） |
| `pptxgenjs`（直接依赖） | HIGH | 依赖 image-size 漏洞链 | 升级 1.1.5（破坏性，需回归 PPT 生成） |
| `uuid`（exceljs 内置） | MODERATE | v3/v5/v6 缓冲区边界缺失 GHSA-w5hq-g745-h8pq（CWE-787） | 升级 exceljs@3.4.0（破坏性） |
| `exceljs`（直接依赖） | MODERATE | 依赖 uuid 漏洞链 | 升级 3.4.0（破坏性，需回归 Excel 生成） |

### 1.3 汇总

| 目录 | CRITICAL | HIGH | MODERATE | 趋势 |
|------|----------|------|----------|------|
| desktop-ui/ | 0 | 11 | 0 | 与 08-24 一致（CRITICAL=0 连续 19 天） |
| server/ | 0 | 2 | 2 | 与 08-24 一致 |

**合计：13 HIGH / 0 CRITICAL，连续第 17 个审计日无新增高危漏洞。**

**8 月 24 日至 25 日期间无新披露的影响本依赖树的 npm 高危公告，漏洞清单与修复建议与 08-24 完全一致。**

---

## 二、硬编码凭据检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `deploy/deploy.sh` | ✅ 通过 | 从 .env 提取 DATABASE_URL，无硬编码 |
| `server/.env.example` | ✅ 通过 | ENCRYPTION_KEY / API_KEY_ENCRYPTION_KEY 已登记（无默认值） |
| `ai-client.ts:256` | ✅ **已修复（2026-08-25）** | 硬编码回退已移除，改为缺失即抛错 + 32 字节长度校验 |
| `user-api-key.service.ts:15` | ✅ **已修复（2026-08-25）** | 同上，同一默认密钥回退已移除 |
| `admin-api-providers.ts` | ✅ **已修复（2026-08-25）** | API_KEY_ENCRYPTION_KEY 缺失即抛错，不再随机密钥回退 |

**结论**：硬编码凭据已清零。P0 密钥管理问题已于 2026-08-25 修复并部署生产：生产 `.env` 已轮换为随机强密钥（ENCRYPTION_KEY + API_KEY_ENCRYPTION_KEY，各 32 字节），生产库 ApiKey/ApiProvider 表为 0 行（无存量密文，轮换无影响），加解密往返验证通过。

---

## 三、修复建议

npm 依赖层面 CRITICAL 已连续 19 天为 0，**P0 密钥管理问题已于 2026-08-25 修复**（fail-fast + 密钥轮换 + 生产部署验证，详见上文）。

### P1 — 依赖修复（可自动执行）

| 动作 | 命令 | 风险 |
|------|------|------|
| 非破坏性修复 | `cd desktop-ui && npm audit fix` | js-yaml/minimatch/nanoid/@typescript-eslint 直接消解 |
| 破坏性升级 | 升级 next + eslint-config-next 至 **16.3.2** | 需回归测试，消解 next 20+ HIGH 公告 |
| 替换 xlsx | 迁移至 exceljs（server 已用） | 表格导出功能需适配 |

### P2 — server 依赖

升级 `pptxgenjs@1.1.5`、`exceljs@3.4.0`（均破坏性，需回归 PPT/Excel 生成）。

### 监控盲区（multer，连续第 20 天）

`multer` 仍为 `^1.4.5-lts.1`，受 CVE-2026-2359（修复 2.1.0+）与 CVE-2026-5079（修复 2.2.0+/3.0.0-alpha.2）影响，npm audit 不识别。升级需改动文件上传代码（API 兼容性有破坏变更）。

---

## 四、结论

依赖供应链平稳（CRITICAL=0 连续 19 天，HIGH 数量与上次审计一致），8 月 24 日至 25 日无新增高危漏洞。**P0 密钥管理 CRITICAL（默认密钥回退使加密形同虚设）已于 2026-08-25 修复并部署生产**：源码 fail-fast、生产密钥轮换为随机 32 字节、加解密往返验证通过。剩余风险为 P1/P2 依赖升级与 multer 监控盲区，均非阻塞项。

---
*本报告由每日自动安全审计生成，仅供参考。*
