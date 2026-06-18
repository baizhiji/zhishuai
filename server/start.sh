#!/bin/bash

# 智枢AI SaaS系统 - 启动脚本

echo "启动智枢AI后端服务..."

# 进入server目录
cd "$(dirname "$0")"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 生成Prisma客户端
echo "生成Prisma客户端..."
npx prisma generate

# 数据库迁移（生产用 deploy，开发用 dev）
if [ "$NODE_ENV" = "production" ]; then
    echo "执行生产数据库迁移..."
    npx prisma migrate deploy 2>/dev/null || {
      echo "迁移失败，尝试 prisma db push..."
      npx prisma db push 2>/dev/null || true
    }
else
    echo "执行开发数据库迁移..."
    npx prisma db push 2>/dev/null || true
fi

# 启动服务
if [ "$NODE_ENV" = "production" ]; then
    echo "启动生产服务..."
    npm run start
else
    echo "启动开发服务..."
    npm run dev
fi
