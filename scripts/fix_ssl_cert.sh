#!/bin/bash
# SSL证书修复脚本
# 用途：为 api.baizhiji.net 配置正确的SSL证书

echo "=== 检查当前Nginx SSL配置 ==="
echo ""

# 检查证书配置
echo "1. 检查当前SSL证书状态："
sudo certbot certificates 2>/dev/null || echo "certbot未安装或无法获取证书列表"

echo ""
echo "2. 检查Nginx配置中的SSL设置："
sudo grep -r "ssl_certificate\|server_name.*api" /etc/nginx/ 2>/dev/null | head -20

echo ""
echo "3. 检查当前Nginx站点配置："
sudo nginx -T 2>/dev/null | grep -A5 "server_name.*api.baizhiji.net" | head -20

echo ""
echo "=== 修复建议 ==="
echo ""
echo "如果 api.baizhiji.net 的SSL证书缺失或域名不匹配，执行以下命令："
echo ""
echo "# 方案1：使用Certbot申请新证书（推荐）"
echo "sudo certbot --nginx -d api.baizhiji.net"
echo ""
echo "# 方案2：如果主域名已有通配符证书，复制到api子域名"
echo "# 在Nginx配置中为 api.baizhiji.net 的server块添加："
echo "# ssl_certificate /etc/letsencrypt/live/baizhiji.net/fullchain.pem;"
echo "# ssl_certificate_key /etc/letsencrypt/live/baizhiji.net/privkey.pem;"
echo ""
echo "# 方案3：使用已存在的通配符证书（如果有的话）"
echo "# ssl_certificate /etc/letsencrypt/live/baizhiji.net-0001/fullchain.pem;"
echo "# ssl_certificate_key /etc/letsencrypt/live/baizhiji.net-0001/privkey.pem;"

echo ""
echo "执行修复后，重载Nginx："
echo "sudo nginx -t && sudo systemctl reload nginx"
