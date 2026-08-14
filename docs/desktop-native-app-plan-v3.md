# 智枢AI 桌面原生安装版改造完整方案（v3.0 · 无壳 · 无Web端 · 桌面唯一前端）

> 文档状态：正式方案（v3.0）
> 编写日期：2026-08-14
> 关联文档：`docs/desktop-apk-install-upgrade-plan.md`（v1.0 壳方案，已废弃）、`docs/desktop-first-refactor-plan-v2.md`（v2.0 Electron 真桌面版，被本方案取代）
> 项目仓库：github.com/baizhiji/zhishuai（Monorepo：`web/` + `server/` + `apk/` + `shared/`）

---

## 一、需求前提与方案定位

### 1.1 用户明确的三条前提（本方案唯一依据）

1. **不要加壳版本**——彻底否决"Electron 壳加载远程网页"（v1.0 方案），页面必须本地打包、离线可用、具备真实系统能力；
2. **不用 Web 端（系统主形态）**——产品主界面不再以"浏览器访问网页"形态交付。客户 / 代理商 / 管理员日常操作界面全部改为**安装的桌面软件**；在线 Web 服务（`pm2 zhishuai-web` / `next start`）停止对外服务。**但"只有网页才能实现的功能"（业务网页 + 技术性网页自动化）全部保留**，详见 §1.2；
3. **要真实的电脑安装版**——Windows 安装包（NSIS/MSI），桌面/开始菜单快捷方式，独立卸载，自动升级。

### 1.2 "不用 Web 端"的准确边界（用户已澄清，重要）

**"不用 Web 端"的含义**：系统的**主形态**不使用 Web 端——客户 / 代理商 / 管理员日常操作界面（登录、AI创作工厂、智能招聘、智能获客、推荐分享、代理商门户、管理后台）全部改为**安装的桌面软件**，浏览器不再作为产品入口。

**但"只有网页才能实现的功能"完全保留**，用户明确认可。分三类：

| 范畴 | 处置 | 说明 |
|------|------|------|
| **使用者前端**（三角色日常界面） | **全部桌面化** | 桌面版是唯一主形态，浏览器访问下线 |
| **业务网页功能**（只有网页形态才能承载） | **保留** | ① 分享码落地页（客户扫码后非系统用户要打开网页查看/转发，属推荐分享业务线核心链路，必须保留）；② 安装包/APK 下载页（分发链接入口）；③ 隐私政策/服务条款（合规，同时内置进桌面版"关于"页） |
| **技术性网页自动化**（依托浏览器操作第三方网页） | **保留** | Playwright 浏览器自动化是系统核心差异化能力，跑在**服务器端**：自媒体平台扫码授权登录（抖音/快手/小红书）、内容自动发布、招聘职位采集、智能跟评。它自动化操作的是**第三方平台网页**（抖音创作者中心、招聘网站等），不是本系统的 Web 端，与桌面化改造完全兼容、互不影响 |

**判据**：看"被替代的是什么"。三角色日常操作界面（原 Web 产品本体）→ 桌面化；网页形态本身不可替代的功能（被分享者要打开网页查看、浏览器自动化操作第三方网页）→ 保留。前者是"产品形态"（要桌面化），后者是"功能实现手段"（本就不是本系统的 Web 端，谈不上下线）。

### 1.3 架构形态转变

```
v2.0（已被取代）：  浏览器(在线Web) + Electron桌面 + APK   ←→  云API + MySQL
v3.0（本方案）：    桌面安装版(唯一前端) + APK            ←→  云API + MySQL
                    + 保留依赖网页的功能
                      (业务网页: 分享/下载/合规
                      + 网页自动化: Playwright 操作第三方平台)
```

云 API（Express + MySQL，部署于香港 CVM 150.109.60.130）**整体保留**——多租户 SaaS 的数据、AI 代理、授权态、版本服务全在云端，桌面版通过 HTTPS 调用，与浏览器访问同一套 API，后端零业务重构。

### 1.4 为什么选 Tauri 而非 Electron（核心决策）

"不要加壳 + 不想用 Web 端"这两个诉求，指向一个比 Electron 更贴合的选型。对比：

| 维度 | Tauri 2.x（推荐） | Electron 33（v2.0 选型） | 原生重写（Qt/Flutter） |
|------|-------------------|--------------------------|------------------------|
| 安装包体积 | 8~15 MB | 80~100 MB | 10~40 MB |
| 内存占用 | 约 80~150 MB | 约 200~400 MB | 约 60~150 MB |
| 渲染引擎 | 系统 WebView2（Win10/11 自带，不打包浏览器） | 内置整个 Chromium | 自绘（Qt/Impeller），无 Web 技术 |
| 前端代码复用 | 100%（73 个 React 页面原样打包） | 100% | 0%（全部 Dart/C++ 重写） |
| 安装形态 | NSIS / MSI / dmg / AppImage | NSIS / dmg | 同左 |
| 自动更新 | tauri-plugin-updater + 签名 | electron-updater | 需自建 |
| 密钥安全 | 系统凭据管理器（Windows Credential Manager / macOS Keychain） | safeStorage | 系统级 |
| 工程语言 | Rust（内存安全、启动快） | Node/TS | Dart/C++ |
| 团队门槛 | 需 Rust 基础（可小步验证） | 前端直接上手 | 极高 |

**推荐结论：Tauri 2.x。** 理由：一是满足"不是加壳"——页面资源 100% 打进安装包本地加载、Rust 主进程提供文件系统/托盘/通知/凭据/快捷键/单实例等真实系统能力、安装与卸载是真软件形态、离线可用；二是"远离 Web 形态"——不打包浏览器内核（安装包仅 Electron 的 1/8），观感与内存表现都更像原生软件（1Password、Figma Desktop、LINE 桌面版同为 Tauri 技术路线）；三是前端 73 个页面代码零重写，工期可控。

**必须诚实说明的边界**：Tauri 在 Windows 上用系统 WebView2 渲染 UI（底层仍是 Chromium 内核）。"不使用任何网页渲染技术"只有原生重写一条路（Qt/C++ 或 Flutter Desktop），需重写全部 73 个页面，工期 3 个月起步，本方案明确不选。Tauri 与"浏览器看网页"的体验差异：本地资源、无地址栏、真实安装、系统集成——对使用者而言就是装好的软件。

**保底路径**：若团队确认无任何 Rust 能力且不愿投入学习（约 3~5 天上手），可退回 v2.0 的 Electron 真桌面版（工程结构本方案 §4 基本复用，仅替换主进程语言与打包器），其余设计不变。

---

## 二、总体架构

```
┌───────────────────────────────────────────────┐
│              桌面客户端（Tauri 2.x）            │
│  ┌─────────────────────────────────────────┐  │
│  │  WebView（系统 WebView2 / WebKit）       │  │
│  │  - 静态化 SPA（web/out/ 打包产物）       │  │
│  │  - 73 个页面全部复用，零业务代码改动     │  │
│  └──────────────────┬──────────────────────┘  │
│                     │ 本地资源 + IPC           │
│  ┌──────────────────▼──────────────────────┐  │
│  │  Rust 主进程（src-tauri/）：             │  │
│  │  - 窗口/托盘/单实例/全局快捷键           │  │
│  │  - AI 代理（密钥存系统凭据管理器）       │  │
│  │  - 自动更新（tauri-plugin-updater）      │  │
│  │  - 本地存储/文件导出/系统通知            │  │
│  └──────────────────┬──────────────────────┘  │
│                     │ HTTPS                   │
└─────────────────────┼─────────────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │  云端（现状保留，后端零重构）    │
       │  Express API + MySQL (TDSQL-C) │
       │  + AI 代理 + 版本服务 + 认证    │
       │  + 静态公共服务（分享/下载/合规）│
       └───────────────────────────────┘
```

数据流（与 v2.0 一致，无新增后端逻辑）：登录 JWT → 授权态存 WebView 本地存储（AuthGuard 不变）→ 业务请求走 HTTPS 远程 API → AI 生成类请求走 Rust 主进程代理（密钥不出主进程）→ 版本检查走版本服务。

---

## 三、前端改造（复用 v2.0 清单，新增 Web 下线处置）

> 原则：`web/` 代码库继续作为**桌面版的前端源**，只做静态化改造，不再对外部署在线版。

### 3.1 静态化改造（4 处，约 2~3 天，沿用 v2.0 §2.2 结论）

| # | 改动 | 内容 | 工作量 |
|---|------|------|--------|
| 1 | `web/next.config.js` | 增加 `output: 'export'` + `images.unoptimized: true`。由于在线版下线，**不再需要 `NEXT_OUTPUT` 双模式**，直接固定 export 模式 | 0.5 天 |
| 2 | 删除 `web/middleware.ts` | 静态导出不支持 middleware；前端 `AuthGuard.tsx` 已完整覆盖角色权限（桌面版内置登录，后端 authMiddleware 兜底） | 0.5 天 |
| 3 | `web/app/api/ai/generate-script/route.ts` | 唯一服务端路由，逻辑迁移至 Rust 主进程 AI 代理；前端 `web/services/ai.ts` 做能力检测双通道（`window.__TAURI__` 存在走 IPC，否则走原路由——保留原路由仅为公共服务页/降级） | 1 天 |
| 4 | API baseURL 绝对化 | `web/utils/request.ts` 与 `web/lib/request.ts` 统一读取 `NEXT_PUBLIC_API_BASE_URL`，桌面版构建注入 `https://baizhiji.net/api`（生产域名）；顺带完成两客户端统一 TODO | 0.5~1 天 |
| 5 | 环境检测 | 新增 `web/utils/env.ts`：`export const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;` | 0.5 天 |

### 3.2 在线 Web 下线处置（新增，v2.0 没有，约 1~2 天）

| 项 | 动作 |
|----|------|
| 生产下线 | `pm2 delete zhishuai-web`（保留进程配置与构建产物，可随时回滚）；nginx 移除 Web 主站路由，保留 `/api/` 代理与静态公共服务路由 |
| 登录入口 | 浏览器登录页下线；登录唯一入口为桌面版内置登录页（三角色入口逻辑不变，复用现有 `/login` 页面代码） |
| 分享落地页 | **保留**：`/share/*` 路由（含扫码落地 scanUrl），部署为独立静态站（nginx 指向 `web/out` 中 share 相关产物），供被分享者打开 |
| 下载页 | **保留**：新增极简 `/download` 静态页（放安装包/APK 下载链接），替代 v1.0 的"发链接"模式并接入版本服务 |
| 隐私/条款 | **保留**：`/privacy`、`/terms` 静态页 + 桌面版"关于"页内置副本 |
| 网页自动化 | **保留且不受影响**：Playwright 桥接（`/api/playwright`、`/api/social-account`、`/api/comment-delivery`）跑在服务端，自动化操作的是第三方平台网页（抖音/快手/小红书/招聘网站），不属于本系统 Web 端，不下线；桌面版与 APK 继续通过 API 调用 |
| 域名 | `baizhiji.net` 继续承担 API + 公共服务；桌面版 API 直连 `https://baizhiji.net/api` |

> 注意：公共服务页若依赖登录态（分享落地页不含），需保证静态导出产物中分享相关页面不触发 AuthGuard 强制跳转——审计结论：分享落地页为非登录页面，不受影响（实施时验证）。

### 3.3 移动端 APK

保持 v2.0 §3 设计不变（APK 走远程 API + 版本服务 + EAS Update 可选），与桌面版共享版本服务协议。APK 不受"Web 下线"影响（它本来就不依赖 Web 主站，仅依赖 `/api` 与分享落地页，均已保留）。

---

## 四、Tauri 桌面工程（`desktop/` 新目录，1.5~2.5 周）

### 4.1 技术栈

| 项 | 选型 |
|----|------|
| 框架 | Tauri 2.x（Rust 主进程 + 系统 WebView2） |
| 前端 | 100% 复用静态化 SPA（`web/out/` 拷入），不新增前端框架 |
| 打包 | tauri-bundler：Windows NSIS + MSI |
| 自动更新 | tauri-plugin-updater（更新清单 JSON + 签名公钥校验） |
| 安全 | capabilities 最小权限声明、CSP 收紧、`shell` 白名单、外链一律系统浏览器打开 |

### 4.2 工程结构

```
desktop/
├── package.json              # 前端脚本 + @tauri-apps/cli
├── vite.config.ts            # 前端（本地构建 web/out → 直接拷贝，见 scripts）
├── src/                      # 前端占位（由 copy-web-build 注入 web/out）
├── src-tauri/
│   ├── Cargo.toml            # Rust 依赖
│   ├── tauri.conf.json       # 应用配置：productName/identifier/窗口/打包/更新源
│   ├── capabilities/
│   │   └── default.json      # 权限声明（最小暴露面）
│   ├── icons/                # icon.ico / icon.icns / 各尺寸 png
│   ├── build.rs
│   └── src/
│       ├── main.rs           # 入口
│       ├── lib.rs            # 应用装配：窗口/托盘/单实例/快捷键
│       ├── ai_proxy.rs       # AI 代理（密钥存系统凭据管理器，reqwest 转发）
│       ├── updater.rs        # tauri-plugin-updater 检查/下载/安装
│       └── tray.rs           # 托盘与生命周期
├── scripts/
│   ├── copy-web-build.mjs    # web/out/ → desktop/src/
│   └── release.mjs           # 版本号同步 + 上传 COS + 写版本服务
└── .env.example
```

### 4.3 Cargo.toml 核心依赖

```toml
[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon", "image-png"] }
tauri-plugin-updater = "2"          # 自动更新
tauri-plugin-store = "2"            # 本地 KV（登录态/偏好）
tauri-plugin-single-instance = "2"  # 单实例
tauri-plugin-notification = "2"     # 系统通知
tauri-plugin-global-shortcut = "2"  # 全局快捷键
tauri-plugin-shell = "2"            # 外链用系统浏览器打开（白名单）
tauri-plugin-fs = "2"               # 文件导出（Word/Excel/PPT/PDF 保存）
keyring = "3"                       # 系统凭据管理器（Windows Credential Manager / Keychain）
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### 4.4 Rust 主进程关键实现

**AI 密钥下沉（ai_proxy.rs）**：与 v2.0 的 Electron safeStorage 等价但更标准——用 `keyring` crate 存系统凭据管理器。支持两种模式：① 云端托管 Key（沿用现有服务端兜底 Key，零配置，默认）；② 本地 Key（用户自己的 API Key 写入系统凭据管理器，仅 Rust 主进程可读，WebView 与日志不可见）。AI 请求由主进程 `reqwest` 直接转发，密钥不出进程。

```rust
// ai_proxy.rs 骨架
#[tauri::command]
async fn ai_generate_script(payload: Value) -> Result<Value, String> {
    // 1. Zod 校验等价物：serde 反序列化到强类型结构，拒绝多余字段
    // 2. 读取密钥：优先系统凭据管理器（keyring），否则云端兜底 Key（环境变量）
    // 3. reqwest 转发远程 AI 服务（与 server 端 generate-script 同构）
    // 4. 返回结构化结果；请求/响应不落日志明文
}
```

**主进程装配（lib.rs）**：

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 二次启动 → 聚焦已有窗口
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ai_generate_script, check_update, install_update, export_file
        ])
        .setup(|app| { /* 托盘 / 更新检查（启动 10s 后静默）*/ Ok(()) })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 4.5 tauri.conf.json 关键配置

```jsonc
{
  "productName": "智枢AI",
  "identifier": "com.baizhiji.zhishuai",
  "app": {
    "windows": [{ "title": "智枢AI", "width": 1200, "height": 800, "minWidth": 960, "minHeight": 640 }],
    "security": { "csp": "default-src 'self'; connect-src https://baizhiji.net; img-src 'self' data: https:" }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "category": "Business",
    "shortDescription": "智枢AI 中小企业AI增长工具箱",
    "icon": ["icons/icon.ico", "icons/icon.png"]
  },
  "plugins": {
    "updater": {
      "endpoints": ["https://baizhiji.net/api/version/desktop/latest.json"],
      "pubkey": "请填写 tauri signer generate 生成的公钥",
      "windows": { "installMode": "passive" }
    }
  }
}
```

### 4.6 preload 桥（前端可调用面，最小暴露）

```ts
// desktop/src/preload.ts → 通过 @tauri-apps/api/core invoke
declare global {
  interface Window {
    tauriAPI?: {
      aiGenerateScript: (payload: unknown) => Promise<unknown>;
      checkUpdate: () => Promise<unknown>;
      installUpdate: () => Promise<void>;
      exportFile: (payload: { format: string; content: unknown }) => Promise<string>;
    };
  }
}
```

---

## 五、自动更新（1.5~2 天）

1. **签名体系**：`npx tauri signer generate` 生成密钥对 → 公钥写入 `tauri.conf.json`（如上）→ 私钥存 CI secrets + 本地双备份（丢失将无法推送更新，与 APK keystore 同等重要）；
2. **更新清单**：`/api/version/desktop/latest.json`（JSON 格式，符合 tauri-plugin-updater 协议）：
   ```json
   { "version": "1.1.0", "notes": "新增…修复…", "pub_date": "2026-08-14T00:00:00Z",
     "platforms": { "windows-x86_64": {
       "signature": "…(签名串)", "url": "https://cdn.zhishuai.com/desktop/zhishuai-setup-1.1.0.exe" } } }
   ```
   由现有版本服务 `server/src/routes/version.ts` 增强后动态生成（字段：`version/buildNumber/sha256/size/changelog/platform/channel/minVersion/forceUpdate`，沿用 v2.0 §4.1 统一协议，`AppVersion` 模型补 `channel/sha256/size`）；
3. **检查时机**：启动 10s 后静默检查 + 每小时一次；`minVersion` 判断强制更新（不可跳过）；
4. **分发**：安装包/更新包上传 COS + CDN（`/desktop/` 目录），CI 流水线自动上传（沿用 v2.0 §4.2/§4.3）。

---

## 六、打包 / 签名 / 发布

| 平台 | 产物 | 说明 |
|------|------|------|
| Windows x64 | `智枢AI-Setup-{version}.exe`（NSIS）+ `.msi` | 引导式安装（可选安装路径），桌面/开始菜单快捷方式，默认装到 `%LOCALAPPDATA%\Programs\智枢AI` |
| Windows ARM64 | 后期可选 | — |
| macOS | `dmg`（Tauri 原生支持） | 需 Apple Developer ID 签名 + 公证（资质另行准备，首期可仅出 Windows） |

- Windows 代码签名：OV/EV 证书（商用前购买）；未签名前出「SmartScreen 警告版」内测包，附"仍要运行"指引；
- WebView2：Win10/11 自带；Win10 早期版本如缺失，安装包附带 WebView2 Bootstrapper 离线包（Tauri 支持）；
- CI：GitHub Actions 新建 `desktop-release.yml`，`v*` tag 触发 → `next build`（export）→ `tauri build` → 上传 COS → 写版本服务。

---

## 七、里程碑与工作量

| 里程碑 | 内容 | 工作量 |
|--------|------|--------|
| **M1 桌面版 MVP** | 前端静态化 5 处改造（§3.1）；Tauri 工程：窗口/托盘/单实例/AI 代理/IPC/密钥管理；出 Windows 内测安装包 | 3~4 周（含 Rust 上手缓冲；无 Rust 经验者 +3~5 天） |
| **M2 更新与分发** | tauri-plugin-updater + 签名体系 + 版本服务增强 + COS 分发 + CI | 1.5~2 周 |
| **M3 Web 下线与收尾** | 在线 Web 下线、公共服务页保留（分享/下载/合规）、APK 联调、全端回归、文档 | 1 周 |
| **合计** | | **约 5.5~7 周** |

> 若确认走 Electron 保底路径：工作量约 3~4 周（复用 v2.0 估算），代价是安装包 ~80MB、内存更高，仍满足"非加壳"但"Web 形态感"更重。

**M1 出口标准**：Windows 干净虚拟机完成 安装 → 首次启动 → 三角色登录 → 核心功能（AI创作工厂 / 智能招聘 / 智能获客 / 推荐分享 / 代理商门户 / 管理后台）→ 托盘/单实例 → 卸载无残留；断网启动正常、页面本地可用（涉及数据操作提示网络异常）。

---

## 八、风险与应对

| 风险 | 等级 | 应对 |
|------|------|------|
| Rust 学习成本（团队无经验） | 高 | 先做 1 天 PoC（托盘 + 单实例 + AI 代理三个最小能力）；超出容忍则退回 Electron 保底路径（§1.4） |
| 静态导出下 antd 动态加载/`window` 引用异常 | 中 | 构建期全页面 `next build` 报错即暴露；问题页按需降级（沿用 v2.0 结论：73 页 100% SPA，预期零异常） |
| 依赖网页的功能被误下线（分享/下载/合规 + Playwright 网页自动化） | 中 | §1.2 三类边界 + §3.2 保留清单，纳入 M3 验收项逐一核对；Playwright 链路回归测试（扫码授权/发布/采集/跟评） |
| 在线 Web 下线后回滚需求 | 低 | 保留构建产物与 pm2 配置，`pm2 resurrect` 可 30 分钟内恢复 |
| WebView2 兼容（旧版 Win10） | 低 | 安装包附带 Bootstrapper 离线包；Win11 全系自带 |
| updater 签名私钥丢失 | 中 | CI secrets + 本地双备份（与 keystore 同等铁律，见 §五） |
| Windows 未签名 exe 触发 SmartScreen | 中 | 内测指引 + 商用前购 OV/EV 证书 |
| 三端版本不同步（桌面/APK） | 低 | 版本服务统一协议 + 后台版本管理页（沿用 v2.0 §4.1） |

---

## 九、验收标准（DoD）

1. 干净 Win10/11 虚拟机：安装 → 启动 → 登录（三角色）→ 核心功能 → 卸载，无残留进程、无浏览器依赖；
2. 断网启动：应用可启动、本地页面正常渲染、已缓存登录态可用、数据操作给"网络异常"提示；
3. `v1.0 → v1.1` 自动更新成功（签名校验通过、sha256 一致、失败提示手动下载）；
4. AI 生成：本地 Key 场景密钥不出 Rust 主进程（code review + 抓包验证无泄漏）；云端兜底 Key 场景零配置可用；
5. 在线 Web 主站已下线（`baizhiji.net` 不再提供三角色登录页）；分享落地/下载/隐私条款公共服务正常；Playwright 网页自动化链路（扫码授权/内容发布/职位采集/智能跟评）回归测试通过；
6. 桌面版与 APK 共用版本服务，管理员后台可分别发布 `desktop`/`android` 版本（含 channel/sha256/size）；
7. 托盘/单实例/系统通知/全局快捷键按设计工作。

---

## 十、与既往方案的关系

| 方案 | 状态 | 关系 |
|------|------|------|
| v1.0 壳方案（Electron 加载远程 URL） | **废弃** | 远程加载 = 加壳，用户否决 |
| v2.0 Electron 真桌面版（Web 在线保持 + 桌面新增） | **被取代** | 保留其前端静态化结论、版本服务设计、CI 分发设施；替换为 Tauri 工程；Web 在线从"保持"改为"下线" |
| **v3.0 本方案** | **执行** | 桌面原生安装版为唯一前端交付形态；云 API 保留；保留全部依赖网页的功能（业务网页：分享/下载/合规 + 技术性网页自动化：Playwright） |

---

## 十一、结论

在"不要加壳、不用 Web 端、要真实安装软件"三条前提下，智枢AI 的交付形态收敛为：**Tauri 2.x 桌面原生安装版（唯一使用者前端）+ 云 API + 保留全部依赖网页的功能**（业务网页：分享码落地/下载/隐私条款；技术性网页自动化：Playwright 扫码授权、内容发布、职位采集、智能跟评——这些自动化操作的是第三方平台网页，不属于本系统 Web 端，完全保留）。方案复用 v2.0 已验证的前端静态化结论（73 页 100% SPA，前端改造仅 2~3 天），将桌面工程从 Electron 升级为 Tauri（安装包 8~15MB、内存低一半、系统凭据管理器存密钥、真 NSIS/MSI 安装），并新增"在线 Web 下线"处置与公共服务页保留清单。总工期约 5.5~7 周（含 Rust 上手缓冲），若确认无 Rust 能力可退 Electron 保底（3~4 周）。云 API 与数据库零重构，多租户、三角色、AI 代理、版本服务全部沿用。

*本文为正式方案。确认 §1.4 技术选型（Tauri 推荐 / Electron 保底）后即可按 §7 里程碑执行；实施前需用户提供：Windows 代码签名证书（商用）、updater 签名私钥双备份位置、COS bucket 与 CDN 域名。*
