# 智枢AI 客户端改造方案：电脑安装版 + APK 应用内升级

> 版本：v1.0 | 日期：2026-08-14 | 状态：方案稿（未动代码）
> 本文基于 2026-08-14 前的历次交流整理：安装包走"发送下载链接"直发客户、不进应用市场；升级由自建更新源完成；APK 需解决应用内下载安装与签名一致性；桌面版需解决壳更新与内容更新两条线。

---

## 一、方案背景与目标

智枢AI 当前交付形态是 Web 端（SaaS 管理后台）+ APK 端（Expo）。业务上，安装包计划**不发布到任何应用市场**，而是通过下载链接直接发给客户安装使用。因此"升级"这件事完全由我们自己掌控——我们就是自己的"应用市场"。

本次方案要回答两个改造问题：

1. **电脑安装版**：把智枢AI 做成 Windows 安装包（.exe）形态交付给客户，具备自动升级能力。
2. **APK 端改造**：让现有 Expo APK 支持应用内检测更新、下载安装、热更新，替换当前的"手动发新包"模式。

核心设计原则（历次交流已确认）：

- **下载链接与更新源共用一套设施**：发给客户的初始安装链接、客户端自动检查的更新源，是同一个服务器/COS 下的静态资源。
- **版本接口统一控制**：一个 `/api/version/latest` 接口决定"有没有新版本、是否强制、走哪个 channel"，桌面版与 APK 共用。
- **内容更新与壳更新分离**：桌面版业务内容随 Web 迭代（免发版），壳（Electron）低频更新；APK 业务 JS 走热更新，原生壳低频整包更新。
- **签名一致性是 APK 的生命线**：所有版本必须同一 keystore 签名，否则用户无法覆盖安装。

---

## 二、总体架构

### 2.1 分发模式总览

| 端 | 初始安装物 | 自动更新机制 | 内容更新 |
|----|-----------|-------------|---------|
| 电脑安装版 | `智枢AI-Setup-1.x.x.exe`（NSIS 安装包） | electron-updater 检查自有更新源 `latest.yml` | 业务界面 = 远程 Web 端，随 Web 迭代，免发版 |
| APK 端 | `zhishuai-1.x.x.apk` | 应用内版本比对 + expo-file-system 下载 + FileProvider 安装 | EAS Update 热更新推送业务 JS |
| 初始下载链接 | `https://cdn.xxx/install/...` | — | — |

### 2.2 数据流（一次升级的完整链路）

```
客户端启动
  → GET https://api.baizhiji.net/api/version/latest?platform=desktop|android&channel=stable&currentVersion=1.2.0
  → 服务端查 AppVersion 表（released + 匹配 platform/channel）
  → 返回 { latestVersion, minVersion, downloadUrl, sha256, size, changelog, forceUpdate }
  → 客户端比对：< minVersion → 强制弹窗不可跳过；< latestVersion → 可选更新
  → 下载：APK 走 expo-file-system 下载到应用私有目录（进度条）；桌面版走 electron-updater 自动下载
  → 安装：APK 用 FileProvider + ACTION_VIEW intent；桌面版 NSIS 静默/弹窗安装
  → 重启后使用新版本
```

### 2.3 设施清单（需提前备好）

| 设施 | 用途 | 现状 |
|------|------|------|
| 版本接口 | 下发版本决策 | `server/src/routes/version.ts` 已有雏形，需增强（见 §5.2） |
| AppVersion 表 | 版本记录 | Prisma 已有 `AppVersion` 模型，字段需扩展 |
| 静态更新目录 | 存放 exe/apk/latest.yml | 未建（建议 COS + CDN，冷门流量费用很低） |
| keystore 签名文件 | APK 覆盖安装唯一凭证 | 需立即锁定并备份 |
| Windows 代码签名证书 | 消除 SmartScreen 拦截 | 未购（可选，建议商用前购） |

---

## 三、电脑安装版（Electron 桌面版）方案

### 3.1 形态决策：壳 + 远程 Web（推荐）

智枢AI Web 端是 Next.js 14 App Router，使用了 `web/middleware.ts`（服务端鉴权）、Server Actions、SSR 渲染。**这些能力无法通过 `next export` 静态化**（middleware/Server Actions 在静态导出下不支持），因此"把 Web 完全打包进安装包"这条路改造量极大且不可行。

**推荐形态：Electron 壳加载远程 Web 端（https://baizhiji.net）**。即：

- Electron 窗口直接加载生产 Web 地址，客户看到的就是完整智枢AI 后台（按角色登录）。
- 登录态、菜单、全部业务功能由远程 Web 负责，**与浏览器体验一致，且 Web 每次迭代客户即刻可用，永远不需要为业务内容发安装包**。
- 安装包（壳）只在原生层变化时发版（一年几次），走 electron-updater 自动更新。

这个形态完全契合"SaaS + 下载链接分发"的业务：SaaS 本来就要联网，客户要的是"像软件一样装到电脑上"，而不是离线运行。

备选路径（记录但不作为首期）：未来如有离线/内网需求，可将核心页面改造成纯客户端渲染（去掉 middleware 依赖）后用 `next export` 打包，作为二期评估项。

### 3.2 工程结构（新增 `desktop/` 目录）

```
desktop/
├── package.json          # electron + electron-builder + electron-updater
├── electron-builder.yml  # 打包配置（NSIS + generic publish）
├── main.ts               # 主进程：窗口、托盘、单实例、更新事件
├── preload.ts            # 安全的 bridge（版本信息、更新状态、外链打开）
├── assets/
│   ├── icon.ico          # 窗口/安装包图标
│   └── icon.png          # Linux 备用
└── .env.example
```

### 3.3 主进程要点（main.ts）

- 创建 `BrowserWindow`：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`，仅通过 `preload.ts` 暴露白名单 API。
- `webContents.setWindowOpenHandler`：外链一律 `shell.openExternal`，禁止新开 Electron 窗口（防弹窗滥用）。
- 加载地址：`https://baizhiji.net`（生产），支持 `--local` 参数指向本地 Web 调试。
- 单实例锁：`app.requestSingleInstanceLock()`，二次启动聚焦已有窗口。
- 系统托盘：最小化到托盘、右键退出，符合桌面软件习惯。
- 关于/版本：窗口标题或"关于"入口显示壳版本（`app.getVersion()`）与 Web 版本（调版本接口）。

### 3.4 electron-builder 打包配置（electron-builder.yml）

```yaml
appId: com.baizhiji.zhishuai
productName: 智枢AI
directories:
  output: release
files:
  - main.js
  - preload.js
win:
  target:
    - target: nsis
      arch: [x64]
  icon: assets/icon.ico
nsis:
  oneClick: false          # 可选：引导式安装，显示路径选择
  allowToChangeInstallationDirectory: true
  perMachine: false        # 按用户安装，免管理员权限
  artifactName: 智枢AI-Setup-${version}.${ext}
  shortcutName: 智枢AI
publish:
  provider: generic
  url: https://cdn.zhishuai.net/updates/desktop/   # 指向 COS/CDN 静态目录
```

### 3.5 electron-updater 自动更新

- 打包产物：`智枢AI-Setup-1.2.0.exe` + `latest.yml`（版本元数据）+ `*.blockmap`（差分数据）。
- 发布动作：把上述 3 类文件 scp/上传到 `cdn/updates/desktop/` 即可，无需任何服务端逻辑（latest.yml 是静态文件）。
- 更新流程（主进程监听）：启动时与每小时 `checkForUpdates()` → 有新版自动下载（进度回调）→ 下载完弹窗"重启安装" → `quitAndInstall()`。
- **差分更新**：blockmap 让老客户只下载变化的部分（几 MB 而非几十 MB），对客户和服务器带宽都友好。
- **强制更新**：读版本接口 `minVersion`，低于阈值时把更新对话框设为不可关闭、App 不提供"跳过"。
- **失败回退**：electron-updater 自带校验与回滚，安装失败自动退回上一版本。

### 3.6 安全与合规要点

- Windows SmartScreen：未签名的 exe 首次运行会被警告。**商用前建议购买代码签名证书（OV/EV）**；EV 证书能消除大部分拦截，OV 至少能显示发布者名。
- 更新源必须走 HTTPS，且下载文件的 sha512 由 latest.yml 提供，electron-updater 自动校验。
- 禁止在壳内开放 devtools 快捷键（生产环境 `win.webContents.openDevTools` 不注册），防止客户误入调试态。

---

## 四、APK 端改造方案

### 4.1 现状盘点（已确认的代码事实）

- `apk/package.json` 已依赖 `expo-updates@~0.27.5`；`apk/app.json` 已启用 `updates.enabled: true`、`checkAutomatically: ON_LOAD`。
- `apk/eas.json` 三个 profile：`preview`（buildType: apk，内部分发）、`production`（app-bundle + autoIncrement）。
- 后端已有 `server/src/routes/version.ts`：`GET /latest`、`POST /check`、AppVersion 全量 CRUD + 公告 CRUD。**但它是旧式"单平台下载"模式**，字段和逻辑需按 §5.2 升级。
- `apk/src/services/api.config.ts`：`BASE_URL = https://api.baizhiji.net/api`，已指向生产。
- Android 包名 `com.baizhiji.zhishuai`，versionCode 当前为 1。

### 4.2 应用内整包更新（下载 + 安装）

这是"换原生壳"的主链路，新增/改造点：

1. **版本检查服务**（`apk/src/services/version.service.ts` 新增）：启动时（可叠加在 `expo-updates` 检查之后）调版本接口，返回 `{ hasUpdate, force, latest }`。
2. **下载组件**（新增更新弹窗）：`expo-file-system` 把 APK 下载到应用私有目录（`FileSystem.cacheDirectory`），显示进度条，支持断点续传；下载完成前校验 SHA-256 与接口下发值一致，防止下载损坏/被篡改。
3. **安装**：Android 7+ 需 `FileProvider`（在 `android/app/src/main/AndroidManifest.xml` 加 `<provider>` 配置 + `res/xml/file_paths.xml`），用 `Intent.ACTION_VIEW` + `content://` URI 拉起系统安装器；`FLAG_GRANT_READ_URI_PERMISSION` 必须带上。
4. **未知来源引导**：Android 8+ 从自有文件安装需用户允许"安装未知应用"。首次触发安装时，检测 `Settings.canDrawOverlays`/`packageManager.canRequestPackageInstalls`，跳系统设置页引导开启一次即可，比让用户去文件管理器装体验好得多。
5. **权限收敛**：`app.json` 现有 `WRITE_EXTERNAL_STORAGE/READ_EXTERNAL_STORAGE` 在新版 Android 上对应用私有目录安装不必要，建议评估移除（安装走 FileProvider 缓存目录，无需存储权限）；`READ_PHONE_STATE` 若非业务必需也建议移除（上架无关但减少权限弹窗）。

### 4.3 keystore 签名一致性（最高优先级，立即执行）

- **铁律**：以后每次打 APK/AAB 必须用**同一个 keystore**。签名不一致 → 覆盖安装失败 → 用户只能卸载重装 → 本地数据全丢，且客户信任崩塌。
- 当前 EAS Build 使用云端生成凭据（`eas credentials`），**必须把 keystore 导出并本地双备份**（密码/别名/两个路径），并在 `eas.json` 的 `cli.credentialsSource` 固定为 `local`（或确认云端凭据已妥善保存）。
- 在仓库 `.gitignore` 排除 keystore 文件；把签名信息记录到安全位置（不放仓库）。

### 4.4 EAS Update 热更新（业务 JS 免装包升级）

- 分工原则：**原生层变化（权限、SDK、原生模块）→ 整包更新（§4.2）；纯 JS/业务逻辑变化 → 热更新**。
- 现有 `eas.json` 已配置 `channel: preview/production`；客户端 `expo-updates` 已启用。需要补两件事：
  1. 确认 `app.json` 的 `updates.url`（默认指向 EAS 云）。**两选项**：
     - 省事方案：继续用 EAS 云托管更新（免费额度内），`eas update --channel production` 即推送；
     - 自托管方案：部署自托管 EAS Update 服务（Docker 镜像 `expo/eas-update-server`），`updates.url` 指向自有域名，与"自建更新源"理念一致，但需要额外一台小服务。
  2. 版本接口下发 `expoUpdateId` 或让 expo-updates 自行按 channel 拉取；热更新与整包更新两条链路的优先级要在启动检查里排好：**先热更新（expo-updates），再查整包（版本接口）**。
- 注意：热更新不能更新原生依赖（expo-file-system 等）。引入新原生能力时必须整包发版。

### 4.5 分发

- 安装包上传 COS 对应目录（如 `install/zhishuai-1.2.0.apk`），downloadUrl 用 CDN 加速域名，避免 2 核 4G 服务器被并发下载打垮。
- 下载链接可加版本号文件名（`zhishuai-1.2.0.apk`）避免 CDN 缓存旧包；`sha256` 一并写在版本接口里。

---

## 五、共享设施：版本管理与更新源

### 5.1 静态资源目录规划（COS bucket）

```
install/zhishuai-1.2.0.apk        # APK 直发下载链接
install/智枢AI-Setup-1.2.0.exe    # 桌面版直发下载链接
updates/desktop/latest.yml        # electron-updater 元数据（+ .exe + .blockmap）
```

三条路径都可直接当"发给客户的下载链接"，也可被客户端自动更新使用。

### 5.2 版本接口升级（改造 `server/src/routes/version.ts`）

现有接口字段不够用，建议统一为：

```
GET /api/version/latest?platform=desktop|android&channel=stable|beta&currentVersion=1.2.0&buildNumber=5

→ {
    success: true,
    data: {
      latestVersion: "1.2.0",
      buildNumber: 5,
      minVersion: "1.1.0",          // 低于此值强制升级
      channel: "stable",
      downloadUrl: "https://cdn.../install/zhishuai-1.2.0.apk",
      sha256: "...",
      size: 45600000,
      changelog: "新增…修复…",
      forceUpdate: false,
      releaseDate: "2026-08-14",
    }
  }
```

配套改造点：

1. **Prisma `AppVersion` 模型扩展**：新增 `channel`（stable/beta）、`sha256`、`size`、`fileUrl` 字段；`platform` 枚举扩展 `desktop`。
2. **channel 灰度**：同一版本可分别以 beta/stable 发布；先发 beta 给少量客户验证，稳定后切 stable，旧客户端点更新即全量拉新。
3. **minVersion 强制升级**：由后台"版本管理"页录入（`web/app/admin/version/` 目前是 `.disabled`，可在本次改造中启用为真实管理页）。
4. **版本比对逻辑**：现有 `POST /check` 的字符串比对可保留，但建议升级为 buildNumber 数值比对 + 语义化版本比对组合。
5. 公告 CRUD（同文件内）保持不动。

### 5.3 灰度与发布流程

1. 新版本上传 COS → 在版本管理页建 `channel=beta` 版本记录（release）→ 发 beta 下载链接给测试客户。
2. 验证通过 → 改 `channel=stable` → 老客户启动即收到更新。
3. 出问题 → 后台把版本标记 `status=draft` 或降级 minVersion，客户端不再提示（或强制回退提示）。

---

## 六、实施路线图

| 阶段 | 内容 | 预估工作量 | 依赖 |
|------|------|-----------|------|
| P0 立即 | 锁定并双备份 keystore；确定 COS bucket 与 CDN 域名 | 0.5 天 | 用户操作 |
| P1 | 版本接口升级（schema + 路由 + 版本管理页启用） | 1–2 天 | P0 |
| P2 | APK 应用内更新（version.service + 下载安装组件 + FileProvider） | 3–5 天 | P1 |
| P3 | 桌面版立项（desktop/ 工程 + electron-builder + electron-updater） | 3–5 天 | P1；P0（如需签名） |
| P4 | EAS Update 热更新落地 + 灰度流程验证 | 2–3 天 | P2 |
| P5 | 验证脚本（`scripts/verify-update.sh`：版本接口 + 静态文件可达性）与文档 | 1 天 | P1–P4 |

合计约 10–16 人日。P1、P2 可并行；P3 独立可并行。

### 各阶段验证口径

- P1：`curl 'https://api.baizhiji.net/api/version/latest?platform=desktop&channel=stable'` 返回预期 JSON；后台能建/改/发布版本。
- P2：打包一个测试 APK（versionCode+1），老包打开后收到更新提示 → 下载进度 → 安装成功 → 新包启动正常；签名一致（同 keystore）可覆盖安装。
- P3：`electron-builder` 产出安装包；把 `latest.yml` + exe 传更新目录；旧壳启动弹出更新并可安装成功。
- P4：`eas update --channel production` 推送后，旧包重启加载新 JS 且无原生改动。
- P5：`bash scripts/verify-update.sh` 全绿。

---

## 七、风险与注意事项

1. **keystore 丢失/不一致（致命）**：一旦签名丢失或换签名，所有存量客户无法覆盖安装。P0 必须落实双备份，并测试一次"跨版本覆盖安装"以确认签名链路。
2. **Windows 代码签名证书（影响转化）**：未签名的 exe 会被 SmartScreen 拦一道，客户体验打折。商用建议购买 OV/EV 证书（EV 消除大部分拦截）。
3. **iOS 无法侧载**：Apple 不允许应用市场外分发。若未来做 iOS，只能 TestFlight（测试）或企业签名（受限）。方案只覆盖 Android + Windows。
4. **带宽**：安装包一律走 CDN，服务器只出 KB 级元数据（latest.yml/JSON）；2 核 4G 的 CVM 扛不住并发下载。
5. **热更新与整包更新的边界**：expo-updates 只更新 JS 包，原生能力变更必须整包发版，否则会静默失败（原生方法不存在）。
6. **灰度事故回滚**：依赖版本管理页的 status/channel 操作，需在 P1 就落地管理 UI，避免发布后无法撤回。

---

## 八、待用户确认的事项

1. **桌面版面向谁**：客户用、代理商用，还是管理员用？（决定壳的默认入口与是否需要"多开不同角色入口"）
2. **是否要 macOS 版**：方案按 Windows 首期；Mac 版只需在 electron-builder 加 darwin target + 自托管 `latest-mac.yml`，但需 Apple Developer 证书与公证。
3. **是否购买代码签名证书**：建议买（OV 起步）。
4. **COS 是否已开通**：未开通则先用服务器静态目录过渡（但客户量上来后必须切 CDN）。
5. **EAS Update 用云还是自托管**：云省事；自托管符合"全链路自建"但多一台服务。

---

## 附：与之前交流内容的对应关系

| 之前交流要点 | 本方案落点 |
|-------------|-----------|
| APK 应用内检测更新 + 自托管下载安装 | §4.2（version.service + FileProvider 安装链路） |
| keystore 签名一致性命门 | §4.3（P0 立即执行） |
| EAS Update 热更新与整包并行 | §4.4（先热更新再查整包） |
| 桌面版 electron-updater 指向自有目录 | §3.5（generic provider + COS 静态目录） |
| 差分更新（blockmap 只下几 MB） | §3.5 |
| 强制升级（minVersion 不可跳过） | §3.5 / §5.2 |
| 下载链接与更新源共用一套设施 | §2.3 / §5.1 |
| 灰度发布（channel=stable|beta） | §5.2 / §5.3 |
| 安装包走 COS+CDN 不压垮 2 核 4G 服务器 | §4.5 / 风险 4 |
| iOS 侧载不可行 | 风险 3 |

---

*本文为方案稿，按用户要求暂不改动任何代码。确认 §8 各项后即可按 §6 路线图实施。*
