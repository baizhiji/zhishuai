#!/bin/bash
<<<<<<< HEAD
# 智枢AI SaaS 系统部署脚本

echo "=========================================="
echo "智枢AI SaaS 系统 - 服务器部署脚本"
echo "=========================================="

# 进入项目目录
cd /home/ubuntu/apk

# 拉取最新代码
echo "[1/6] 拉取最新代码..."
git pull origin main

# 安装后端依赖
echo "[2/6] 安装后端依赖..."
cd server
pnpm install

# 生成Prisma Client
echo "[3/6] 生成Prisma Client..."
pnpm prisma generate

# 编译后端
echo "[4/6] 编译后端..."
pnpm build

# 编译前端
echo "[5/6] 编译前端..."
cd ../web
pnpm build

# 重启服务
echo "[6/6] 重启PM2服务..."
pm2 restart all

echo "=========================================="
echo "部署完成!"
echo "=========================================="

# 显示服务状态
pm2 status
=======
# 智枢 AI SaaS 系统 - 一键部署脚本

set -e

echo "========================================="
echo "  智枢 AI SaaS 系统 - 一键部署"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKEND_PORT=3001
WEB_PORT=3000
API_BASE_URL="http://43.129.16.148:3001/api"

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}[1/6] 检查依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}需要安装 Node.js${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}需要安装 npm${NC}"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo -e "${YELLOW}Nginx 未安装，如需 Web 服务请先安装${NC}"; }

echo -e "${GREEN}[2/6] 安装后端依赖...${NC}"
cd /www/zhishuai/server
npm install

echo -e "${GREEN}[3/6] 生成 Prisma 客户端...${NC}"
npx prisma generate

echo -e "${GREEN}[4/6] 配置环境变量...${NC}"
cat > /www/zhishuai/server/.env << ENVEOF
DATABASE_URL="postgresql://zhishuai:YourPassword@localhost:5432/zhishuai"
JWT_SECRET="zhishuai-jwt-secret-key-change-in-production"
PORT=$BACKEND_PORT
NODE_ENV=production
API_BASE_URL=$API_BASE_URL
ENVEOF

echo -e "${GREEN}[5/6] 启动后端服务...${NC}"
pm2 delete zhishuai-api 2>/dev/null || true
pm2 start npm --name "zhishuai-api" -- start
pm2 save

echo -e "${GREEN}[6/6] 配置 Nginx...${NC}"
if command -v nginx >/dev/null 2>&1; then
    cp /www/zhishuai/deploy/nginx.conf /etc/nginx/sites-available/zhishuai
    ln -sf /etc/nginx/sites-available/zhishuai /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}Nginx 配置完成${NC}"
else
    echo -e "${YELLOW}跳过 Nginx 配置${NC}"
fi

echo ""
echo -e "${GREEN}========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo -e "后端服务: ${API_BASE_URL}"
echo -e "后端端口: $BACKEND_PORT"
echo ""
echo -e "请确保配置以下环境变量:"
echo -e "  - 数据库连接信息"
echo -e "  - JWT_SECRET"
echo -e "  - 阿里云百炼 API Key"
echo -e "  - 腾讯云 TokenHub API Key"
echo ""
echo -e "${GREEN}查看服务状态: pm2 status${NC}"
echo -e "${GREEN}查看日志: pm2 logs zhishuai-api${NC}"
echo "========================================="
>>>>>>> 962968886be726cd434c792933b5515366d34518
