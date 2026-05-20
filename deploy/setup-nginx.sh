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

# 2. 创建配置目录
echo "[2/4] 创建配置目录..."
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled
echo "✓ 配置目录已就绪"

# 3. 创建API反向代理配置
echo "[3/4] 创建API反向代理配置..."

# 先删除旧配置（如果存在）
sudo rm -f /etc/nginx/sites-available/api.baizhiji.net
sudo rm -f /etc/nginx/sites-enabled/api.baizhiji.net

# 创建新配置
sudo tee /etc/nginx/sites-available/api.baizhiji.net > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.baizhiji.net;

    # 处理OPTIONS预检请求
    location / {
        # 处理CORS预检
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # 跨域头
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

        # 反向代理到后端API
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✓ 配置文件已创建"

# 4. 启用配置并重载Nginx
echo "[4/4] 启用配置并重载Nginx..."
sudo ln -sf /etc/nginx/sites-available/api.baizhiji.net /etc/nginx/sites-enabled/
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
