# 智枢AI 每日安全审计报告 — 2026-08-13（第 10 次）

## 一、npm audit 依赖漏洞

**CRITICAL 漏洞：0 个**（连续第 10 天清零）

| 目录 | HIGH | MODERATE | CRITICAL | 说明 |
|------|------|----------|----------|------|
| server/ | 2 | 2 | 0 | image-size/pptxgenjs（DoS）、exceljs/uuid（越界写） |
| web/ | 11 | 0 | 0 | next、postcss、xlsx、js-yaml、minimatch、glob、nanoid 等 |

与昨日（08-12）完全一致，无新增无减少。

### server/ HIGH 明细（2）
| 包 | 严重级别 | 漏洞 | 修复 |
|----|---------|------|------|
| image-size ≤2.0.2 | HIGH (CVSS 7.5) | ICNS/JXL/HEIF 解析器无限循环 DoS（CWE-835，GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq） | 升级 pptxgenjs 至 1.1.5（破坏性） |
| pptxgenjs | HIGH | 传递依赖 image-size 所致 | 同上 |

server/ 无直接可利用的运行时高危面；image-size 仅被 pptxgenjs 用于生成 PPTX 时解析图片尺寸，输入可控性低。

### web/ HIGH 明细（11，按风险排序）
| 包 | 严重级别 | 漏洞类型 | 修复 |
|----|---------|---------|------|
| next（当前 <15.5.21） | HIGH | RSC 反序列化 DoS、SSRF（WebSocket/rewrites/Server Actions 多处，GHSA-955p/h25m/8h8q/q4gf、GHSA-c4j6 等） | 升级至 16.3.0（破坏性） |
| postcss ≤8.5.22 | HIGH | sourceMappingURL 路径遍历任意文件读取（GHSA-6g55、GHSA-r28c） | 升级至 ≥8.5.22（跟随 next） |
| xlsx | HIGH | 原型污染 + ReDoS（GHSA-4r6h、GHSA-5pgg），**无官方修复** | 迁移至 exceljs 或替代库 |
| js-yaml <3.15.1/4.3.1 | HIGH | !!omap 二次方 CPU 消耗 DoS（CVE-2026-59870） | npm audit fix 可修 |
| minimatch 9.0.0-9.0.6 | HIGH | 通配符 ReDoS | npm audit fix 可修 |
| glob 10.2.0-10.4.5 | HIGH | CLI -c 命令注入 | 跟随 eslint-config-next |
| nanoid <3.3.17 | HIGH | 自定义生成器 size=0 死循环 | npm audit fix 可修 |
| @typescript-eslint/* / eslint-config-next | HIGH | 传递依赖（minimatch/glob） | 升级至 16.x 或降级工具链 |

web/ 高危项多为传递依赖与开发期 ESLint 工具链，生产运行时重点仍为 **next** 与 **postcss**（next 内置 postcss），xlsx 为前端直连依赖需迁移。

## 二、硬编码凭据检查

### 未修复（与昨日相同，连续 2 天未修复）

**CRITICAL-1：部署脚本硬编码 JWT 密钥（未修复）**
- `deploy/deploy.sh:42` 仍内置 `JWT_SECRET="zhishuai-jwt-secret-key-change-in-production"`，且该脚本第 41 行还硬编码 `DATABASE_URL="postgresql://zhishuai:YourPassword@localhost:5432/zhishuai"` 占位密码。
- 若生产部署未替换，攻击者可伪造任意用户（含 admin）Token 直接接管系统；数据库占位密码一旦复用则等于明文 DB 凭据。

**CRITICAL-2：API Key 加密密钥硬编码回退（未修复）**
- `server/src/services/ai-client.ts:207` 与 `server/src/services/user-api-key.service.ts:15` 仍存在 `ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'zhishuai-default-key-32chars!!'`。
- 环境变量缺失时静默用公开密钥加密用户第三方 API Key，可被直接解密；且两处注释明确提示"生产环境应从环境变量读取"，说明已知但未改。

### 其他发现（低风险，非本轮新增）
- `.env` 中 ENCRYPTION_KEY / LEGACY_JWT_SECRET 为可预测弱密钥（昨日已报，未轮换）。
- `.env.example` 仍漏登记 ENCRYPTION_KEY 字段。
- `admin-api-providers.ts` 随机回退导致重启后数据不可解密（昨日已报）。
- 测试数据：`apk/src/services/auth.service.ts:40-41`（13800138000/123456）、`scripts/create-agent.ts:13`、`scripts/test-agent-api.py:7` 的 `123456` 均属开发测试账号，非生产凭据。
- `scripts/tmp_remote_verify.sh:3` 从服务器 .env 读取密钥调用 API（未硬编码，但建议用完即删）。
- web/ 与 apk/ 其余匹配均为 storage key 名称或 API 路径，确认误报。

## 三、修复建议（CRITICAL-1/2 与昨日相同，P0 必须本周执行）

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P0 立即 | deploy.sh JWT_SECRET/DATABASE_URL 改强制校验 | 部署时 `openssl rand -base64 48` 生成随机密钥写入 .env，脚本检测到默认值即拒绝部署 |
| P0 立即 | 两处 ENCRYPTION_KEY 改 fail-fast | 缺失即抛错拒绝启动，删除 `'zhishuai-default-key-32chars!!'` 字面量 |
| P1 本周 | 替换弱密钥 + 一次性重加密脚本 | 用新密钥对存量用户 API Key 做 encrypt(decrypt(old)) 迁移，避免重启后数据不可读 |
| P1 本周 | 升级 next 至 15.5.21+ / postcss | 解决 RSC DoS/SSRF 与路径遍历；16.3.0 为破坏性升级需回归测试 |
| P2 两周内 | xlsx 迁移至 exceljs/SheetJS CE | xlsx 无官方修复，属已知高危；admin-api-providers 随机回退改 fail-fast |

> 执行提醒：密钥轮换与数据重加密需人工确认后执行，涉及生产数据安全；任何修复部署后必须运行 `scripts/verify-login.sh` 交叉验证三种角色登录。
