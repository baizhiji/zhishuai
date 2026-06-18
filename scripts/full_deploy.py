#!/usr/bin/env python3
"""智枢AI 全量部署脚本 - 一键部署WEB端和API到腾讯云CVM"""
import paramiko
import sys
import time
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"
DEPLOY_DIR = "/var/www/zhishuai"
LOG_DIR = "/var/log/zhishuai"

def ssh_exec(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    return code, out, err

def ssh_exec_stream(client, cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    output = ''
    error = ''
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode('utf-8', errors='replace')
            output += data
            print(data, end='', flush=True)
        if stdout.channel.recv_stderr_ready():
            data = stdout.channel.recv_stderr(4096).decode('utf-8', errors='replace')
            error += data
            print(data, end='', flush=True)
        time.sleep(0.1)
    remaining_out = stdout.read().decode('utf-8', errors='replace')
    remaining_err = stderr.read().decode('utf-8', errors='replace')
    output += remaining_out
    error += remaining_err
    if remaining_out: print(remaining_out, end='', flush=True)
    if remaining_err: print(remaining_err, end='', flush=True)
    code = stdout.channel.recv_exit_status()
    return code, output, error

def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'full'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("=" * 60)
    print("  智枢AI SaaS 全量部署工具")
    print("  目标: " + HOST)
    print("=" * 60)
    
    print(f"\n[连接] SSH -> {USER}@{HOST}...")
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        print("  连接成功!")
    except Exception as e:
        print(f"  连接失败: {e}")
        sys.exit(1)
    
    if action == 'check':
        print("\n[检查] 服务器状态...")
        code, out, err = ssh_exec(client, "uname -a && echo '---' && node -v && npm -v && (pm2 -v 2>/dev/null || echo 'no pm2') && echo '---' && pm2 status 2>/dev/null && echo '---' && curl -s http://localhost:3001/api/health && echo '---' && curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
        print(out)
    
    elif action == 'full':
        # ====== Step 1: 系统环境 ======
        print("\n[1/9] 检查并安装系统环境...")
        cmds = """
which node || (curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs)
which pm2 || sudo npm install -g pm2
which nginx || sudo apt-get install -y nginx
sudo mkdir -p {log_dir} {deploy_dir}
sudo chown -R $USER:$USER {deploy_dir} {log_dir}
node -v && npm -v && pm2 -v
""".format(deploy_dir=DEPLOY_DIR, log_dir=LOG_DIR)
        code, out, err = ssh_exec_stream(client, cmds, timeout=300)
        
        # ====== Step 2: 拉取代码 ======
        print("\n[2/9] 从GitHub拉取最新代码...")
        code, out, err = ssh_exec(client, f"ls {DEPLOY_DIR}/.git 2>/dev/null && echo GIT_EXISTS || echo NO_GIT")
        
        if 'NO_GIT' in out:
            print("  初始化Git仓库并拉取代码...")
            cmds = f"""
cd {DEPLOY_DIR}
git init
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
git remote add origin https://github.com/baizhiji/zhishuai.git 2>/dev/null || true
git fetch origin main 2>&1 && echo FETCH_OK || echo FETCH_FAIL
"""
            code, out, err = ssh_exec_stream(client, cmds, timeout=180)
            if 'FETCH_OK' in out:
                code, out, err = ssh_exec_stream(client,
                    f"cd {DEPLOY_DIR} && git checkout -b main origin/main 2>&1 || (git branch -M main && git reset --hard origin/main 2>&1) && echo CHECKOUT_OK",
                    timeout=60)
                print("  代码拉取成功!")
            else:
                print(f"  拉取失败，尝试clone... {out[-200:]}")
                code, out, err = ssh_exec_stream(client,
                    f"cd /tmp && rm -rf zhishuai-temp && git clone https://github.com/baizhiji/zhishuai.git zhishuai-temp 2>&1 && echo CLONE_OK || echo CLONE_FAIL",
                    timeout=180)
                if 'CLONE_OK' in out:
                    ssh_exec(client, f"rm -rf {DEPLOY_DIR}/* && cp -r /tmp/zhishuai-temp/* {DEPLOY_DIR}/ && cp -r /tmp/zhishuai-temp/.git {DEPLOY_DIR}/ && rm -rf /tmp/zhishuai-temp")
                    print("  克隆成功!")
                else:
                    print(f"  克隆也失败: {out[-200:]}")
                    client.close()
                    sys.exit(1)
        else:
            print("  已有仓库，拉取最新代码...")
            ssh_exec(client, "git config --global http.version HTTP/1.1")
            ssh_exec(client, "git config --global http.postBuffer 524288000")
            code, out, err = ssh_exec_stream(client,
                f"cd {DEPLOY_DIR} && git fetch origin main 2>&1 && git reset --hard origin/main 2>&1 && echo PULL_OK",
                timeout=180)
            if 'PULL_OK' in out:
                print("  代码更新成功!")
            else:
                print(f"  更新输出: {out[-300:]}")
        
        # ====== Step 3: 安装Server依赖 ======
        print("\n[3/9] 安装API服务依赖...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npm install --production=false 2>&1 && echo INSTALL_OK",
            timeout=300)
        if 'INSTALL_OK' in out:
            print("  安装成功!")
        else:
            print(f"  安装可能有问题: {out[-200:]}")
        
        # ====== Step 4: Prisma + Build Server ======
        print("\n[4/9] 生成Prisma客户端并构建API...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma generate 2>&1 && npm run build 2>&1 && echo BUILD_OK",
            timeout=120)
        if 'BUILD_OK' in out:
            print("  构建成功!")
        else:
            print(f"  构建输出: {out[-300:]}")
        
        # ====== Step 5: 数据库迁移 ======
        print("\n[5/9] 执行数据库迁移...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma migrate deploy 2>&1 && echo MIGRATE_OK || (npx prisma db push 2>&1 && echo PUSH_OK)",
            timeout=120)
        if 'MIGRATE_OK' in out or 'PUSH_OK' in out:
            print("  数据库迁移成功!")
        else:
            print(f"  迁移输出: {out[-300:]}")
        
        # Seed data
        print("  初始化种子数据...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1 || echo SEED_SKIP",
            timeout=60)
        
        # ====== Step 6: 配置环境变量 ======
        print("\n[6/9] 配置环境变量...")
        env_content = '''DATABASE_URL="mysql://root:Hao-20061218@172.19.0.13:3306/zhishuai?connection_limit=20&pool_timeout=10"
JWT_SECRET="zs9kP2xL7mN4qR8vW3yA6bC1dE5fG0hJ"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
API_VERSION="v1"
FRONTEND_URL="https://baizhiji.net"
APP_URL="https://app.baizhiji.net"
DASHSCOPE_API_KEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
TENCENT_TOKENHUB_API_KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
OPENAI_API_KEY=""
'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/server/.env << 'ENVEOF'\n{env_content}ENVEOF")
        print("  server/.env 已写入!")
        
        # Web production env
        web_env = '''NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_APP_NAME=智枢AI
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=https://baizhiji.net
'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/web/.env.production << 'ENVEOF'\n{web_env}ENVEOF")
        print("  web/.env.production 已写入!")
        
        # ====== Step 7: 安装Web依赖并构建 ======
        print("\n[7/9] 安装Web前端依赖并构建...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && npm install 2>&1 && echo WEB_INSTALL_OK",
            timeout=300)
        if 'WEB_INSTALL_OK' in out:
            print("  Web依赖安装成功!")
        else:
            print(f"  安装输出: {out[-300:]}")
        
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && NODE_ENV=production npm run build 2>&1 && echo WEB_BUILD_OK",
            timeout=300)
        if 'WEB_BUILD_OK' in out:
            print("  Web构建成功!")
        else:
            print(f"  构建输出: {out[-500:]}")
        
        # ====== Step 8: PM2 启动服务 ======
        print("\n[8/9] 启动API和Web服务...")
        
        # API ecosystem
        api_eco = '''module.exports = {
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
};'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/server/ecosystem.config.cjs << 'ECOEOF'\n{api_eco}ECOEOF")
        
        # Web ecosystem
        web_eco = '''module.exports = {
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
};'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/web/ecosystem.config.cjs << 'ECOEOF'\n{web_eco}ECOEOF")
        
        # Start API
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && pm2 delete zhishuai-api 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1 && echo API_PM2_OK",
            timeout=60)
        if 'API_PM2_OK' in out:
            print("  API服务启动成功!")
        else:
            print(f"  API启动输出: {out[-200:]}")
        
        # Start Web
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && pm2 delete zhishuai-web 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1 && echo WEB_PM2_OK",
            timeout=60)
        if 'WEB_PM2_OK' in out:
            print("  Web服务启动成功!")
        else:
            print(f"  Web启动输出: {out[-200:]}")
        
        # Save PM2
        ssh_exec(client, "pm2 save 2>/dev/null; pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true")
        
        # ====== Step 9: Nginx 配置 ======
        print("\n[9/9] 配置Nginx...")
        
        nginx_conf = '''# 智枢AI Nginx 配置
server {
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

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 60s;
    }

    # 上传文件
    location /uploads/ {
        alias /var/www/zhishuai/server/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
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
'''
        code, out, err = ssh_exec(client, f"sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled /var/www/certbot")
        code, out, err = ssh_exec(client, f"echo '{nginx_conf}' | sudo tee /etc/nginx/sites-available/baizhiji.net > /dev/null")
        # Use heredoc instead for reliability
        code, out, err = ssh_exec(client, f"cat > /tmp/baizhiji.net.conf << 'NGINXEOF'\n{nginx_conf}NGINXEOF && sudo cp /tmp/baizhiji.net.conf /etc/nginx/sites-available/baizhiji.net")
        
        # Enable site
        code, out, err = ssh_exec(client, "sudo ln -sf /etc/nginx/sites-available/baizhiji.net /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default")
        
        # Test and reload nginx
        code, out, err = ssh_exec(client, "sudo nginx -t 2>&1 && sudo systemctl reload nginx 2>&1 && echo NGINX_OK || echo NGINX_FAIL")
        if 'NGINX_OK' in out:
            print("  Nginx配置成功!")
        else:
            print(f"  Nginx输出: {out} {err}")
        
        # ====== 验证 ======
        print("\n[验证] 检查所有服务状态...")
        time.sleep(5)
        code, out, err = ssh_exec(client, "pm2 status 2>/dev/null")
        print(out)
        
        code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/health 2>/dev/null || echo API_NOT_READY")
        print(f"  API健康检查: {out}")
        
        code, out, err = ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '0'")
        print(f"  Web前端状态: HTTP {out}")
        
        print("\n" + "=" * 60)
        print("  部署完成!")
        print("=" * 60)
        print(f"\n  WEB端: https://baizhiji.net")
        print(f"  API端: https://baizhiji.net/api/health")
        print(f"  APK端API: https://baizhiji.net/api")
        print(f"\n  管理员账号: admin / 初始密码 123456 (或种子数据设定的密码)")
        print(f"  查看日志: ssh {USER}@{HOST} 然后执行 pm2 logs")
    
    elif action == 'status':
        code, out, err = ssh_exec(client, "pm2 status && echo '---' && curl -s http://localhost:3001/api/health && echo '---' && curl -s -o /dev/null -w 'WEB_HTTP_%{http_code}' http://localhost:3000")
        print(out)
    
    elif action == 'restart':
        code, out, err = ssh_exec(client, "pm2 restart all 2>&1 && pm2 save")
        print(out)
    
    else:
        print("用法: python full_deploy.py [check|full|status|restart]")
    
    client.close()

if __name__ == '__main__':
    main()
