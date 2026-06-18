#!/usr/bin/env python3
"""智枢AI 远程部署脚本 - 通过SSH连接服务器，从GitHub拉取代码并部署"""
import paramiko
import sys
import time
import os

# Fix Windows encoding issue
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"
DEPLOY_DIR = "/var/www/zhishuai"

def ssh_exec(client, cmd, timeout=300):
    """执行远程命令"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    return code, out, err

def ssh_exec_stream(client, cmd, timeout=600):
    """执行远程命令并实时输出"""
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
    action = sys.argv[1] if len(sys.argv) > 1 else 'full_deploy'
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("=" * 60)
    print("  智枢AI SaaS 远程部署工具")
    print("=" * 60)
    
    # Connect
    print(f"\n[连接] SSH -> {USER}@{HOST}...")
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        print("  连接成功!")
    except Exception as e:
        print(f"  连接失败: {e}")
        sys.exit(1)
    
    if action == 'check':
        # Just check server status
        print("\n[检查] 服务器状态...")
        code, out, err = ssh_exec(client, "echo SSH_OK && uname -a && node -v && npm -v && pm2 -v 2>/dev/null && pm2 status 2>/dev/null")
        print(out)
        if err: print(f"stderr: {err}")
        
        # Check project directory
        code, out, err = ssh_exec(client, f"ls -la {DEPLOY_DIR}/ 2>/dev/null || echo 'NO_PROJECT_DIR'")
        print(f"\n项目目录: {out}")
        
        # Check if git repo exists
        code, out, err = ssh_exec(client, f"cd {DEPLOY_DIR} && git remote -v 2>/dev/null || echo 'NO_GIT_REPO'")
        print(f"Git remote: {out}")
    
    elif action == 'full_deploy':
        # Full deployment from GitHub
        
        # Step 1: Check if git repo exists on server
        print("\n[1/7] 检查服务器环境...")
        code, out, err = ssh_exec(client, f"ls {DEPLOY_DIR}/.git 2>/dev/null && echo 'GIT_EXISTS' || echo 'NO_GIT'")
        has_git = 'GIT_EXISTS' in out
        
        if not has_git:
            print("  项目目录无git仓库，初始化并设置remote...")
            # Initialize git in existing directory and set remote
            cmds = f"""
cd {DEPLOY_DIR}
git init
git config --global http.version HTTP/1.1
git remote add origin https://github.com/baizhiji/zhishuai.git
git fetch origin 2>&1 && echo FETCH_OK || echo FETCH_FAIL
"""
            code, out, err = ssh_exec_stream(client, cmds, timeout=120)
            if 'FETCH_OK' in out:
                print("  Git初始化和fetch成功!")
                # Checkout main branch
                code, out, err = ssh_exec_stream(client,
                    f"cd {DEPLOY_DIR} && git checkout -b main origin/main 2>&1 && echo CHECKOUT_OK",
                    timeout=60
                )
                if 'CHECKOUT_OK' in out:
                    print("  代码checkout成功!")
                else:
                    # Try force checkout
                    print(f"  checkout输出: {out[-300:]}")
                    code, out, err = ssh_exec_stream(client,
                        f"cd {DEPLOY_DIR} && git branch -M main && git reset --hard origin/main 2>&1 && echo RESET_OK",
                        timeout=60
                    )
                    if 'RESET_OK' in out:
                        print("  强制重置成功!")
                    else:
                        print(f"  重置输出: {out[-300:]}")
            else:
                print(f"  fetch失败: {out[-300:]}")
                # Try alternative: backup existing, clone fresh
                print("  尝试备份现有目录并重新克隆...")
                code, out, err = ssh_exec(client, f"mv {DEPLOY_DIR} {DEPLOY_DIR}.bak 2>/dev/null; mkdir -p {DEPLOY_DIR}")
                code, out, err = ssh_exec_stream(client,
                    f"cd /tmp && git clone https://github.com/baizhiji/zhishuai.git zhishuai-temp 2>&1 && echo CLONE_OK",
                    timeout=120
                )
                if 'CLONE_OK' in out:
                    # Copy files to deploy dir
                    code, out, err = ssh_exec(client,
                        f"cp -r /tmp/zhishuai-temp/* {DEPLOY_DIR}/ && cp -r /tmp/zhishuai-temp/.git {DEPLOY_DIR}/ && rm -rf /tmp/zhishuai-temp"
                    )
                    print("  克隆并复制成功!")
                else:
                    print(f"  克隆也失败: {out[-300:]}")
                    client.close()
                    sys.exit(1)
        else:
            print("  项目目录已有git仓库，拉取最新代码...")
            # Configure HTTP/1.1 for GitHub access (same fix we used locally)
            code, out, err = ssh_exec(client, "git config --global http.version HTTP/1.1")
            # Pull latest
            print("  git pull...")
            code, out, err = ssh_exec_stream(client,
                f"cd {DEPLOY_DIR} && git pull origin main 2>&1 && echo PULL_OK",
                timeout=120
            )
            if 'PULL_OK' in out:
                print("  拉取成功!")
            else:
                print(f"  拉取输出: {out[-500:]}")
                # If pull fails, try force checkout
                print("  尝试强制重置...")
                code, out, err = ssh_exec_stream(client,
                    f"cd {DEPLOY_DIR} && git fetch origin 2>&1 && git reset --hard origin/main 2>&1 && echo RESET_OK",
                    timeout=120
                )
                if 'RESET_OK' in out:
                    print("  重置成功!")
                else:
                    print(f"  重置失败: {out[-500:]}")
        
        # Step 2: Install server dependencies
        print("\n[2/7] 安装服务端依赖...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npm install --production=false 2>&1 && echo INSTALL_OK",
            timeout=300
        )
        if 'INSTALL_OK' in out:
            print("  安装成功!")
        else:
            print(f"  安装可能有问题: {out[-300:]}")
        
        # Step 3: Generate Prisma client
        print("\n[3/7] 生成 Prisma 客户端...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma generate 2>&1 && echo PRISMA_OK",
            timeout=60
        )
        if 'PRISMA_OK' in out:
            print("  Prisma 客户端生成成功!")
        else:
            print(f"  Prisma 生成输出: {out[-300:]}")
        
        # Step 4: Build server TypeScript
        print("\n[4/7] 构建服务端 TypeScript...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npm run build 2>&1 && echo BUILD_OK",
            timeout=120
        )
        if 'BUILD_OK' in out:
            print("  构建成功!")
        else:
            print(f"  构建输出: {out[-500:]}")
        
        # Step 5: Database migration
        print("\n[5/7] 执行数据库迁移...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma migrate deploy 2>&1 || npx prisma db push 2>&1 && echo MIGRATE_OK",
            timeout=120
        )
        if 'MIGRATE_OK' in out:
            print("  迁移成功!")
        else:
            print(f"  迁移输出: {out[-300:]}")
        
        # Step 6: Write .env file (critical: contains production DB URL with internal IP)
        print("\n[6/7] 配置环境变量...")
        env_content = '''DATABASE_URL="mysql://root:Hao-20061218@172.19.0.13:3306/zhishuai?connection_limit=20&pool_timeout=10"
JWT_SECRET="zs9kP2xL7mN4qR8vW3yA6bC1dE5fG0hJ"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
API_VERSION="v1"
FRONTEND_URL="https://baizhiji.net"
APP_URL="https://app.baizhiji.net"
DASHSCOPE_API_KEY=""
TENCENT_TOKENHUB_API_KEY=""
OPENAI_API_KEY=""
'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/server/.env << 'ENVEOF'\n{env_content}ENVEOF")
        print("  .env 文件已写入!")
        
        # Write ecosystem config for PM2
        ecosystem = '''module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '/var/www/zhishuai/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
  }],
};'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/server/ecosystem.config.cjs << 'ECOEOF'\n{ecosystem}ECOEOF")
        print("  ecosystem.config.cjs 已写入!")
        
        # Create log directory
        code, out, err = ssh_exec(client, "mkdir -p /var/log/zhishuai")
        
        # Step 7: Start/restart PM2
        print("\n[7/7] 启动 API 服务 (PM2)...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && pm2 delete zhishuai-api 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1 && pm2 save 2>&1 && echo PM2_OK",
            timeout=60
        )
        if 'PM2_OK' in out:
            print("  PM2 启动成功!")
        else:
            print(f"  PM2 输出: {out[-300:]}")
        
        # Verify
        print("\n[验证] 检查服务状态...")
        time.sleep(3)
        code, out, err = ssh_exec(client, "pm2 status 2>/dev/null && echo --- && curl -s http://localhost:3001/api/health 2>/dev/null || echo 'API_NOT_READY'")
        print(out)
        
        print("\n" + "=" * 60)
        print("  部署完成!")
        print("=" * 60)
        print(f"\n  API: https://baizhiji.net/api")
        print(f"  Web: https://baizhiji.net")
    
    elif action == 'restart':
        print("\n[重启] 重启 PM2 服务...")
        code, out, err = ssh_exec(client, f"cd {DEPLOY_DIR}/server && pm2 restart zhishuai-api 2>&1 && pm2 save")
        print(out)
    
    elif action == 'install_web':
        # Deploy web frontend separately
        print("\n[部署Web] 安装前端依赖并构建...")
        
        # Install web dependencies
        print("  安装依赖...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && npm install 2>&1 && echo WEB_INSTALL_OK",
            timeout=300
        )
        if 'WEB_INSTALL_OK' in out:
            print("  Web依赖安装成功!")
        else:
            print(f"  安装输出: {out[-500:]}")
        
        # Build web
        print("  构建前端...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && NODE_ENV=production npm run build 2>&1 && echo WEB_BUILD_OK",
            timeout=300
        )
        if 'WEB_BUILD_OK' in out:
            print("  Web构建成功!")
        else:
            print(f"  构建输出: {out[-500:]}")
        
        # Write ecosystem config for PM2
        web_ecosystem = '''module.exports = {
  apps: [{
    name: 'zhishuai-web',
    script: './node_modules/.bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/zhishuai/web',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/web-error.log',
    out_file: '/var/log/zhishuai/web-out.log',
    time: true,
  }],
};'''
        code, out, err = ssh_exec(client, f"cat > {DEPLOY_DIR}/web/ecosystem.config.cjs << 'ECOEOF'\n{web_ecosystem}ECOEOF")
        
        # Start web PM2
        print("  启动Web服务...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/web && pm2 delete zhishuai-web 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1 && pm2 save 2>&1 && echo WEB_PM2_OK",
            timeout=60
        )
        if 'WEB_PM2_OK' in out:
            print("  Web PM2 启动成功!")
        else:
            print(f"  PM2 输出: {out[-300:]}")
        
        # Verify
        time.sleep(3)
        code, out, err = ssh_exec(client, "pm2 status")
        print(out)
    
    elif action == 'status':
        code, out, err = ssh_exec(client, "pm2 status && echo --- && curl -s http://localhost:3001/api/health 2>/dev/null || echo 'API_NA'")
        print(out)
    
    else:
        print(f"用法: python deploy_remote.py [check|full_deploy|restart|install_web|status]")
    
    client.close()

if __name__ == '__main__':
    main()
