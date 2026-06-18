#!/bin/bash
# ============================================================
# 智枢 AI SaaS 服务器端一键修复脚本
# 登录服务器后执行此脚本
# 用法: bash server_fix.sh
# ============================================================

set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║     智枢 AI SaaS 服务器端修复脚本          ║"
echo "║     baizhiji.net                           ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# ---- 第1步：确认部署目录 ----
echo "===== 第1步：确认部署目录 ====="
DEPLOY_DIR=""

# 检查多个可能的目录
for dir in "/var/www/zhishuai" "/www/zhishuai" "/www/wwwroot/baizhiji" "/www/wwwroot/zhishuai"; do
    if [ -d "$dir/server/dist" ]; then
        echo "找到代码目录: $dir"
        DEPLOY_DIR="$dir"
        break
    fi
done

# 如果没找到，查看 PM2 进程的工作目录
if [ -z "$DEPLOY_DIR" ]; then
    echo "未找到已知目录，从 PM2 获取..."
    API_CWD=$(pm2 show zhishuai-api 2>/dev/null | grep "exec cwd" | awk '{print $NF}' || echo "")
    if [ -n "$API_CWD" ]; then
        # PM2 cwd 是 server 子目录，取上一级
        DEPLOY_DIR=$(dirname "$API_CWD")
        echo "从 PM2 获取的部署目录: $DEPLOY_DIR"
    fi
fi

if [ -z "$DEPLOY_DIR" ]; then
    echo "错误：无法确认部署目录！请手动设置："
    echo "  export DEPLOY_DIR=/your/deploy/path"
    echo "  然后重新运行此脚本"
    exit 1
fi

echo "确认部署目录: $DEPLOY_DIR"
echo ""

# ---- 第2步：确认当前代码版本 ----
echo "===== 第2步：当前代码版本 ====="
echo "API dist/index.js 行数: $(wc -l $DEPLOY_DIR/server/dist/index.js 2>/dev/null || echo '文件不存在')"
echo "API dist/ 文件数: $(ls $DEPLOY_DIR/server/dist/ 2>/dev/null | wc -l || echo '0')"
echo "PM2 进程列表:"
pm2 list
echo ""

# ---- 第3步：拉取最新代码 ----
echo "===== 第3步：更新代码 ====="
cd "$DEPLOY_DIR"

if [ -d ".git" ]; then
    echo "有 git 仓库，拉取最新代码..."
    git fetch origin
    git reset --hard origin/main
    echo "代码更新完成"
else
    echo "没有 git 仓库，需要手动上传代码（从本机 SCP 或宝塔面板）"
    echo ""
    echo "请在本地 PowerShell 执行以下命令上传代码："
    echo ""
    echo "  # 打包代码（本地执行）"
    echo "  cd c:\Users\Administrator\zhishuai"
    echo "  tar -czf server_dist.tar.gz server/dist/ server/prisma/ server/package.json server/package-lock.json server/.env"
    echo "  tar -czf web_dist.tar.gz web/.next/ web/package.json web/package-lock.json web/public/"
    echo ""
    echo "  # 上传到服务器（本地执行，需要 SSH 密码）"
    echo "  scp server_dist.tar.gz root@150.109.60.130:/tmp/"
    echo "  scp web_dist.tar.gz root@150.109.60.130:/tmp/"
    echo ""
    echo "  # 然后在服务器上解压（本脚本会自动处理）"
    echo ""
    echo "如果无法 SCP，请通过宝塔面板文件管理器上传。"
    echo ""
    
    # 检查 /tmp 是否有上传的文件
    if [ -f "/tmp/server_dist.tar.gz" ]; then
        echo "发现 /tmp/server_dist.tar.gz，正在解压..."
        cd "$DEPLOY_DIR/server"
        tar -xzf /tmp/server_dist.tar.gz --overwrite
        rm -f /tmp/server_dist.tar.gz
        echo "Server 代码已更新"
    fi
    
    if [ -f "/tmp/web_dist.tar.gz" ]; then
        echo "发现 /tmp/web_dist.tar.gz，正在解压..."
        cd "$DEPLOY_DIR/web"
        tar -xzf /tmp/web_dist.tar.gz --overwrite
        rm -f /tmp/web_dist.tar.gz
        echo "Web 代码已更新"
    fi
fi

echo ""

# ---- 第4步：构建 Server ----
echo "===== 第4步：构建 Server API ====="
cd "$DEPLOY_DIR/server"

echo "安装依赖..."
npm install --production=false

echo "生成 Prisma..."
npx prisma generate

echo "构建 TypeScript..."
npm run build

echo "数据库迁移..."
npx prisma migrate deploy 2>/dev/null || {
    echo "数据库迁移失败，尝试 prisma db push..."
    npx prisma db push 2>/dev/null || true
}

echo ""

# ---- 第5步：安装 Playwright（修复 OAuth 500） ----
echo "===== 第5步：安装 Playwright + Chromium ====="
npx playwright install chromium
npx playwright install-deps chromium 2>/dev/null || {
    echo "Playwright 依赖安装可能需要手动处理..."
    apt-get install -y libnss3 libnspr3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr1 libgbm1 libpango-1.0-0 libcairo2 libasound2 libxshmfence1 2>/dev/null || true
}

echo ""

# ---- 第6步：重启 API 服务 ----
echo "===== 第6步：重启 API 服务 ====="
pm2 delete zhishuai-api 2>/dev/null || true

# 写 ecosystem 文件
cat > "$DEPLOY_DIR/server/ecosystem.config.cjs" << EOFECO
module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '$DEPLOY_DIR/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu:/usr/lib',
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
  }],
};
EOFECO

pm2 start "$DEPLOY_DIR/server/ecosystem.config.cjs"
echo "API 服务已重启"
echo ""

# ---- 第7步：构建 Web 前端 ----
echo "===== 第7步：构建 Web 前端 ====="
cd "$DEPLOY_DIR/web"

echo "安装依赖..."
npm install

echo "Next.js 生产构建..."
NODE_ENV=production npm run build

echo ""

# ---- 第8步：重启 Web 服务 ----
echo "===== 第8步：重启 Web 服务 ====="
pm2 delete zhishuai-web 2>/dev/null || true

cat > "$DEPLOY_DIR/web/ecosystem.config.cjs" << EOFECO
module.exports = {
  apps: [{
    name: 'zhishuai-web',
    script: './node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '$DEPLOY_DIR/web',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/web-error.log',
    out_file: '/var/log/zhishuai/web-out.log',
    time: true,
  }],
};
EOFECO

pm2 start "$DEPLOY_DIR/web/ecosystem.config.cjs"
echo "Web 服务已重启"
echo ""

# ---- 第9步：检查 Nginx 配置 ----
echo "===== 第9步：检查 Nginx 配置 ====="

# 检查 api.baizhiji.net 是否有配置
API_NGINX=$(ls /etc/nginx/sites-enabled/api* 2>/dev/null || ls /www/server/panel/vhost/nginx/api* 2>/dev/null || echo "")

if [ -z "$API_NGINX" ]; then
    echo "警告：api.baizhiji.net 没有单独的 Nginx 配置"
    echo "当前所有 API 通过 baizhiji.net/api/ 访问"
    echo ""
    echo "如果要启用 api.baizhiji.net，请确保："
    echo "  1. DNS A 记录：api -> 150.109.60.130"
    echo "  2. Nginx 配置了 api.baizhiji.net server block"
    echo "  3. SSL 证书覆盖 api.baizhiji.net"
else
    echo "api.baizhiji.net Nginx 配置存在: $API_NGINX"
fi

# 检查 Nginx 配置中的路径是否与实际部署目录一致
NGINX_ROOT=$(grep -r "root\|alias" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "#" | head -5 || echo "")
echo "Nginx 配置路径:"
echo "$NGINX_ROOT"

# 验证 Nginx
nginx -t && systemctl reload nginx || echo "Nginx 配置有问题，请检查！"
echo ""

# ---- 第10步：保存 PM2 并验证 ----
echo "===== 第10步：保存 PM2 并验证 ====="
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "等待服务启动..."
sleep 8

echo "===== 验证结果 ====="
echo ""
echo "API 健康检查:"
curl -sf http://localhost:3001/api/health && echo "" || echo "API 健康检查失败!"
echo ""

echo "Web 健康检查:"
curl -sf -o /dev/null -w "HTTP %{http_code}" http://localhost:3000 && echo "" || echo "Web 健康检查失败!"
echo ""

echo "PM2 进程状态:"
pm2 list
echo ""

# 测试关键 API 路由
echo "关键 API 路由测试（无认证，GET 请求）:"
for ep in "/api/health" "/api/version" "/api/oauth/platforms" "/api/hot-topics" "/api/auth/me" "/api/recruitment" "/api/crm" "/api/statistics" "/api/dashboard-stats" "/api/ai" "/api/marketing" "/api/acquisition" "/api/materials"; do
    STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3001$ep 2>/dev/null || echo "ERR")
    echo "  [$STATUS] $ep"
done

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║     部署修复完成！                          ║"
echo "║                                             ║"
echo "║  Web 前端: https://baizhiji.net            ║"
echo "║  API 地址: https://baizhiji.net/api/       ║"
echo "║                                             ║"
echo "║  管理命令:                                  ║"
echo "║    pm2 status                               ║"
echo "║    pm2 logs zhishuai-api                    ║"
echo "║    pm2 logs zhishuai-web                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "后续验证：从本地 PowerShell 执行验证命令"
echo "  见 docs/MANUAL_DEPLOY_GUIDE.md 第六步"
