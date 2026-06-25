#!/usr/bin/env python3
"""修复远程服务器上的ecosystem和nginx配置文件"""
import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("[连接] SSH...")
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print("  连接成功!")

# ===== Fix API ecosystem.config.cjs =====
print("\n[1/5] 修复API ecosystem.config.cjs...")
api_eco = r"""module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '/var/www/zhishuai/server',
    env: { NODE_ENV: 'production', PORT: 3001 },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
  }],
};
"""
# Write via SFTP
sftp = client.open_sftp()
with sftp.open('/var/www/zhishuai/server/ecosystem.config.cjs', 'w') as f:
    f.write(api_eco)
print("  写入成功!")

# ===== Fix Web ecosystem.config.cjs =====
print("\n[2/5] 修复Web ecosystem.config.cjs...")
web_eco = r"""module.exports = {
  apps: [{
    name: 'zhishuai-web',
    script: './node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/zhishuai/web',
    env: { NODE_ENV: 'production', PORT: 3000 },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/web-error.log',
    out_file: '/var/log/zhishuai/web-out.log',
    time: true,
  }],
};
"""
with sftp.open('/var/www/zhishuai/web/ecosystem.config.cjs', 'w') as f:
    f.write(web_eco)
print("  写入成功!")

# ===== Fix Nginx config =====
print("\n[3/5] 修复Nginx配置...")
nginx_conf = r"""server {
    listen 80;
    listen [::]:80;
    server_name baizhiji.net www.baizhiji.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; allow all; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name baizhiji.net www.baizhiji.net;

    ssl_certificate     /etc/letsencrypt/live/baizhiji.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/baizhiji.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 60s;
    }

    location /uploads/ {
        alias /var/www/zhishuai/server/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
"""
# Write to temp file via SFTP, then sudo copy
with sftp.open('/tmp/baizhiji.net.conf', 'w') as f:
    f.write(nginx_conf)
print("  Nginx配置文件写入成功!")

# Copy with sudo
stdin, stdout, stderr = client.exec_command("sudo cp /tmp/baizhiji.net.conf /etc/nginx/sites-available/baizhiji.net && sudo ln -sf /etc/nginx/sites-available/baizhiji.net /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 && echo NGINX_OK || echo NGINX_FAIL", timeout=30)
out = stdout.read().decode('utf-8','replace')
err = stderr.read().decode('utf-8','replace')
print(f"  Nginx: {out}")
if err and 'NGINX_OK' not in out:
    print(f"  Error: {err}")

# ===== Start PM2 services =====
print("\n[4/5] 启动PM2服务...")

# Start API
stdin, stdout, stderr = client.exec_command("cd /var/www/zhishuai/server && pm2 delete zhishuai-api 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1", timeout=30)
out = stdout.read().decode('utf-8','replace')
if 'online' in out.lower():
    print("  API服务启动成功!")
else:
    print(f"  API输出: {out[-200:]}")

# Start Web
stdin, stdout, stderr = client.exec_command("cd /var/www/zhishuai/web && pm2 delete zhishuai-web 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1", timeout=30)
out = stdout.read().decode('utf-8','replace')
if 'online' in out.lower():
    print("  Web服务启动成功!")
else:
    print(f"  Web输出: {out[-200:]}")

# Save PM2
client.exec_command("pm2 save 2>/dev/null")

# ===== Verify =====
print("\n[5/5] 验证服务状态...")
time.sleep(5)

stdin, stdout, stderr = client.exec_command("pm2 status", timeout=30)
print(stdout.read().decode('utf-8','replace'))

stdin, stdout, stderr = client.exec_command("curl -s http://localhost:3001/api/health", timeout=10)
print(f"  API健康: {stdout.read().decode('utf-8','replace')}")

stdin, stdout, stderr = client.exec_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", timeout=10)
print(f"  Web状态: HTTP {stdout.read().decode('utf-8','replace')}")

sftp.close()
client.close()
print("\n修复完成!")
