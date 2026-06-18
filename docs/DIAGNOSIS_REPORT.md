# 智枢AI 全面诊断报告

**日期**: 2026-06-18
**诊断范围**: 登录入口、页面访问、授权功能

---

## 一、登录入口测试结果

| 入口 | URL | 状态 |
|------|-----|------|
| 主站登录 | https://baizhiji.net/api/auth/login | **成功** (200, token已获取) |
| 主站登录页 | https://baizhiji.net/login | **正常** (200) |
| 简易登录页 | https://baizhiji.net/login-simple | **正常** (200) |
| 注册页 | https://baizhiji.net/register | **正常** (200) |
| 忘记密码 | https://baizhiji.net/auth/forgot-password | **正常** (200) |
| api子域名登录 | https://api.baizhiji.net/api/auth/login | **本地DNS失败** |

**登录账号**: 18601655222 / 20061218 (管理员) - 验证通过

**问题**: 
- `api.baizhiji.net` 在本地 Windows DNS 无法解析（ERR_NAME_NOT_RESOLVED），但服务器端可以正常工作。可能是本地DNS缓存或网络问题。

---

## 二、页面访问测试结果

### 正常页面 (200)
| 页面 | URL |
|------|-----|
| 首页 | / |
| 登录 | /login |
| 简易登录 | /login-simple |
| 注册 | /register |
| 关于 | /about |
| 帮助 | /help |
| 个人资料 | /profile |
| 账户 | /account |
| 通知 | /notifications |
| 客户入口 | /customer |
| Agent入口 | /agent |
| Admin入口 | /admin |
| 营销 | /marketing |
| 电商 | /ecommerce |
| 简介 | /introduction |
| 忘记密码 | /auth/forgot-password |

### 404 页面
| 页面 | URL | 说明 |
|------|-----|------|
| Dashboard | /dashboard | Next.js SSR路由缺失 |
| API测试 | /api-test | Next.js SSR路由缺失 |
| 下载 | /download | Next.js SSR路由缺失 |
| CRM | /crm | Next.js SSR路由缺失 |
| HR | /hr | Next.js SSR路由缺失 |
| 条款 | /terms | Next.js SSR路由缺失 |
| 隐私 | /privacy | Next.js SSR路由缺失 |
| 支付回调 | /payment/callback | Next.js SSR路由缺失 |

**注意**: Next.js SPA页面在浏览器中通过JS路由跳转可能可以正常工作（客户端路由），但直接URL访问返回404是因为SSR没有预渲染这些页面。

---

## 三、API端点测试结果

### 正常工作的API (200/400)
| 端点 | HTTP状态 | 说明 |
|------|---------|------|
| /api/health | 200 | 健康检查 |
| /api/auth/me | 200 | 当前用户 |
| /api/auth/login | 200 | 登录 |
| /api/oauth/platforms | 200 | OAuth平台列表 |
| /api/oauth/accounts | 200 | OAuth授权账号 |
| /api/materials | 200 | 素材库 |
| /api/matrix | 200 | 矩阵账号 |
| /api/notifications | 200 | 通知 |
| /api/account | 200 | 账号管理 |
| /api/company | 200 | 公司信息 |
| /api/announcement | 200 | 系统公告 |
| /api/hot-topics | 200 | 热点话题 |
| /api/orders | 200 | 订单 |
| /api/tickets | 200 | 工单 |
| /api/admin/agents | 200 | Admin代理管理 |
| /api/admin/logs | 200 | Admin操作日志 |
| /api/features | 400 | 功能开关(参数错误) |

### 404 - 服务器代码缺失的路由
| 端点 | 说明 |
|------|------|
| /api/recruitment | 招聘管理 |
| /api/crm | CRM |
| /api/crm-advanced | CRM高级功能 |
| /api/acquisition | 获客管理 |
| /api/data-acquisition | 数据采集 |
| /api/statistics | 统计数据 |
| /api/dashboard-stats | Dashboard统计 |
| /api/ai | AI功能 |
| /api/ai-chat | AI对话 |
| /api/ai-config | AI配置 |
| /api/ai-enhanced | AI增强 |
| /api/ai-workflow | AI工作流 |
| /api/publish | 内容发布 |
| /api/content | 内容管理 |
| /api/content-publish | 内容发布服务 |
| /api/compliance | 合规检查 |
| /api/pipeline | 管线管理 |
| /api/auto-reply | 自动回复 |
| /api/automation | 自动化任务 |
| /api/subscription | 订阅支付 |
| /api/version | 版本检测 |
| /api/amap | 高德地图 |
| /api/share | 分享推荐 |
| /api/employee | 员工管理 |
| /api/export | 数据导出 |
| /api/scripts | 话术模板 |
| /api/referral | 推荐管理 |
| /api/settlement | Agent结算 |
| /api/sms | 短信配置 |
| /api/settings | 设置 |
| /api/users | 用户列表 |
| /api/social | 社交账号 |
| /api/admin/features | Admin功能开关 |
| /api/admin/branding | Admin品牌设置 |
| /api/admin/api-providers | AdminAPI供应商 |
| /api/agent | Agent代理 |
| /api/agent/dashboard | Agent仪表盘 |
| /api/digital-human | 数字人 |
| /api/voice-clone | 声音克隆 |
| /api/code-assistant | 编程助手 |
| /api/media | 媒体服务 |
| /api/token-stats | Token统计 |
| /api/ai-feedback | AI反馈 |
| /api/hotspot | 热点话题 |
| /api/multimodal | 多模态内容 |
| /api/enhancement | 视频增强 |
| /api/material-dedup | 素材去重 |
| /api/report | 报告 |
| /api/version | 版本 |

### 500 错误
| 端点 | 说明 |
|------|------|
| /api/agent/dashboard | Agent仪表盘 |
| /api/oauth/sessions (POST) | 创建OAuth授权会话 |

---

## 四、OAuth/自媒体授权测试结果

| 功能 | 状态 | 说明 |
|------|------|------|
| 平台列表 | **正常** | 6个平台可用：抖音、快手、B站、微博、小红书、视频号 |
| 已授权账号列表 | **正常** | 可以查看已授权的账号 |
| 创建授权会话 | **500错误** | Playwright/Chromium 未安装在服务器上 |
| 授权状态查询 | 未测试 | 需先创建会话 |

---

## 五、核心问题根因分析

### 问题1: 服务器代码版本过旧
**根因**: 服务器 `/www/wwwroot/baizhiji/server/dist/index.js` 是旧版本编译产物，只包含约10个路由模块，而本地最新代码注册了50+个路由模块。

**可能原因**:
1. CI/CD部署路径(`/var/www/zhishuai`)和宝塔面板路径(`/www/wwwroot/baizhiji`)不一致
2. 长时间没有执行代码更新部署
3. 服务器上只手动部署了部分代码

### 问题2: OAuth授权500错误
**根因**: `browser-auth.service.ts` 使用 Playwright 的 Chromium 浏览器自动化，但服务器上可能未安装 `playwright` 包和 Chromium 依赖。

### 问题3: 前端部分页面404
**根因**: Next.js SSR 路由配置问题 - 需要确保 `next.config.js` 配置了正确的 fallback 路由。

---

## 六、修复方案

### 方案A: SSH手动部署（需要SSH访问服务器）

```bash
# 1. SSH登录服务器
ssh root@150.109.60.130

# 2. 检查当前部署目录
pm2 list
pm2 describe zhishuai-api | grep cwd

# 3. 上传最新代码（从本机）
# 在本机运行:
scp -r server/src root@150.109.60.130:/www/wwwroot/baizhiji/server/src/

# 4. 在服务器上重新构建
cd /www/wwwroot/baishiji/server
npm install --production=false
npm run build
npx prisma generate

# 5. 安装Playwright
npm install playwright
npx playwright install chromium

# 6. 重启API服务
pm2 restart zhishuai-api

# 7. 验证
curl http://localhost:3001/api/health
curl http://localhost:3001/api/recruitment
```

### 方案B: GitHub CI/CD部署

1. 修正 `.github/workflows/deploy.yml` 中的部署目录
2. 确保 GitHub Secrets 中配置了 SERVER_PASSWORD
3. 推送代码到 main 分支触发部署

### 方案C: 宝塔面板部署

1. 通过宝塔面板Web界面登录服务器
2. 上传最新 server/src 代码到 `/www/wwwroot/baishiji/server/src/`
3. 在宝塔面板的终端中运行构建和重启命令

---

## 七、需要用户确认的事项

1. **SSH密码**: 当前密码认证失败，需要确认最新的服务器密码
2. **部署目录**: 确认宝塔面板实际使用的代码目录是 `/www/wwwroot/baishiji` 还是 `/var/www/zhishuai`
3. **Playwright**: 是否需要在服务器上安装 Chromium（OAuth授权依赖）
