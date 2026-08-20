# 依赖安全检查报告 — 2026-08-19

**检查日期**: 2026-08-19
**检查对象**: `desktop-ui/`（原 `web/`）+ `server/` 两个目录的 npm 依赖
**检查命令**: `npm audit --json`
**结论**: 13 HIGH / 0 CRITICAL，与昨日（08-17）完全一致，连续第 11 天无新增高危漏洞

---

## 一、漏洞总览

| 目录 | CRITICAL | HIGH | MODERATE | 备注 |
|------|----------|------|----------|------|
| desktop-ui/（原 web/） | 0 | 11 | 0 | 与昨日一致 |
| server/ | 0 | 2 | 2 | 与昨日一致 |
| **合计** | **0** | **13** | **2** | **较昨日无新增** |

8 月 17 日至 19 日（两日合并）无新披露的 npm 高危公告波及本项目依赖。

---

## 二、desktop-ui/ 高危漏洞明细（11 HIGH）

| 漏洞包 | 受影响版本 | 问题摘要 | CVSS | CVE | 修复建议 |
|--------|-----------|---------|------|-----|---------|
| next | 9.3.4-canary.0 - 16.3.0-preview.10 | 20 条 advisory（SSRF/缓存投毒/DoS/XSS/请求走私等），最高为 WebSocket 升级场景 SSRF | 8.6 | GHSA-c4j6-fc7j-m34r 等 20 条 | 升级 next → 16.3.1（major 升级） |
| postcss | <=8.5.22 | XSS 转义缺失 + 任意文件读取（sourceMappingURL，4 条 advisory） | 7.5 | GHSA-qx2v-qp2m-jg93 等 4 条 | 随 next 16.3.1 修复 |
| js-yaml | 3.0.0-3.15.0 / 4.0.0-4.3.0 | !!omap 解析二次方 CPU 消耗（DoS） | 7.5 | CVE-2026-59870 | `npm audit fix` 可自动修复 |
| nanoid | <3.3.18 | 自定义生成器 size=0 时无限循环（DoS） | 5.9 | GHSA-2v37-7h3g-55p8 | `npm audit fix` 可自动修复 |
| minimatch | 9.0.0-9.0.6 | ReDoS（3 条：通配符回溯 / GLOBSTAR / 嵌套 extglob） | 7.5 | GHSA-23c5-xmqv-rm74 等 3 条 | `npm audit fix` 可自动修复 |
| glob | 10.2.0-10.4.5 | CLI `-c/--cmd` 命令注入（shell:true 执行匹配结果） | 7.5 | GHSA-5j98-mcp5-4vw2 | 随 eslint-config-next 16.3.1 修复 |
| @typescript-eslint/parser | 6.16.0-7.5.0 | 类型检查器漏洞链 | - | - | `npm audit fix` 可自动修复 |
| @typescript-eslint/typescript-estree | 6.16.0-7.5.0 | 同上（parser 依赖） | - | - | `npm audit fix` 可自动修复 |
| eslint-config-next | 14.0.5-canary.0 - 15.0.0-rc.1 | 依赖链聚合（glob/@next/eslint-plugin-next） | - | - | 升级 eslint-config-next → 16.3.1 |
| @next/eslint-plugin-next | 14.0.5-canary.0 - 15.0.0-rc.1 | 依赖链聚合 | - | - | 随 eslint-config-next 16.3.1 修复 |
| xlsx | *（所有版本） | Prototype Pollution + ReDoS | 7.8 | GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9 | **无官方修复**（NO FIX），需替换为 exceljs 等替代库 |

> 注：上述 11 个包按影响分组，实际对应 6 个独立根因（next、postcss、js-yaml、nanoid、minimatch/glob、xlsx），与昨日一致。

---

## 三、server/ 高危漏洞明细（2 HIGH + 2 MODERATE）

| 漏洞包 | 受影响版本 | 问题摘要 | CVSS | CVE | 修复建议 |
|--------|-----------|---------|------|-----|---------|
| image-size | * | ICNS/JXL/HEIF 解析器无限循环 DoS（2 条） | 7.5 | GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq | 升级 pptxgenjs → 1.1.5（major） |
| pptxgenjs | 1.1.5-1 / >=1.1.6 | 传递依赖 image-size 的漏洞载体 | - | - | 升级 pptxgenjs → 1.1.5（major） |
| exceljs | - | 依赖链聚合（见 uuid） | - | - | 升级 exceljs → 3.4.0（major） |
| uuid | - | v3/v5/v6 传入 buf 时缺失缓冲区边界检查 | moderate | - | 随 exceljs 3.4.0 修复 |

---

## 四、修复优先级建议

- **P0（建议尽快处理，均为 major 升级需兼容性测试）**: `multer` 盲区持续监控（第 14 天，CVE-2026-2359 2.1.0+ / CVE-2026-5079 2.2.0+，当前仍为 ^1.4.5-lts.1）；server 端 `image-size`（pptxgenjs → 1.1.5）
- **P1**: `next` → 16.3.1（连带修复 postcss、eslint-config-next、glob、@next/eslint-plugin-next）
- **P2**: `npm audit fix`（desktop-ui/）自动修复 nanoid、js-yaml、minimatch、@typescript-eslint/*（均为 minor/patch 级，风险低）
- **P3**: `xlsx` 无官方修复，评估替换为 exceljs（注意 exceljs 自身需同步升级至 3.4.0 以修复 uuid 漏洞）
- **P4**: server 端 `exceljs` → 3.4.0

## 五、供应链风险监控

TeamPcp/Shai-Hulud 蠕虫投毒事件持续（868 包 / 1381 版本受影响），本仓库 lockfile 经核查未引入受影响包，继续保持监控。

---

*本报告由每日自动化安全巡检生成，数据来源 `npm audit`（当日 npm registry advisory 数据）。*
