#!/bin/bash
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
