# 智枢AI 每日安全审计报告 — 2026-08-12

**审计范围**：web/ 与 server/ 依赖漏洞（npm audit）、硬编码凭据扫描
**审计时间**：2026-08-12
**结论**：npm 依赖无 CRITICAL 漏洞（连续第 9 天清零）；但发现 2 处 CRITICAL 级别硬编码凭据问题（部署脚本 JWT 密钥、加密密钥回退值），需尽快修复。

---

## 一、npm audit 结果

### server/（后端，2 个 HIGH，0 CRITICAL）

| 漏洞类型 | 依赖链 | 严重级别 | 说明 |
|---------|--------|---------|------|
| image-size DoS | pptxgenjs → image-size | HIGH | 通过图片尺寸解析触发拒绝服务，仅影响 pptx 导出功能 |

### web/（前端，11 个 HIGH，0 CRITICAL）

| 漏洞包 | 严重级别 | 说明 |
|--------|---------|------|
| next | HIGH | Next.js 中间件/图片优化相关漏洞（影响 14.x 部分版本） |
| postcss | HIGH | 解析器正则 ReDoS 类问题 |
| xlsx | HIGH | SheetJS 原型污染/ReDoS（已知老漏洞，仅 build 期使用需评估） |
| js-yaml | HIGH | 版本 <4 的解析器问题（传递依赖） |
| minimatch / glob | HIGH | ReDoS 问题 |
| nanoid | HIGH | 传递依赖，随机性相关修复 |
| @typescript-eslint/scope-manager 等 | HIGH | 开发期依赖，仅影响开发环境 |

**说明**：web/ 的 HIGH 漏洞大多来自传递依赖和开发期工具链，直接攻击面有限。生产运行时风险以 next 为主。

---

## 二、硬编码凭据检查结果

### CRITICAL-1：部署脚本硬编码 JWT 密钥

**位置**：`deploy/deploy.sh:42`

```bash
JWT_SECRET="zhishuai-jwt-secret-key-change-in-production"
```

**风险**：生产部署脚本内置公开的 JWT 密钥。若部署时未替换，攻击者可伪造任意用户（含 admin）的 JWT Token，直接接管系统。

**修复建议**：
1. 从 deploy.sh 中删除硬编码值，改为启动时强制校验：
   ```bash
   if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "zhishuai-jwt-secret-key-change-in-production" ]; then
     echo "ERROR: JWT_SECRET 未配置或仍为默认值，拒绝启动" >&2; exit 1
   fi
   ```
2. 在服务器上生成强随机密钥并写入受保护环境文件：`openssl rand -hex 64`
3. 轮换后旧 Token 失效，需同步通知全部已登录用户重新登录。

### CRITICAL-2：API Key 加密密钥存在硬编码回退值

**位置**：
- `server/src/services/ai-client.ts:207`
- `server/src/services/user-api-key.service.ts:15`

```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!';
```

**风险**：环境变量缺失时静默回退到公开密钥加密用户 API Key（DeepSeek/OpenAI 等第三方凭据）。攻击者用公开密钥即可解密数据库中的加密 Key。代码中不应存在任何可用的默认密钥。

**修复建议**：
1. 两处均改为 fail-fast：环境变量缺失直接抛错，禁止启动：
   ```typescript
   const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
   if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
     throw new Error('ENCRYPTION_KEY 未配置或强度不足，拒绝启动');
   }
   ```
2. 删除 `'zhishuai-default-key-32chars!!'` 字符串字面量。

### HIGH-3：本地 .env 密钥强度不足

**位置**：`server/.env`

| 变量 | 当前值 | 评估 |
|------|--------|------|
| JWT_SECRET | `415f02b4...`（64 位 hex） | 合格（随机） |
| LEGACY_JWT_SECRET | `zhishuai-secret-key-2024` | 弱（可预测），迁移完成后应移除 |
| ENCRYPTION_KEY | `zhishuai-encrypt-key-2024-32char` | 弱（可预测模式），需替换为强随机值 |

**修复建议**：用 `openssl rand -hex 32` 重新生成 ENCRYPTION_KEY；旧数据需用旧密钥解密后重新加密迁移（写一次性迁移脚本）。

### MEDIUM-4：.env.example 缺少加密密钥字段

`server/.env.example` 未登记 `ENCRYPTION_KEY` 与 `API_KEY_ENCRYPTION_KEY`，新部署者会漏配而回退到硬编码默认值。建议补录并注明强度要求（≥32 字符随机）。

### MEDIUM-5：admin-api-providers.ts 随机回退密钥

`server/src/routes/admin-api-providers.ts:8-10` 在 `API_KEY_ENCRYPTION_KEY` 缺失时回退 `crypto.randomBytes(32)`，该值在模块加载时生成，进程重启后已加密的服务商 Key 将无法解密（静默数据丢失）。建议改为 fail-fast。

### LOW-6：种子测试账号密码 123456

`server/prisma/seed.ts` 中测试账号（admin/agent/customer）密码为 `123456`，属已知测试数据，生产环境请确认已通过 `NODE_ENV=production` 跳过或替换强密码。

---

## 三、修复优先级建议

| 优先级 | 事项 | 影响 |
|--------|------|------|
| P0（立即） | deploy.sh JWT_SECRET 硬编码 | 系统接管风险 |
| P0（立即） | 两处 ENCRYPTION_KEY 硬编码回退 → fail-fast | API Key 泄露风险 |
| P1（本周） | 替换 .env 弱密钥 + 数据重加密迁移 | 长期密钥强度 |
| P1（本周） | 补录 .env.example 字段 | 部署规范性 |
| P2（两周内） | admin-api-providers 随机回退改 fail-fast | 数据可靠性 |
| P2（观察） | 升级 web/ 高危依赖（重点 next） | 运行时攻击面 |

---

## 四、免责声明

本报告由自动化安全审计生成，供内部参考。硬编码凭据修复涉及密钥轮换与数据迁移，需由具备权限的开发人员在变更窗口执行，并在部署后运行 `scripts/verify-login.sh` 交叉验证。
