#!/bin/bash
# 智枢AI SaaS 系统 - 一键部署脚本
# 适用环境: 腾讯云 CVM (Ubuntu 22.04) + TDSQL-C MySQL
# 使用: sudo bash deploy/deploy.sh [--skip-build] [--skip-db]

set -e

echo "========================================="
echo "  智枢AI SaaS 系统 - 一键部署"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置
APP_DIR=/var/www/zhishuai
SERVER_DIR=$APP_DIR/server
WEB_DIR=$APP_DIR/web
BACKEND_PORT=3001
WEB_PORT=3000
SKIP_BUILD=false
SKIP_DB=false
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --skip-db) SKIP_DB=true ;;
  esac
done

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}请使用 sudo 运行此脚本${NC}"
  exit 1
fi

if [ ! -d "$SERVER_DIR" ]; then
  echo -e "${RED}未找到项目目录: $SERVER_DIR，请先将代码部署到服务器${NC}"
  exit 1
fi

echo -e "${GREEN}[1/7] 检查依赖...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}需要安装 Node.js${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}需要安装 npm${NC}"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 pm2，尝试全局安装...${NC}"; npm install -g pm2; }
command -v mysqldump >/dev/null 2>&1 || { echo -e "${YELLOW}未找到 mysqldump，数据库备份脚本将不可用${NC}"; }

echo -e "${GREEN}[2/7] 检查环境变量...${NC}"
if [ ! -f "$SERVER_DIR/.env" ]; then
  echo -e "${RED}缺少 $SERVER_DIR/.env，请根据 .env.example 配置后重试${NC}"
  exit 1
fi

# 从 .env 提取数据库连接(用于后续 db push)
DB_URL=$(grep -E '^DATABASE_URL=' "$SERVER_DIR/.env" | head -1 | cut -d'=' -f2- | tr -d '"')
if [ -z "$DB_URL" ]; then
  echo -e "${RED}.env 中缺少 DATABASE_URL${NC}"
  exit 1
fi

echo -e "${GREEN}[3/7] 安装后端依赖...${NC}"
# 确保桌面安装包下载目录存在
mkdir -p "$APP_DIR/downloads"
cd "$SERVER_DIR"
npm install --omit=dev || npm install

if [ "$SKIP_DB" = false ]; then
  echo -e "${GREEN}[4/7] 同步数据库结构(prisma db push)...${NC}"
  npx prisma generate
  npx prisma db push --skip-generate
else
  echo -e "${YELLOW}[4/7] 跳过数据库同步${NC}"
  npx prisma generate
fi

if [ "$SKIP_BUILD" = false ]; then
  echo -e "${GREEN}[5/7] 构建后端(TypeScript)...${NC}"
  npm run build 2>/dev/null || { echo -e "${YELLOW}无 build 脚本，跳过编译${NC}"; }
fi

echo -e "${GREEN}[6/7] 启动/重启后端服务...${NC}"
pm2 restart zhishuai-api --update-env 2>/dev/null || pm2 start npm --name "zhishuai-api" -- start
pm2 save

# 部署 Web 前端(如存在；V3.0 后 Web 管理端已下线，此步骤通常跳过)
if [ -f "$WEB_DIR/package.json" ]; then
  echo -e "${GREEN}[7/7] 构建并重启 Web 前端...${NC}"
  cd "$WEB_DIR"
  npm install --omit=dev || npm install
  if [ "$SKIP_BUILD" = false ]; then
    npx next build || echo -e "${YELLOW}Next.js 构建失败，请检查 WEB_DIR=$WEB_DIR 的代码${NC}"
  fi
  # V3.0 静态导出模式(output: export)：必须用 serve 托管 out/，不能用 next start
  pm2 restart zhishuai-web --update-env 2>/dev/null || pm2 start node_modules/.bin/serve --name "zhishuai-web" -- -s out -l 3000
  pm2 save
else
  echo -e "${YELLOW}[7/7] 未检测到 Web 前端($WEB_DIR)，跳过${NC}"
fi

# 部署验证
echo ""
echo -e "${GREEN}========================================="
echo "  部署完成！开始验证..."
echo "========================================="
sleep 3
if [ -f "$APP_DIR/scripts/verify-login.sh" ]; then
  bash "$APP_DIR/scripts/verify-login.sh" || echo -e "${YELLOW}验证脚本执行完毕(请检查输出)${NC}"
fi

echo ""
echo -e "${GREEN}服务状态: pm2 status${NC}"
echo -e "${GREEN}后端日志: pm2 logs zhishuai-api${NC}"
echo -e "${GREEN}前端日志: pm2 logs zhishuai-web${NC}"
echo -e "${GREEN}数据库备份: sudo bash $APP_DIR/scripts/backup-db.sh${NC}"
echo -e "${GREEN}健康监控: bash $APP_DIR/scripts/monitor.sh${NC}"
echo "========================================="
