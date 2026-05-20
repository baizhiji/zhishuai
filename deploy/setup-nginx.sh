#!/bin/bash
# Nginx 反向代理配置脚本

echo "=========================================="
echo "配置 Nginx 反向代理"
echo "=========================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# Nginx配置目录
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# 配置文件
CONFIG_FILE="$NGINX_AVAILABLE/api.baizhiji.net"
LINK_FILE="$NGINX_ENABLED/api.baizhiji.net"

echo "[1/4] 检查Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "Nginx未安装，正在安装..."
    apt update && apt install -y nginx
fi

echo "[2/4] 创建配置目录..."
mkdir -p "$NGINX_AVAILABLE"

echo "[3/4] 创建API反向代理配置..."
cat > "$CONFIG_FILE" << 'EOF'
server {
    listen 80;
    server_name api.baizhiji.net;

    # 允许跨域
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

    # 处理OPTIONS预检请求
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        add_header 'Access-Control-Max-Age' 86400;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo "[4/4] 启用配置并重载Nginx..."
# 创建软链接
ln -sf "$CONFIG_FILE" "$LINK_FILE"

# 测试配置
nginx -t

# 重载Nginx
systemctl reload nginx

echo "=========================================="
echo "Nginx配置完成!"
echo "=========================================="

# 验证
echo ""
echo "验证API是否可访问:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" http://api.baizhiji.net/api/auth/login || echo "验证失败，请检查配置"
