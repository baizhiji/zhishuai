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
BACKEND_PORT=3001
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
# 中文字体（视频 AIGC 角标【智枢AI生成】drawtext 渲染必需）
if command -v fc-list >/dev/null 2>&1; then
  if ! fc-list :lang=zh 2>/dev/null | grep -qiE 'noto sans cjk|wqy|droid sans fallback'; then
    echo -e "${YELLOW}安装中文字体(fonts-noto-cjk)...${NC}"
    apt-get install -y fonts-noto-cjk >/dev/null 2>&1 || apt-get install -y fonts-wqy-zenhei >/dev/null 2>&1 || echo -e "${YELLOW}中文字体安装失败，AIGC 角标将无法叠加${NC}"
  fi
fi

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

# 在线网页版已下线（产品形态：桌面安装版 + APK，desktop-ui/ 为桌面版界面源码）
# 桌面版安装包由 GitHub Actions desktop-build 构建并自动发布到 /var/www/zhishuai/downloads/
echo -e "${YELLOW}[7/7] 在线网页版已下线，跳过 Web 前端部署${NC}"
echo -e "${YELLOW}      桌面版安装包由 CI desktop-build 自动发布到 $APP_DIR/downloads/${NC}"

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
echo -e "${GREEN}数据库备份: sudo bash $APP_DIR/scripts/backup-db.sh${NC}"
echo -e "${GREEN}健康监控: bash $APP_DIR/scripts/monitor.sh${NC}"
echo "========================================="
