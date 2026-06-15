#!/bin/bash

# ===========================================
# 智枢 AI SaaS - 开发环境快速设置脚本
# ===========================================

set -e

echo "🚀 开始配置开发环境..."

# 检查 Node.js 版本
check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    echo "✅ Node.js 版本: $NODE_VERSION"
}

# 安装依赖
install_deps() {
    echo "📦 安装项目依赖..."
    
    echo "  → 安装 Web 端依赖..."
    cd web && npm install && cd ..
    
    echo "  → 安装 Server 端依赖..."
    cd server && npm install && cd ..
    
    echo "  → 安装 APK 端依赖..."
    cd apk && npm install && cd ..
    
    echo "✅ 依赖安装完成"
}

# 格式化代码
format_code() {
    echo "🎨 格式化代码..."
    
    echo "  → 格式化 Web 端..."
    cd web && npm run format 2>/dev/null || echo "  (跳过)" && cd ..
    
    echo "  → 格式化 Server 端..."
    cd server && npm run format 2>/dev/null || echo "  (跳过)" && cd ..
    
    echo "✅ 代码格式化完成"
}

# 生成 Prisma Client
setup_db() {
    echo "🗄️  初始化数据库..."
    
    cd server
    npx prisma generate
    echo "✅ Prisma Client 生成完成"
    
    cd ..
}

# 设置 Git Hooks
setup_git_hooks() {
    echo "🪝 设置 Git Hooks..."
    
    # 尝试安装 husky (如果可用)
    cd web && npm pkg set prepare="cd .. && husky install" 2>/dev/null || true
    cd ../server && npm pkg set prepare="cd .. && husky install" 2>/dev/null || true
    cd ..
    
    echo "✅ Git Hooks 配置完成"
}

# 创建必要目录
setup_dirs() {
    echo "📁 创建必要目录..."
    
    mkdir -p web/app/logs
    mkdir -p server/logs
    mkdir -p docs
    
    echo "✅ 目录创建完成"
}

# 检查并创建 .env 文件
setup_env() {
    echo "⚙️  检查环境配置..."
    
    if [ ! -f "web/.env.local" ]; then
        echo "⚠️  警告: web/.env.local 不存在"
    fi
    
    if [ ! -f "server/.env" ]; then
        echo "⚠️  警告: server/.env 不存在"
        echo "   请复制 .env.example 并配置"
    fi
    
    echo "✅ 环境配置检查完成"
}

# 主流程
main() {
    echo "=========================================="
    echo "   智枢 AI SaaS 开发环境设置"
    echo "=========================================="
    echo ""
    
    check_node
    install_deps
    format_code
    setup_db
    setup_git_hooks
    setup_dirs
    setup_env
    
    echo ""
    echo "=========================================="
    echo "   ✅ 开发环境设置完成！"
    echo "=========================================="
    echo ""
    echo "下一步:"
    echo "  1. 配置环境变量"
    echo "  2. 启动开发服务器:"
    echo "     - Web: cd web && npm run dev"
    echo "     - Server: cd server && npm run dev"
    echo "  3. 查看文档: docs/DEVELOPMENT_GUIDE.md"
    echo ""
}

main "$@"
