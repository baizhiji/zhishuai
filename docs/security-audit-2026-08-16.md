# 智枢AI 每日安全审计报告 — 2026-08-16（第 11 次）

**审计范围**：web/ + server/ 依赖漏洞（npm audit）、全仓库硬编码凭据扫描
**审计结论**：npm audit CRITICAL 0 个（连续第 11 天清零）；硬编码凭据遗留 1 处 CRITICAL（连续第 3 天）

---

## 一、npm audit 依赖漏洞

**CRITICAL 漏洞：0 个**（连续第 11 天清零），与 08-13 完全一致，无新增无减少。

### server/ 目录（2 HIGH / 2 MODERATE）

| 包 | 级别 | 问题 | CVE/GHSA | 修复方式 |
|----|------|------|----------|----------|
| image-size（传递→pptxgenjs） | HIGH | ICNS/JXL/HEIF 解析器死循环 DoS（CWE-835，CVSS 7.5） | GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq | 升级 pptxgenjs 至 1.1.5（semver-major） |
| pptxgenjs | HIGH | 同上（image-size 依赖导致） | 同上 | 升级至 1.1.5 |
| exceljs（传递→uuid） | MODERATE | uuid v3/v5/v6 缺 buffer 边界检查（越界写） | GHSA-w5hq-g745-h8pq | 升级 exceljs 至 3.4.0（semver-major） |
| uuid（exceljs 内嵌） | MODERATE | 同上 | 同上 | 同上 |

### web/ 目录（11 HIGH）

| 包 | 级别 | 问题 | 修复 |
|----|------|------|------|
| next（直接依赖） | HIGH（含多条） | RSC 反序列化 DoS、SSRF（WebSocket 升级）、rewrites SSRF、i18n 中间件绕过、Server Actions DoS、图片优化 DoS 等 20+ 条公告 | 升级至 15.5.21+ 或 16.3.1 |
| postcss（直接依赖） | HIGH | sourceMappingURL 路径遍历任意 .map 文件读取（CWE-22，CVSS 7.5） | 随 next 升级 |
| xlsx（直接依赖） | HIGH | 原型污染 + ReDoS（CWE-1321/1333） | 无官方修复，需迁移 |
| glob（传递） | HIGH | CLI -c/--cmd 命令注入（CWE-78，CVSS 7.5） | 随 eslint-config-next 升级 |
| js-yaml（传递） | HIGH | !!omap 二次复杂度 CPU 消耗（CWE-407） | npm audit fix |
| minimatch（传递） | HIGH | 多处 ReDoS（CWE-1333/407） | npm audit fix |
| nanoid（传递） | HIGH | size=0 时自定义生成器死循环 | npm audit fix |
| @typescript-eslint/*（传递） | HIGH | 经 minimatch ReDoS 传导 | npm audit fix |

> 注：web/ 高危项中 next 与 postcss 为生产运行时依赖（重点），其余多为 ESLint 工具链传递依赖。xlsx 用于导出功能，需规划迁移。

---

## 二、硬编码凭据检查

### ✅ 已修复（2 项，对比上次审计）

1. **deploy/deploy.sh 硬编码 JWT_SECRET / DATABASE_URL（CRITICAL-1）→ 已修复**
   - 现强制校验 `$SERVER_DIR/.env` 存在（L51-54），DATABASE_URL 通过 `grep '^DATABASE_URL='` 从 .env 提取并校验非空（L57-61）
   - 硬编码密钥字面量已全部移除
2. **.env.example 缺 ENCRYPTION_KEY 登记 → 已修复**
   - L22 已补 `ENCRYPTION_KEY=`，L24 已补 `API_KEY_ENCRYPTION_KEY=`

### ❌ 仍未修复（1 处 CRITICAL，连续第 3 天）

**CRITICAL-2：API Key 加密密钥硬编码回退（2 个文件）**

- `server/src/services/ai-client.ts:208`
  `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!';`
- `server/src/services/user-api-key.service.ts:15`
  `const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!';`

环境变量缺失时静默回退到公开字面量密钥，任何获取到源码的人都能解密数据库中加密存储的用户第三方 API Key。**必须改 fail-fast**：缺失即抛错拒绝启动，并删除默认密钥字面量。

### 其他观察

- `admin-api-providers.ts:8-10`：`API_KEY_ENCRYPTION_KEY` 缺失时回退 `crypto.randomBytes(32)`。非公开硬编码（无泄露风险），但进程重启密钥变化会导致已加密数据无法解密 —— 属功能性风险，建议同样改 fail-fast。
- `scripts/create-agent.ts`、`scripts/test-agent-api.py` 中 `123456` 为测试脚本账号，属测试数据。
- `scripts/tmp_remote_verify.sh` 从服务器 .env 读取密钥做验证，本身不泄露，建议用完即删。
- web/ 与 apk/ 未发现真凭据（仅路由路径常量与测试 token）。

---

## 三、修复建议

| 优先级 | 事项 | 说明 |
|--------|------|------|
| **P0 立即** | 两处 ENCRYPTION_KEY 改 fail-fast | 缺失即抛错拒绝启动，删除 `'zhishuai-default-key-32chars!!'` 字面量 |
| **P0 立即** | 服务器端轮换 ENCRYPTION_KEY + 数据重加密 | 一次性迁移脚本：读旧密钥解密→新密钥重加密→更新数据库 |
| P1 本周 | 升级 next 至 15.5.21+（或 16.x） | 同时修复 postcss 与 next 全部公告；注意 next 15.5.x 与 React 18 兼容性 |
| P1 本周 | admin-api-providers 随机回退改 fail-fast | 避免重启后密文不可解 |
| P2 两周内 | xlsx 迁移至 exceljs | xlsx 已无官方修复（npm registry 版本停留在 0.18.5 以下） |
| P2 两周内 | npm audit fix 清理传递依赖 | js-yaml / minimatch / nanoid / @typescript-eslint 等工具链项 |

**重点提示**：CRITICAL-2（ENCRYPTION_KEY 硬编码回退）已连续第 3 天在报告中标记。修复涉及密钥轮换与数据重加密、需人工确认后执行，故未自动改动。修复并部署后须运行 `bash scripts/verify-login.sh` 交叉验证三种角色登录。

---

*生成时间：2026-08-16 · 自动化每日审计（第 11 次）*
