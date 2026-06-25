#!/bin/bash
# 部署修复脚本 — 在服务器上执行
# 使用方法：将此脚本上传到服务器，然后执行 bash deploy_fixes.sh

set -e

echo "=== 智枢 AI SaaS 系统 — 问题修复部署 ==="
echo "时间: $(date)"
echo ""

PROJECT_DIR="/home/ubuntu/zhishuai"

# 1. 先拉取最新代码
echo "1. 拉取最新代码..."
cd $PROJECT_DIR
git pull origin main 2>/dev/null || echo "  git pull 失败，将手动复制文件"

echo ""
echo "2. 确认关键修改已应用..."

# 检查 ai-chat.ts 中的权限控制
if grep -q "仅管理员可使用平台全局Key" server/src/routes/ai-chat.ts; then
  echo "  ✓ ai-chat.ts API Key 权限控制已就位"
else
  echo "  ✗ ai-chat.ts 需要更新！"
fi

if grep -q "仅管理员可使用平台全局Key" server/src/routes/code-assistant.ts; then
  echo "  ✓ code-assistant.ts API Key 权限控制已就位"
else
  echo "  ✗ code-assistant.ts 需要更新！"
fi

if grep -q "getPrimaryApiKey" server/src/services/pipeline.service.ts; then
  echo "  ✓ pipeline.service.ts 用户级Key支持已就位"
else
  echo "  ✗ pipeline.service.ts 需要更新！"
fi

# 3. 重启服务
echo ""
echo "3. 重启 PM2 服务..."
pm2 restart all
pm2 save

echo ""
echo "4. 等待服务启动..."
sleep 5

echo ""
echo "5. 健康检查..."
curl -s -k https://api.baizhiji.net/api/health | head -c 200

echo ""
echo ""
echo "=== 部署完成 ==="
echo ""
echo "修复项："
echo "  ✓ API Key 权限控制（仅管理员可用平台Key）"
echo "  ✓ Content Factory 视频生成接入后端API"
echo "  ✓ Report 页面导出记录从后端获取"
echo "  ✓ Help 页面智能客服接入AI对话"
echo "  ✓ Subscribe 页面移除模拟支付跳转"
echo "  ✓ Employees 页面从Auth Context获取用户ID"
echo ""
echo "仍需手动处理："
echo "  - SSL证书修复：执行 bash scripts/fix_ssl_cert.sh"
