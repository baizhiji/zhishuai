# 智枢AI 每日安全审计报告 — 2026-08-17（第 12 次）

## 一、npm audit 依赖漏洞

**CRITICAL 漏洞：0 个**（连续第 12 天清零）。与 08-16 相比无新增无减少。

> 结构变更说明：原 `web/`（Next.js 前端）已于 08-16 重命名为 `desktop-ui/`（提交 998fef6「web重命名为desktop-ui并全链路同步, 下线在线网页版」）。本次审计在 `desktop-ui/` 目录执行，依赖清单与原 `web/` 完全一致，无新增漏洞。

**server/ 目录（2 HIGH / 2 MODERATE）**

| 包 | 级别 | 问题 | 修复 |
|----|------|------|------|
| image-size（→pptxgenjs） | HIGH | ICNS/JXL/HEIF 解析死循环 DoS（CVSS 7.5） | 升级 pptxgenjs 至 1.1.5 |
| pptxgenjs | HIGH | 同上 | 同上 |
| exceljs（→uuid） | MODERATE | uuid 越界写 | 升级 exceljs 至 3.4.0 |
| uuid（内嵌） | MODERATE | 同上 | 同上 |

**desktop-ui/ 目录（原 web/，11 HIGH）**

| 包 | 级别 | 修复 |
|----|------|------|
| next（直接依赖，14.2.35） | HIGH（20+ 公告：RSC DoS、SSRF、图片优化 DoS 等） | 升级 15.5.21+ 或 16.3.1 |
| postcss（直接依赖） | HIGH（sourceMappingURL 路径遍历） | 随 next 升级 |
| xlsx（直接依赖） | HIGH（原型污染+ReDoS） | 无官方修复，需迁移 |
| glob / js-yaml / minimatch / nanoid / @typescript-eslint 系列 | HIGH（传递依赖） | npm audit fix |

> 生产运行时重点盯 **next + postcss**；xlsx 需规划迁移。

## 二、硬编码凭据检查

**❌ CRITICAL 仍未修复（连续第 4 天）**
- `server/src/services/ai-client.ts:208` 与 `server/src/services/user-api-key.service.ts:15` 仍存在 `process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!'` 硬编码回退。环境变量缺失时静默使用公开密钥加密用户第三方 API Key，可被直接解密。**连续 4 天标记，涉及密钥轮换与数据重加密，需人工确认后执行。**

**✅ 已修复（复查确认）**
- `deploy/deploy.sh`：从 .env 提取 DATABASE_URL，无硬编码凭据（08-16 修复，今日复查保持有效）。
- `.env.example`：已补登 `ENCRYPTION_KEY`、`API_KEY_ENCRYPTION_KEY`。

**⚠️ 观察项（无凭据泄露，属健壮性风险）**
- `server/src/routes/admin-api-providers.ts:8-10`：`API_KEY_ENCRYPTION_KEY` 缺失时回退 `crypto.randomBytes(32)`，重启后密文不可解密，建议改 fail-fast。
- `scripts/create-agent.ts`、`scripts/test-agent-api.py` 中的 `123456` 属测试脚本密码，非生产凭据。
- `apk/src/`：`@zhishuai_user_token` 为存储键名、`/account/password` 为 API 路径，均非凭据。
- 供应链盲区：`server/package.json` 中 `multer ^1.4.5-lts.1` 受 CVE-2026-2359 / CVE-2026-5079 影响（2.1.0+ 修复），但当前 npm audit 未标记，建议关注。

## 三、修复建议

| 优先级 | 事项 | 状态 |
|--------|------|------|
| **P0 立即** | 两处 ENCRYPTION_KEY 硬编码回退改 fail-fast（缺失即拒绝启动），删除默认密钥字面量 | 连续 4 天 |
| **P0 立即** | 服务器端轮换 ENCRYPTION_KEY + 一次性数据重加密迁移 | 待人工确认 |
| P1 本周 | 升级 next 至 15.5.21+（desktop-ui）；admin-api-providers 回退改 fail-fast | 待执行 |
| P2 两周内 | xlsx 迁移至 exceljs；npm audit fix 清理传递依赖；评估 multer 升级 | 待执行 |

**重点提示**：CRITICAL 依赖漏洞连续 12 天清零；硬编码凭据方面 deploy.sh 修复保持有效，剩余唯一 P0（ENCRYPTION_KEY 回退）已连续 4 天未闭环，因涉及生产密钥轮换与存量数据重加密，未自动执行。修复部署后须运行 `scripts/verify-login.sh` 交叉验证三种角色登录。
