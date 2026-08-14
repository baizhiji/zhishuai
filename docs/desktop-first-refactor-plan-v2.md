# 智枢AI 多端安装版改造完整方案（v2.0 · 桌面版优先）

> 文档状态：正式方案（v2.0）
> 编写日期：2026-08-14
> 关联文档：`docs/desktop-apk-install-upgrade-plan.md`（v1.0 壳方案，已被本方案取代）
> 项目仓库：github.com/baizhiji/zhishuai（Monorepo：`web/` + `server/` + `apk/` + `shared/`）

---

## 一、方案概述

### 1.1 背景

智枢AI 目前是纯 Web SaaS（Next.js 14 + Express + MySQL），部署于香港腾讯云 CVM（150.109.60.130）。为提升产品形态与交付体验，决定增加**电脑安装版（桌面客户端）**与**移动端 APK**两条新交付线。

本方案在 v1.0 壳方案（Electron 加载远程 URL）的基础上，结合对 `web/` 代码库的全面审计，升级为 **「真桌面版」优先**的完整改造方案，并同步整合 APK 端改造。

### 1.2 核心决策依据（为什么选真桌面版而非壳方案）

对 `web/` 全部 73 个页面文件审计后确认如下事实：

| 审计项 | 结果 |
|--------|------|
| `'use client'` 纯客户端页面 | 100%（73/73） |
| Server Actions（`use server`） | 0 处 |
| `getServerSideProps` / `getStaticProps` / `generateMetadata` | 0 处 |
| 动态路由段（`[param]` 目录） | 0 个 |
| 服务端数据获取 | 0 处（全部走 `web/services/` 的 19 个 API 模块） |
| 服务端专属 API 路由 | 仅 1 个：`web/app/api/ai/generate-script/route.ts` |

**结论**：智枢AI Web 端是 100% 纯 SPA + 远程 REST API，Next.js 仅扮演打包器角色。这意味着：
1. 页面可**完整静态化**（`output: 'export'`），本地渲染零业务代码改动；
2. 真桌面版与壳方案的 Web 端工作量几乎相同（都得做静态化），差异仅在 Electron 工程本身；
3. 真桌面版多花的成本换来本地渲染、离线缓存、系统通知、深度能力（文件系统/剪贴板/全局快捷键），是壳方案无法比拟的。

**决策：直接做真桌面版（Electron + 静态化 SPA 本地加载 + electron-updater 自更新）。**

### 1.3 目标形态

| 交付线 | 形态 | 渲染方式 | 数据源 |
|--------|------|----------|--------|
| Web 在线版 | 浏览器访问（现状，保持） | 服务端托管静态站 | 远程 API（不变） |
| **桌面安装版（本期重点）** | Windows 安装包（exe/msi）+ macOS（dmg） | **本地静态文件 + Electron 主进程代理** | 远程 API + 本地主进程代理 AI key |
| 移动端 APK | Android APK / AAB | React Native（Expo） | 远程 API（不变） |

---

## 二、桌面安装版改造方案（P0 重点）

### 2.1 总体架构

```
┌─────────────────────────────────────────────────┐
│                  桌面客户端 (Electron)           │
│  ┌───────────────────────────────────────────┐  │
│  │  Renderer：静态化 SPA（web/out/ 打包产物） │  │
│  │  - 全部页面复用，零业务代码改动           │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ file:// 本地加载           │
│  ┌──────────────────▼────────────────────────┐  │
│  │  Main 主进程：                            │  │
│  │  - 窗口管理 / 单实例 / 托盘               │  │
│  │  - IPC 通道（升级 / 系统能力）            │  │
│  │  - AI 代理（隐藏 key，转发远程 AI 服务）  │  │
│  │  - electron-updater 自更新                │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ HTTPS                    │
└─────────────────────┼───────────────────────────┘
                      ▼
        ┌───────────────────────────┐
        │  后端 API（现状，基本不变）│
        │  + 版本服务增强（新增字段）│
        └───────────────────────────┘
```

### 2.2 Web 端改造（4 处，约 2~3 天）

> 原则：**在线 Web 版与桌面版共用一套前端代码**，通过构建配置区分产物，不拆分支、不写两套页面。

#### 改动 1：`web/next.config.js` — 支持静态导出

| 项 | 内容 |
|----|------|
| 改动 | 增加 `output: 'export'` + `images.unoptimized: true`（静态导出不支持图片优化服务） |
| 注意 | 现有 `images.domains` 与 `headers()`/`redirects()` 在静态导出模式下会被忽略，需保留但注明"仅在线版生效" |
| 影响 | 构建产出从 `.next/` 变为 `web/out/` 纯静态目录，可直接被 Electron `file://` 加载 |
| 工作量 | 0.5 天 |

```js
// web/next.config.js 改动要点
const nextConfig = {
  // 新增：双模式构建。默认静态导出（供桌面版/静态托管），在线版由 CI 传参覆盖
  output: 'export',
  images: { ...existing, unoptimized: true },
  // 注意：headers()/redirects() 仅在线模式生效（通过 NEXT_OUTPUT=standalone 覆盖时启用）
}
```

> 说明：为避免影响现有线上部署（当前服务器用 `next build` 服务端模式），建议用环境变量切换：`output: process.env.NEXT_OUTPUT === 'standalone' ? undefined : 'export'`，CI 中在线版传 `NEXT_OUTPUT=standalone`，桌面版用默认 export。

#### 改动 2：删除 `web/middleware.ts`（登录守卫）

| 项 | 内容 |
|----|------|
| 改动 | 整个文件删除（54 行） |
| 理由 | 静态导出模式下 Next.js middleware 不生效；且前端 `web/components/auth/AuthGuard.tsx`（161 行）已完整实现角色权限控制与路由守卫，删除后功能不受影响 |
| 影响 | 无。页面级权限由 AuthGuard + 后端 authMiddleware 双层保障 |
| 工作量 | 0.5 天 |

#### 改动 3：`web/app/api/ai/generate-script/route.ts` — 服务端代理下沉

| 项 | 内容 |
|----|------|
| 现状 | 唯一服务端路由，负责持有 AI 服务密钥，转发生成脚本请求（7.1 KB） |
| 改动 | 逻辑迁移到 Electron 主进程（`desktop/src/main/aiProxy.ts`），通过 `contextBridge` 暴露 `window.ai.generateScript()`，Renderer 调用 IPC；Web 在线版保留原路由 |
| 实现 | 前端 `web/services/ai.ts` 做能力检测：`window.ai?.generateScript ? 走IPC : 走/api/ai/generate-script` |
| 安全 | 密钥只存在主进程环境变量/`safeStorage`，不进入 Renderer |
| 工作量 | 1 天 |

#### 改动 4：API baseURL 从同源改为远程绝对地址

| 项 | 内容 |
|----|------|
| 现状 | `web/utils/request.ts`：`API_BASE_URL = ''`（同源 `/api/xxx`）；`web/lib/request.ts`：`process.env.NEXT_PUBLIC_API_BASE_URL \|\| '/api'` |
| 改动 | 统一改为读取环境变量，桌面版构建时注入远程 API 绝对地址 `https://api.zhishuai.com`（生产域名），Web 在线版保持 `/api` |
| 实现 | 1) 新建 `web/utils/config.ts` 读取 `process.env.NEXT_PUBLIC_API_BASE_URL`；2) 桌面版构建脚本在 `next build` 前注入该变量；3) 顺带完成 TODO：统一两个 request 客户端（建议保留 `utils/request.ts` 的 Fetch 实现，删除 `lib/request.ts` 的 Axios 重复实现） |
| 注意 | 需全局搜索 `web/services/*.ts` 中硬编码 `/api/` 开头的路径（19 个模块），确认全部走统一 request 客户端（审计结果：是） |
| 工作量 | 0.5~1 天 |

#### 改动 5（可选优化）：`web/services/ai.ts` 能力检测

Renderer 需判断当前运行环境。建议新增 `web/utils/env.ts`：

```ts
export const isDesktop = typeof window !== 'undefined' && !!window.electronAPI;
```

在 AI 调用处做分支，其余页面代码完全不动。

### 2.3 Electron 桌面工程（`desktop/` 新目录，1.5~2 周）

#### 2.3.1 技术栈

| 项 | 选型 |
|----|------|
| 框架 | Electron 33+（Chromium 稳定版） |
| 主进程语言 | TypeScript（`electron-vite` 构建） |
| 打包 | electron-builder（NSIS 安装包 + electron-updater 增量更新） |
| UI 复用 | 100% 复用静态化 SPA，不新增前端框架 |
| 自动更新 | electron-updater（配合 2.4 版本服务，走私有 OSS/静态托管下载） |
| 安全 | `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`、CSP 收紧 |

#### 2.3.2 目录结构

```
desktop/
├── package.json                # electron-builder 配置 + 主进程依赖
├── electron-builder.yml        # 打包配置（NSIS/dmg/icon/update 源）
├── electron.vite.config.ts     # electron-vite 构建
├── src/
│   ├── main/
│   │   ├── index.ts            # 应用入口：窗口/单实例/托盘/生命周期
│   │   ├── window.ts           # BrowserWindow 创建与加载本地 out/index.html
│   │   ├── aiProxy.ts          # AI 服务代理（持有密钥，转发 generate-script）
│   │   ├── updater.ts          # electron-updater 检查/下载/安装
│   │   ├── ipc.ts              # IPC handler 注册（统一通道）
│   │   └── security.ts         # CSP、webSecurity、外部链接拦截
│   ├── preload/
│   │   └── index.ts            # contextBridge 暴露 window.electronAPI（安全子集）
│   └── renderer/               # 空壳（SPA 由 web/out 拷入）
├── resources/
│   ├── icon.ico                # Windows 图标（256x256 多尺寸）
│   └── icon.icns               # macOS 图标
└── scripts/
    ├── copy-web-build.mjs      # 将 web/out/ 拷贝至 desktop/renderer/
    └── release.mjs             # 版本号同步 + 触发版本服务记录
```

#### 2.3.3 主进程核心逻辑（关键实现要点）

```ts
// src/main/index.ts — 骨架
app.requestSingleInstanceLock();                      // 单实例：二次启动聚焦已有窗口
app.whenReady().then(() => {
  createMainWindow();                                  // BrowserWindow: 1200x800, 最小 960x640
  registerIpcHandlers();                               // aiProxy / updater / app 信息
  initUpdater();                                       // 启动 10s 后静默检查更新
});
// 窗口拦截所有 window.open / target=_blank → 系统默认浏览器打开（防 XSS 弹窗）
// 会话级 CSP：default-src 'self'; connect-src https:（仅允许远程 API）
```

```ts
// src/main/aiProxy.ts — AI 密钥下沉
import { app } from 'electron';
const AI_KEY = process.env.AI_API_KEY;                 // 或 safeStorage 解密存储
ipcMain.handle('ai:generate-script', async (_e, payload) => {
  // 校验 payload（Zod）→ 转发远程 AI 服务（与 server 端 generate-script 同构）
  // 密钥不出主进程；请求/响应不落日志明文
});
```

#### 2.3.4 preload 安全桥（最小暴露面）

```ts
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  appVersion: () => ipcRenderer.invoke('app:version'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  generateScript: (payload) => ipcRenderer.invoke('ai:generate-script', payload),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, p) => cb(p)),
});
```

#### 2.3.5 打包与发布

| 平台 | 产物 | 说明 |
|------|------|------|
| Windows x64 | `zhishuai-setup-{version}.exe` + `latest.yml` | NSIS 一键安装，自动创建桌面/开始菜单快捷方式，默认安装到 `%LOCALAPPDATA%\Programs\智枢AI` |
| Windows ARM64 | `zhishuai-setup-{version}-arm64.exe` | 可选（后期） |
| macOS x64/ARM64 | `zhishuai-{version}.dmg` + `latest-mac.yml` | 需 Apple Developer ID 签名 + notarization（资质另行准备） |

- 签名：Windows 需代码签名证书（OV/EV），未签名前可出「警告版」内测包
- 更新源：静态文件托管（腾讯云 COS + CDN），`latest.yml` 供 electron-updater 读取
- 构建流水线：GitHub Actions 新建 `desktop-release.yml`，`v*` tag 触发双平台构建

### 2.4 版本服务增强（server 端，约 1 天）

现有 `server/src/routes/version.ts` 已具备 `/latest`、`/check`、`/versions` CRUD，但字段不足以支撑桌面端自动更新，需增强：

| 改造项 | 现状 | 目标 |
|--------|------|------|
| 版本字段 | `version/buildNumber/downloadUrl/changelog/forceUpdate` | 增加 `platform`（现已有 `in` 查询但缺 `channel`）、`channel`（stable/beta）、`sha256`（安装包校验）、`size`（实际文件大小）、`url` 区分 APK/exe/dmg |
| 检查更新协议 | 返回 `hasUpdate` | 增加 `required`（是否强制）、`releaseNotes`、`downloadUrl`（按 platform+channel 返回正确包） |
| Prisma schema | `appVersion` 模型缺字段 | 新增 `channel`、`sha256`、`size`、`platform` 枚举约束，执行 `npx prisma migrate` |
| 兼容 | 现有 `downloadUrl: '/app/zhishuai.apk'` 默认值 | 保留 APK 兼容；新增桌面端时按 `platform=desktop` 记录独立版本行 |

### 2.5 桌面版登录与安全注意事项

1. 登录态沿用 JWT（`localStorage` 存储，AuthGuard 不变），桌面版不引入 OAuth 弹窗；
2. 离线缓存：Electron 会话启用 `Cache-Control` 长缓存 + `web/out` 本地文件，首屏加载为本地零网络；
3. 外链跳转：所有 `target=_blank` 由主进程拦截走系统浏览器，禁用 `window.open`；
4. 远程内容：Renderer 只加载本地静态文件 + HTTPS API，`webSecurity` 保持开启；
5. 升级安全：electron-updater 校验 `latest.yml` 签名（`publish` 配置 `updaterCacheDirName`），并比对 `sha256`。

### 2.6 桌面版工作量汇总

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| Web 静态化改造 | 2.2 节改动 1~5 | 2~3 天 |
| Electron 工程 | 主进程 + preload + 窗口/托盘/单实例 | 5~7 天 |
| AI 代理下沉 | aiProxy + 前端能力检测 | 1~2 天 |
| 自动更新 | updater + 版本服务增强 + 静态托管 | 2~3 天 |
| 打包/签名/发布 | electron-builder + CI + 图标/证书 | 2~3 天 |
| 测试/验收 | 安装/卸载/升级/权限回归 | 2 天 |
| **合计** | | **约 2.5~3 周** |

---

## 三、移动端 APK 改造方案（P1 跟进）

### 3.1 现状盘点

| 项 | 现状 |
|----|------|
| 工程 | `apk/`（Expo SDK 52 + React Native 0.76） |
| EAS 配置 | `eas.json` 已配置 development/preview（apk）/production（app-bundle）三通道，`appVersionSource: remote` |
| 版本服务 | `server/src/routes/version.ts` 已实现 `/latest`、`/check`、CRUD；APK 下载路径 `/app/zhishuai.apk` |
| 更新机制 | 原生包：版本服务对比 `buildNumber` 触发整包下载；JS 层：未启用 EAS Update 热更新 |

### 3.2 改造点

#### 3.2.1 版本检查逻辑增强（`apk/src/` 更新模块）

- 启动时调用 `POST /api/version/check`，携带 `{ currentVersion, buildNumber, platform: 'android' }`；
- 服务端返回 `hasUpdate + version{downloadUrl, changelog, size, forceUpdate}`；
- `forceUpdate=true` 时弹不可关闭升级框；否则可「稍后提醒」；
- 下载：RN 内置 `expo-file-system` 下载到应用缓存目录 → 校验 sha256 → `Intent` 唤起系统安装器（Android 8+ 需动态申请 `REQUEST_INSTALL_PACKAGES` 权限）→ 安装。

#### 3.2.2 签名与构建规范化

- 生成独立 release keystore（`.jks`，密码经 CI secrets 注入，禁止入库）；
- `eas.json` production 增加 `credentialsSource: remote`（EAS 托管）或本地 `credentials.json`；
- 输出物：内测 `apk`（preview 通道）+ 上架 `aab`（production 通道，经 Google Play，如暂不上架则持续出 apk 直发）。

#### 3.2.3 EAS Update 热更新（可选，M1+）

- 启用 `expo-updates`，配置 `runtimeVersion`（与原生 build 绑定）；
- JS-only 修复走 EAS Update 秒级下发，避免整包重装；原生变更仍走版本服务整包升级；
- 需要 `EXPO_PUBLIC_UPDATE_URL` + EAS 账号（或自建 update 服务）。

#### 3.2.4 与桌面版共享版本服务

- `appVersion` 模型增加 `platform` 取值 `android/ios/desktop`，`channel` 取值 `stable/beta`；
- APK 与桌面版共用 `/check` 协议，前端按 `platform` 取对应 `downloadUrl`；
- 管理员版本管理页（`web/app/admin/` 现有版本管理页）增加 platform/channel 筛选与 sha256/size 展示。

### 3.3 APK 工作量汇总

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| 版本检查 + 下载安装流程 | RN 更新模块 + 权限 | 3~4 天 |
| 签名与 EAS 构建配置 | keystore + eas.json + CI | 1~2 天 |
| EAS Update 热更新（可选） | expo-updates 接入 | 2 天 |
| 版本服务增强联调 | platform/channel 字段 + 管理页 | 1~2 天 |
| **合计** | | **约 1.5~2 周** |

---

## 四、共享基础设施（P1）

### 4.1 版本服务统一协议（v2）

```jsonc
// POST /api/version/check
// 请求
{ "currentVersion": "1.2.0", "buildNumber": 12, "platform": "desktop|android|ios", "channel": "stable|beta" }
// 响应
{
  "success": true,
  "data": {
    "hasUpdate": true,
    "required": false,                 // 是否强制更新
    "version": {
      "version": "1.3.0", "buildNumber": 13,
      "downloadUrl": "https://cdn.zhishuai.com/desktop/zhishuai-setup-1.3.0.exe",
      "sha256": "a1b2...", "size": "86.2 MB",
      "changelog": "…", "releaseDate": "2026-08-14"
    }
  }
}
```

### 4.2 静态分发（桌面更新包 + APK 包）

- 腾讯云 COS 桶 `zhishuai-release` + CDN：`/desktop/`、`/apk/`、`/ios/`（按需）；
- 现有 `/app/zhishuai.apk` 改为指向 COS 的 302 跳转或直接换用新地址；
- 上传由 CI 流水线自动完成（GitHub Actions → COS SDK）。

### 4.3 CI/CD 流水线

| 触发 | 任务 | 产出 |
|------|------|------|
| push main（web 变更） | `next build`（standalone 模式）→ 部署 → verify-login | 在线版更新（现状保持） |
| push main（server 变更） | `tsc` → pm2 重启 | API 更新（现状保持） |
| tag `v*` + web 变更 | `next build`（export 模式）→ electron-builder 双平台 → COS 上传 → 版本服务写入 | exe/dmg + latest.yml |
| tag `v*` + apk 变更 | `eas build -p android --profile production` → 产物上传 | aab/apk + 版本记录 |

---

## 五、实施路线图

### 里程碑 M1：桌面版 MVP（第 1~3 周，P0）

| 周 | 任务 | 验收 |
|----|------|------|
| W1 | Web 静态化 4 处改造；`next build` 产出 `web/out`；登录/三角色页面本地可跑 | `npx serve web/out` 全页面可用；桌面版本地加载无白屏 |
| W2 | Electron 工程搭建：窗口/托盘/单实例/AI 代理/IPC；安装包出内测版 | 双击 exe 安装→登录→AI 生成脚本→托盘退出 |
| W3 | 版本服务增强 + electron-updater + COS 分发 + CI 双平台构建 | 从 1.0 静默升级到 1.1 成功；sha256 校验通过 |

**M1 出口标准**：Windows 安装包可安装/卸载/自升级，核心功能（登录、AI 创作工厂、四大业务模块）与 Web 版一致。

### 里程碑 M2：APK 升级链路（第 4~5 周，P1）

| 周 | 任务 | 验收 |
|----|------|------|
| W4 | RN 版本检查+下载安装；keystore 签名；preview apk 出包 | 旧包检测到新版本→下载→安装成功 |
| W5 | 版本服务 platform/channel 联调；管理页增强；EAS Update（可选） | 管理员可在后台分别发布桌面/安卓版本 |

### 里程碑 M3：稳定与发布（第 6 周，P2）

- 全端回归测试（登录/权限/AI/支付回调/消息推送）；
- macOS 签名公证（如资质就绪）；Windows 代码签名；
- 更新 `docs/SESSION_MEMORY.md` 与运维手册；发布 v1.0 正式版。

---

## 六、风险与应对

| 风险 | 等级 | 应对 |
|------|------|------|
| `output: 'export'` 影响在线版部署 | 高 | 用 `NEXT_OUTPUT` 环境变量双模式构建；在线版保持 standalone，先小范围灰度验证 |
| 静态导出下部分依赖（antd 动态加载等）异常 | 中 | 构建期全页面 `next build` 报错即暴露；必要时对问题页做降级 |
| 唯一 AI 路由迁移主进程后 Web 版回归 | 中 | 保留原路由 + 能力检测双通道，桌面/Web 分开发布验证 |
| Windows 未签名 exe 触发 SmartScreen | 中 | 内测期提供「仍要运行」指引；正式版采购代码签名证书 |
| electron-updater 下载源不可达 | 低 | COS+CDN 双可用区；失败回退提示手动下载页 |
| APK 安装权限（Android 8+）拒授 | 低 | 引导页说明 + 跳转系统设置 |
| 三端版本不同步 | 低 | 版本服务统一协议 + 后台管理页强制记录 changelog |

---

## 七、验收标准（DoD）

1. `web/out/` 静态化构建 0 error；在线版 standalone 构建回归通过（verify-login 三种角色 HTTP 200）；
2. Windows 安装包在干净虚拟机完成：安装 → 首次启动 → 登录 → 核心功能 → 卸载 → 无残留进程；
3. 桌面版 `v1.0 → v1.1` 自动更新成功（含 sha256 校验、失败回滚提示）；
4. APK 旧包检测更新 → 下载 → 校验 → 安装成功；`forceUpdate` 场景弹窗行为正确；
5. 管理员后台可分别发布/筛选 `desktop` / `android` 版本；
6. 桌面版 AI 生成脚本密钥不出主进程（code review + 抓包验证无泄漏）。

---

## 八、结论

本次改造以**真桌面版（Electron + 静态化 SPA）为第一优先级**，Web 端仅需 4~5 处小改动（约 2~3 天），Electron 工程 1.5~2 周，总工期约 2.5~3 周可交付可安装、可自更新的 Windows/macOS 客户端；随后 1.5~2 周完成 APK 升级链路，实现三端（Web/桌面/移动）共用后端与版本服务体系。该方案充分复用智枢AI 纯 SPA 的架构红利，避免壳方案推倒重来，是当前投入产出比最高的路径。
