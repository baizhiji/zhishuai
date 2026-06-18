# 智枢 AI SaaS 手动部署操作指南

## 问题诊断摘要

### 已发现的问题

| 问题 | 状态 | 严重程度 |
|------|------|----------|
| 主站登录入口 (`/api/auth/login`) | 正常 | - |
| api 子域名登录 (`api.baizhiji.net`) | DNS 不通（本地） | 中 |
| 大量 API 路由 404（约40+个） | 服务器代码版本过旧 | 严重 |
| 前端页面 404（dashboard, crm 等） | SSR 路由缺失 | 严重 |
| OAuth 创建授权会话 500 | 服务器缺少 Playwright | 高 |
| SSH 从本机无法连接 | 认证失败 | 阻塞 |

### 核心原因

服务器上运行的 API 代码是**旧版本**，本地 `index.ts` 注册了约 59 个路由模块，但服务器上只有约 10 个能正常响应 200。同时，部署目录配置混乱：
- CI/CD (`deploy.yml`) 配置部署到 `/var/www/zhishuai`
- `nginx.conf`（较新版本）指向 `/var/www/zhishuai` 和 `/var/www/baizhiji`
- `nginx-baizhiji.conf`（服务器实际使用）指向 `/www/zhishuai/web`
- 宝塔面板可能用 `/www/wwwroot/` 目录

---

## 第一步：登录服务器确认部署目录

SSH 登录后，执行以下命令确认实际部署路径：

```bash
# 查看当前 PM2 进程的工作目录
pm2 show zhishuai-api 2>/dev/null | grep "exec cwd" || pm2 show 0 | grep "exec cwd"
pm2 show zhishuai-web 2>/dev/null | grep "exec cwd" || pm2 show 1 | grep "exec cwd"

# 查看当前 Nginx 配置指向哪里
grep -r "root\|proxy_pass\|alias" /etc/nginx/sites-enabled/ | head -20

# 查看宝塔面板的 Nginx 配置（如果有）
cat /www/server/panel/vhost/nginx/*.conf 2>/dev/null | head -30
ls /www/server/panel/vhost/nginx/ 2>/dev/null

# 查看实际的代码目录
ls -la /var/www/zhishuai/ 2>/dev/null && echo "=== /var/www/zhishuai EXISTS ===" || echo "=== /var/www/zhishuai NOT FOUND ==="
ls -la /www/zhishuai/ 2>/dev/null && echo "=== /www/zhishuai EXISTS ===" || echo "=== /www/zhishuai NOT FOUND ==="
ls -la /www/wwwroot/baizhiji/ 2>/dev/null && echo "=== /www/wwwroot/baizhiji EXISTS ===" || echo "=== /www/wwwroot/baizhiji NOT FOUND ==="

# 查看 API 进程的实际工作目录
ps aux | grep "zhishuai-api" | grep -v grep
ls -la /proc/$(pgrep -f "zhishuai-api" | head -1)/cwd 2>/dev/null
```

请把以上命令的输出截图或复制给我，我据此确认正确的部署目录。

---

## 第二步：根据确认的目录选择部署方案

### 方案 A：如果部署目录是 `/var/www/zhishuai`（与 CI/CD 一致）

```bash
cd /var/www/zhishuai

# 拉取最新代码（如果有 git）
git pull origin main || true

# 或者手动更新（没有 git 时）
# 需要从本机上传代码，见下方"上传代码"部分

# 构建 server
cd server
npm install
npx prisma generate
npm run build

# 数据库迁移
npx prisma migrate deploy || npx prisma db push

# 重启 API
pm2 restart zhishuai-api || pm2 start dist/index.js --name zhishuai-api

# 构建 web
cd ../web
npm install
npm run build

# 重启 Web
pm2 restart zhishuai-web || pm2 start node_modules/.bin/next --name zhishuai-web -- start -p 3000

# 安装 Playwright（修复 OAuth 500 错误）
cd ../server
npx playwright install chromium

# 重启 Nginx
nginx -t && systemctl reload nginx

# 保存 PM2
pm2 save
```

### 方案 B：如果部署目录是 `/www/zhishuai`（宝塔面板）

```bash
# 先确认宝塔目录结构
ls -la /www/zhishuai/server/dist/ 2>/dev/null
ls -la /www/zhishuai/web/.next/ 2>/dev/null

# 如果 /www/zhishuai 不存在或代码过旧，需要从 /var/www/zhishuai 复制或重新部署
# 选项1：创建符号链接让两个路径指向同一代码
ln -sfn /var/www/zhishuai /www/zhishuai

# 选项2：直接在 /www/zhishuai 目录操作
cd /www/zhishuai
# ... 同方案 A 的构建步骤
```

---

## 第三步：从本机上传最新代码到服务器

### 方法 1：SCP 上传（需要 SSH 密码/密钥能工作）

在本地 PowerShell 执行：

```powershell
# 先本地构建 server
cd c:\Users\Administrator\zhishuai\server
npm install
npx prisma generate
npx tsc

# 先本地构建 web
cd c:\Users\Administrator\zhishuai\web
npm install
npm run build

# 打包 server（排除 node_modules/src）
cd c:\Users\Administrator\zhishuai
tar -czf server.tar.gz --exclude='node_modules' --exclude='.git' --exclude='src' server/

# 打包 web（排除 node_modules/src）
tar -czf web.tar.gz --exclude='node_modules' --exclude='.git' --exclude='src' web/

# 上传到服务器
scp server.tar.gz root@150.109.60.130:/tmp/
scp web.tar.gz root@150.109.60.130:/tmp/
scp deploy/deploy.sh root@150.109.60.130:/tmp/
```

### 方法 2：通过宝塔面板文件管理器上传

1. 登录宝塔面板（通常是 http://150.109.60.130:8888）
2. 进入文件管理器
3. 导航到部署目录（如 `/var/www/zhishuai/` 或 `/www/zhishuai/`）
4. 删除旧的 `server/dist/` 和 `web/.next/` 目录
5. 上传本地构建好的文件

### 方法 3：通过 Git（服务器上已有 git repo）

```bash
# 在服务器上
cd /var/www/zhishuai  # 或确认的部署目录
git fetch origin
git reset --hard origin/main
# 然后执行构建步骤
```

---

## 第四步：修复 OAuth 授权 500 错误

OAuth 授权使用 Playwright 进行浏览器自动化登录。服务器上需要安装 Chromium：

```bash
# 在服务器上执行
cd /var/www/zhishuai/server  # 或确认的部署目录
npx playwright install chromium
npx playwright install-deps chromium

# 验证安装
npx playwright --version

# 重启 API 服务
pm2 restart zhishuai-api
```

---

## 第五步：修复 api.baizhiji.net DNS 问题

在服务器上，`api.baizhiji.net` 应该通过 Nginx 配置来代理。检查：

```bash
# 查看是否有 api 子域名的 Nginx 配置
ls /etc/nginx/sites-enabled/ | grep api
cat /etc/nginx/sites-enabled/api* 2>/dev/null

# 查看宝塔面板是否有 api 子域名配置
ls /www/server/panel/vhost/nginx/ | grep api
cat /www/server/panel/vhost/nginx/api* 2>/dev/null

# 检查 DNS 解析（在服务器上）
dig api.baizhiji.net +short
nslookup api.baizhiji.net

# 从本地测试 DNS
# 在 PowerShell 执行：
# nslookup api.baizhiji.net
```

如果 DNS 指向正确 IP，确保 Nginx 有 api 子域名配置（参考 `deploy/nginx.conf` 中的 api.baizhiji.net server block）。

---

## 第六步：验证部署成功

部署完成后，在服务器上执行验证：

```bash
# 检查 PM2 进程状态
pm2 status

# 检查 API 健康端点
curl -s http://localhost:3001/api/health

# 检查 API 路由数量
curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/oauth/platforms -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/recruitment -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/crm -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/statistics -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/ai -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/marketing -H "Authorization: Bearer <token>"
curl -s http://localhost:3001/api/acquisition -H "Authorization: Bearer <token>"

# 检查前端
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login

# 检查 OAuth 授权
curl -s -X POST http://localhost:3001/api/oauth/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"platform":"douyin"}'
```

从外部验证（在 PowerShell 执行）：

```powershell
# 登录获取新 token
$loginResult = Invoke-RestMethod -Uri "https://baizhiji.net/api/auth/login" -Method POST -ContentType "application/json" -Body '{"phone":"18601655222","password":"20061218"}'
$token = $loginResult.token

# 测试关键 API
$h = @{ "Authorization" = "Bearer $token" }

# 测试之前 404 的路由
$endpoints = @("/api/recruitment","/api/crm","/api/statistics","/api/ai","/api/marketing","/api/acquisition","/api/dashboard-stats","/api/publish","/api/subscription")
foreach($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri "https://baizhiji.net$ep" -Headers $h -UseBasicParsing -TimeoutSec 5
        Write-Host "[$($r.StatusCode)] $ep - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "[$code] $ep - FAILED"
    }
}

# 测试 OAuth 授权
$r = Invoke-RestMethod -Uri "https://baizhiji.net/api/oauth/sessions" -Method POST -Headers $h -ContentType "application/json" -Body '{"platform":"douyin"}'
$r | ConvertTo-Json -Depth 3

# 测试前端页面
$pages = @("/","/login","/dashboard","/crm","/hr","/marketing")
foreach($p in $pages) {
    try {
        $r = Invoke-WebRequest -Uri "https://baizhiji.net$p" -UseBasicParsing -TimeoutSec 5
        Write-Host "[$($r.StatusCode)] $p - OK"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "[$code] $p - FAILED"
    }
}
```

---

## 关键注意事项

1. **部署目录必须统一**：确保 Nginx 配置、PM2 cwd、代码目录三者一致。这是导致大量 404 的根本原因。

2. **数据库迁移**：更新代码后需要执行 `npx prisma migrate deploy`，新路由可能依赖新的数据库表。

3. **环境变量**：服务器上的 `.env` 文件需要包含所有必需的配置（特别是 AI 服务密钥、OAuth 凭证等）。

4. **Playwright 安装**：OAuth 授权 500 错误的修复需要安装 Playwright + Chromium，这在服务器上需要约 300MB 空间。

5. **PM2 日志**：部署后检查日志确认没有错误：
   ```bash
   pm2 logs zhishuai-api --lines 50
   pm2 logs zhishuai-web --lines 50
   ```

6. **api.baizhiji.net**：如果 DNS 配置正确，需要确保 Nginx 有对应的 server block 配置。否则所有 API 只能通过 `baizhiji.net/api/` 访问。

---

## 快速一键部署命令（确认目录后执行）

假设部署目录确认为 `$DEPLOY_DIR`：

```bash
DEPLOY_DIR="/var/www/zhishuai"  # 或 "/www/zhishuai"，根据第一步确认结果修改

cd $DEPLOY_DIR

# 拉取最新代码（有 git 时）
git fetch origin && git reset --hard origin/main

# 构建并部署 Server
cd server
npm install --production=false
npx prisma generate
npm run build
npx prisma migrate deploy
npx playwright install chromium
npx playwright install-deps chromium
pm2 restart zhishuai-api

# 构建并部署 Web
cd ../web
npm install
npm run build
pm2 restart zhishuai-web

# 重启 Nginx
nginx -t && systemctl reload nginx
pm2 save

# 验证
sleep 5
curl -sf http://localhost:3001/api/health && echo "API OK"
curl -sf -o /dev/null -w "Web: %{http_code}\n" http://localhost:3000
```
