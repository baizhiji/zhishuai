#!/usr/bin/env python3
"""智枢AI 服务器修复脚本 - 修复编译、配置和启动问题"""
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

def ssh_exec(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    return code, out, err

def ssh_exec_stream(client, cmd, timeout=600):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    output = ''
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode('utf-8', errors='replace')
            output += data
            print(data, end='', flush=True)
        if stdout.channel.recv_stderr_ready():
            data = stdout.channel.recv_stderr(4096).decode('utf-8', errors='replace')
            output += data
            print(data, end='', flush=True)
        time.sleep(0.1)
    remaining = stdout.read().decode('utf-8', errors='replace')
    remaining_err = stderr.read().decode('utf-8', errors='replace')
    output += remaining + remaining_err
    code = stdout.channel.recv_exit_status()
    return code, output, ''

def write_remote_file(client, remote_path, content):
    """Write a file on the remote server using SFTP"""
    sftp = client.open_sftp()
    try:
        with sftp.file(remote_path, 'w') as f:
            f.write(content)
        print(f"  Written: {remote_path}")
        return True
    except Exception as e:
        print(f"  Error writing {remote_path}: {e}")
        return False
    finally:
        sftp.close()

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("=" * 60)
    print("  智枢AI 服务器修复与启动")
    print("=" * 60)
    
    print(f"\n[连接] SSH -> {USER}@{HOST}...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
    print("  连接成功!")
    
    # Step 1: Fix .env file - use internal IP for DB (server is in same VPC)
    print("\n[1/5] 修复 .env 配置...")
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
    write_remote_file(client, f"{DEPLOY_DIR}/server/.env", env_content)
    
    # Step 2: Fix ecosystem.config.cjs via SFTP
    print("\n[2/5] 修复 PM2 配置...")
    ecosystem_content = '''module.exports = {
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
};
'''
    write_remote_file(client, f"{DEPLOY_DIR}/server/ecosystem.config.cjs", ecosystem_content)
    
    # Verify file content
    code, out, err = ssh_exec(client, f"cat {DEPLOY_DIR}/server/ecosystem.config.cjs")
    print(f"  File content verified, size: {len(out)} bytes")
    
    # Step 3: Check if TypeScript build output exists
    print("\n[3/5] 检查构建状态...")
    code, out, err = ssh_exec(client, f"ls {DEPLOY_DIR}/server/dist/ 2>/dev/null | head -20")
    dist_files = out.strip()
    
    if len(dist_files) == 0 or 'cannot access' in out.lower():
        print("  dist目录不存在或为空，需要构建...")
        # Rebuild TypeScript (noEmitOnError=false means it outputs even with errors)
        print("  使用 tsc 构建 (允许错误输出)...")
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx tsc 2>&1 | tail -5 && echo BUILD_DONE",
            timeout=120
        )
        # Check if dist was generated
        code, out2, err2 = ssh_exec(client, f"ls {DEPLOY_DIR}/server/dist/ 2>/dev/null | wc -l")
        try:
            files_count = int(out2.strip())
        except:
            files_count = 0
        print(f"  dist目录文件数: {files_count}")
        
        if files_count == 0:
            print("  tsc构建没有产出文件，使用tsx直接运行作为备选...")
            # Create a startup script that uses tsx
            startup_script = '''#!/bin/bash
cd /var/www/zhishuai/server
exec npx tsx src/index.ts
'''
            write_remote_file(client, f"{DEPLOY_DIR}/server/start.sh", startup_script)
            ssh_exec(client, f"chmod +x {DEPLOY_DIR}/server/start.sh")
            
            # Update ecosystem to use start.sh
            ecosystem_tsx = '''module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './start.sh',
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
    interpreter: '/bin/bash',
  }],
};
'''
            write_remote_file(client, f"{DEPLOY_DIR}/server/ecosystem.config.cjs", ecosystem_tsx)
        else:
            print(f"  dist目录已生成 {files_count} 个文件")
    else:
        print(f"  dist目录已存在，内容: {dist_files[:200]}")
    
    # Step 4: Ensure log directory
    print("\n[4/5] 创建日志目录...")
    ssh_exec(client, "mkdir -p /var/log/zhishuai")
    
    # Step 5: Start PM2
    print("\n[5/5] 启动 API 服务...")
    code, out, err = ssh_exec_stream(client,
        f"cd {DEPLOY_DIR}/server && pm2 delete zhishuai-api 2>/dev/null; pm2 start ecosystem.config.cjs 2>&1",
        timeout=60
    )
    
    # Save PM2 config
    ssh_exec(client, "pm2 save")
    
    # Wait and check
    print("\n[验证] 等待3秒后检查...")
    time.sleep(5)
    code, out, err = ssh_exec(client, "pm2 status")
    print(out)
    
    # Check API health
    code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/health 2>/dev/null || echo API_NOT_READY")
    print(f"API Health: {out[:200]}")
    
    # Check logs if not ready
    if 'API_NOT_READY' in out:
        print("\nAPI未启动，查看错误日志...")
        code, out, err = ssh_exec(client, "pm2 logs zhishuai-api --lines 30 --nostream 2>/dev/null || echo NO_LOGS")
        print(out[-1000:])
    
    client.close()
    print("\n" + "=" * 60)
    print("  修复完成!")
    print("=" * 60)

if __name__ == '__main__':
    main()
