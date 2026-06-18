#!/bin/bash
# ============================================================
# 智枢AI 一键部署脚本
# 用法: sudo bash deploy.sh [init | update]
#   init   - 首次部署（安装依赖 + 初始化数据库）
#   update - 更新部署（拉取代码 + 重启服务）
# ============================================================

set -e

# ---- 配置 ----
PROJECT_NAME="zhishuai"
DEPLOY_DIR="/var/www/$PROJECT_NAME"
WEB_DIR="$DEPLOY_DIR/web"
SERVER_DIR="$DEPLOY_DIR/server"
LOG_DIR="/var/log/$PROJECT_NAME"
NODE_VERSION="20"
PM2_PROCESS_WEB="zhishuai-web"
PM2_PROCESS_API="zhishuai-api"

# ---- 颜色输出 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# 步骤 0: 系统基础环境检查
# ============================================================
check_system() {
    log_info "===== 检查系统环境 ====="

    if [[ $(id -u) -ne 0 ]]; then
        log_error "请使用 root 或 sudo 运行此脚本"
        exit 1
    fi

    # 安装基础依赖
    log_info "更新系统包..."
    apt-get update -qq

    local pkgs="curl wget git unzip software-properties-common gnupg ca-certificates"
    for pkg in $pkgs; do
        dpkg -l "$pkg" &>/dev/null || apt-get install -y "$pkg" >/dev/null 2>&1
    done

    # Node.js
    if ! command -v node &>/dev/null; then
        log_info "安装 Node.js ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt-get install -y nodejs >/dev/null 2>&1
    fi
    log_info "Node.js 版本: $(node -v)"

    # PM2
    command -v pm2 &>/dev/null || npm install -g pm2 >/dev/null 2>&1
    log_info "PM2 已就绪: $(pm2 -v 2>&1 | head -1)"

    # Nginx
    dpkg -l nginx &>/dev/null || apt-get install -y nginx >/dev/null 2>&1
    log_info "Nginx: $(nginx -v 2>&1)"

    # Certbot (Let's Encrypt)
    command -v certbot &>/dev/null || apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1

    # 创建目录
    mkdir -p "$DEPLOY_DIR" "$LOG_DIR" "/var/www/certbot"
}

# ============================================================
# 步骤 1: DNS 子域名配置提示
# ============================================================
check_dns() {
    log_info "===== DNS 配置检查 ====="

    echo ""
    echo "请在域名管理面板 (DNSPod) 中添加以下记录（如尚未添加）："
    echo ""
    echo "  主机记录    类型    记录值                    TTL"
    echo "  --------    ---     ------------------         ---"
    echo "  @           A       \${DEPLOY_SERVER_IP}        600"
    echo "  www         A       \${DEPLOY_SERVER_IP}        600"
    echo "  api         A       \${DEPLOY_SERVER_IP}        600"
    echo "  app         A       \${DEPLOY_SERVER_IP}        600"
    echo ""
    read -p "$(echo -e ${YELLOW}[确认]${NC} DNS 是否已配置完成? (y/n): )" dns_ok
    if [[ "$dns_ok" != "y" ]]; then
        log_warn "请先配置 DNS 后重新运行"
        exit 1
    fi
}

# ============================================================
# 步骤 2: SSL 证书申请
# ============================================================
setup_ssl() {
    log_info "===== 申请 SSL 证书 ====="

    if [[ ! -f /etc/letsencrypt/live/baizhiji.net/fullchain.pem ]]; then
        certbot --nginx -d baizhiji.net -d www.baizhiji.net -d api.baizhiji.net -d app.baizhiji.net --non-interactive --agree-tos --email admin@baizhiji.net || true
    else
        certbot renew --quiet
    fi
    log_info "SSL 证书已就绪"
}

# ============================================================
# 步骤 3: 部署 Server (API)
# ============================================================
deploy_server() {
    log_info "===== 部署 API 服务 ====="
    
    cd "$SERVER_DIR"

    # 安装依赖
    if [[ ! -d node_modules ]]; then
        log_info "安装服务端依赖..."
        npm install --production=false
    else
        log_info "依赖已存在，跳过安装"
    fi

    # 构建
    log_info "构建 TypeScript..."
    npm run build

    # 数据库迁移
    log_info "执行数据库迁移..."
    npx prisma migrate deploy 2>/dev/null || {
      log_warn "数据库迁移失败，尝试 prisma db push..."
      npx prisma db push 2>/dev/null || true
    }
    
    log_info "执行 Seed 数据..."
    ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>/dev/null || true

    # 使用 PM2 管理
    log_info "启动 API 服务 (PM2)..."

    # 写 ecosystem 文件
    cat > "$SERVER_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '/var/www/zhishuai/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
  }],
};
EOF

    pm2 delete "$PM2_PROCESS_API" 2>/dev/null || true
    pm2 start "$SERVER_DIR/ecosystem.config.cjs" 2>&1 | tail -1
}

# ============================================================
# 步骤 4.1: 上传代码到服务器 (本地执行)
# ============================================================
upload_code() {
    # 从环境变量读取，避免敏感信息硬编码
    local SERVER_IP="${DEPLOY_SERVER_IP:-}"
    local SERVER_USER="${DEPLOY_SERVER_USER:-root}"
    local SERVER_PASS="${DEPLOY_SERVER_PASS:-}"
    
    if [[ -z "$SERVER_IP" || -z "$SERVER_PASS" ]]; then
        log_error "请设置环境变量: DEPLOY_SERVER_IP, DEPLOY_SERVER_PASS"
        log_error "示例: export DEPLOY_SERVER_IP=1.2.3.4 DEPLOY_SERVER_PASS=yourpassword"
        exit 1
    fi
    
    log_info "===== 上传代码到服务器 ====="
    
    # 安装 sshpass (如需要)
    command -v sshpass &>/dev/null || apt-get install -y sshpass >/dev/null 2>&1
    
    # 获取项目根目录 (deploy/ 的上一级)
    local PROJECT_ROOT
    PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
    
    log_info "项目目录: $PROJECT_ROOT"
    
    # 创建远程目录
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
        "mkdir -p $DEPLOY_DIR"
    
    # 上传 server 目录
    log_info "上传 server/ ..."
    sshpass -p "$SERVER_PASS" rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude '.prisma' \
        "$PROJECT_ROOT/server/" "$SERVER_USER@$SERVER_IP:$SERVER_DIR/"
    
    # 上传 web 目录
    log_info "上传 web/ ..."
    sshpass -p "$SERVER_PASS" rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.turbo' \
        "$PROJECT_ROOT/web/" "$SERVER_USER@$SERVER_IP:$WEB_DIR/"
    
    # 上传 deploy 目录
    log_info "上传 deploy/ ..."
    sshpass -p "$SERVER_PASS" rsync -avz --progress \
        "$PROJECT_ROOT/deploy/" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/deploy/"
    
    log_info "代码上传完成!"
}

# ============================================================
# 步骤 4: 部署 Web (前端)
# ============================================================
deploy_web() {
    log_info "===== 部署 Web 前端 ====="

    cd "$WEB_DIR"

    # 安装依赖
    if [[ ! -d node_modules ]]; then
        log_info "安装前端依赖..."
        npm install
    fi

    # 生产构建
    log_info "Next.js 生产构建..."
    NODE_ENV=production npm run build

    # PM2 启动 Next.js
    log_info "启动 Web 服务 (PM2)..."

    cat > "$WEB_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'zhishuai-web',
    script: './node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/zhishuai/web',
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
EOF

    pm2 delete "$PM2_PROCESS_WEB" 2>/dev/null || true
    pm2 start "$WEB_DIR/ecosystem.config.cjs" 2>&1 | tail -1
}

# ============================================================
# 步骤 5: Nginx 配置
# ============================================================
setup_nginx() {
    log_info "===== 配置 Nginx ====="

    cp "$DEPLOY_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/baizhiji.net"
    ln -sf /etc/nginx/sites-available/baizhiji.net /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    nginx -t && systemctl reload nginx
    log_info "Nginx 配置生效"
}

# ============================================================
# 步骤 6: PM2 开机自启
# ============================================================
setup_pm2_startup() {
    log_info "===== 设置 PM2 开机自启 ====="
    pm2 save
    pm2 startup systemd -u root --hp /root 2>/dev/null || true
    systemctl enable pm2-root 2>/dev/null || true
}

# ============================================================
# 步骤 7: 定时任务 (SSL 续期 + 日志轮转)
# ============================================================
setup_cron() {
    log_info "===== 设置定时任务 ====="
    
    # SSL 自动续期 (每周一凌晨3点)
    crontab -l 2>/dev/null | grep -v "certbot renew" > /tmp/mycron || true
    echo "0 3 * * 1 certbot renew --quiet && systemctl reload nginx" >> /tmp/mycron
    crontab /tmp/mycron
    rm /tmp/mycron

    # 日志清理 (每月1号清理30天前日志)
    crontab -l 2>/dev/null | grep -v "find.*$LOG_DIR" > /tmp/mycron || true
    echo "0 2 1 * * find $LOG_DIR -name '*.log' -mtime +30 -delete" >> /tmp/mycron
    crontab /tmp/mycron
    rm /tmp/mycron
}

# ============================================================
# 主流程
# ============================================================
main() {
    ACTION=${1:-update}

    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║          智枢AI SaaS 一键部署工具            ║"
    echo "║           baizhiji.net                      ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""

    case "$ACTION" in
        init)
            check_system
            check_dns
            setup_ssl
            deploy_server
            deploy_web
            setup_nginx
            setup_pm2_startup
            setup_cron
            ;;
        update)
            deploy_server
            deploy_web
            setup_nginx
            pm2 save
            ;;
        upload)
            upload_code
            ;;
        *)
            echo "用法: sudo bash deploy.sh [init|update|upload]"
            echo "  init   - 首次完整部署"
            echo "  update - 更新代码并重启服务"
            echo "  upload - 上传代码到服务器"
            exit 1
            ;;
    esac

    echo ""
    log_info "===== 部署完成！====="
    echo ""
    echo "  🌐 Web 前端: https://baizhiji.net"
    echo "  🔧 API 地址: https://api.baizhiji.net/api"
    echo "  📱 APK Deep Link: baizhiai://"
    echo ""
    echo "  管理员账号: 请查看 .env 或部署文档"
    echo ""
    echo "  PM2 状态: pm2 status"
    echo "  查看日志: pm2 logs zhishuai-api / zhishuai-web"
    echo ""
}

main "$@"
