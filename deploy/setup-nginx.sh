#!/bin/bash
# Nginx 反向代理自动配置脚本

echo "=========================================="
echo "配置 Nginx 反向代理"
echo "=========================================="

# 1. 检查Nginx
echo "[1/4] 检查Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "Nginx未安装，正在安装..."
    sudo apt update && sudo apt install -y nginx
fi
echo "✓ Nginx已安装"

# 2. 创建配置目录与下载目录
echo "[2/4] 创建配置目录..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
sudo mkdir -p /var/www/zhishuai/downloads
sudo chown -R "$USER:$USER" /var/www/zhishuai/downloads 2>/dev/null || true
echo "✓ 配置目录与 /var/www/zhishuai/downloads 已就绪"

# 3. 同步项目中的 nginx 配置
echo "[3/4] 同步 nginx 配置..."
# 生产实际生效配置为 baizhiji.net（安全加固版，含 SSL/限流/健康检查转发）
# 禁用旧配置，避免 server_name 冲突
sudo rm -f /etc/nginx/sites-available/api.baizhiji.net
sudo rm -f /etc/nginx/sites-enabled/api.baizhiji.net
sudo rm -f /etc/nginx/sites-available/zhishuai.conf
sudo rm -f /etc/nginx/sites-enabled/zhishuai.conf

APP_DIR=/var/www/zhishuai
sudo cp "$APP_DIR/deploy/nginx/baizhiji.net" /etc/nginx/sites-available/baizhiji.net
echo "✓ 配置文件已同步"

# 4. 启用配置并重载Nginx
echo "[4/4] 启用配置并重载Nginx..."
sudo ln -sf /etc/nginx/sites-available/baizhiji.net /etc/nginx/sites-enabled/baizhiji.net
sudo nginx -t && sudo systemctl reload nginx
echo "✓ Nginx配置已启用"

echo ""
echo "=========================================="
echo "Nginx配置完成!"
echo "=========================================="
echo ""
echo "验证API是否可访问:"
echo "  curl -I http://api.baizhiji.net/api/auth/login"
echo ""
echo "或测试API接口:"
echo "  curl http://api.baizhiji.net/api/features"
