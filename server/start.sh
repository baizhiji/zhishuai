#!/bin/bash

# 智枢AI SaaS系统 - 启动脚本

echo "🚀 启动智枢AI后端服务..."

# 进入server目录
cd "$(dirname "$0")"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 生成Prisma客户端
echo "🔧 生成Prisma客户端..."
npx prisma generate

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
npx prisma migrate dev --name init

# 启动服务
echo "✅ 启动服务中..."
npm run dev
