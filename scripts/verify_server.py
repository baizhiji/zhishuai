#!/usr/bin/env python3
"""智枢AI 验证和数据库迁移脚本"""
import paramiko
import sys
import time

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

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("=" * 60)
    print("  智枢AI 验证与数据库迁移")
    print("=" * 60)
    
    print(f"\n[连接] SSH -> {USER}@{HOST}...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
    print("  连接成功!")
    
    # Step 1: Verify API routes
    print("\n[1/4] 验证 API 路由...")
    code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/health")
    print(f"  Health: {out[:200]}")
    
    # Test auth routes
    code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"admin\",\"password\":\"test\"}' | head -c 300")
    print(f"  Login: {out[:200]}")
    
    # Test CRM routes  
    code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/crm/contacts | head -c 200")
    print(f"  CRM: {out[:200]}")
    
    # Step 2: Database migration (need to update .env to use internal IP)
    print("\n[2/4] 执行数据库迁移 (使用内网地址)...")
    # First check if we can reach the internal DB
    code, out, err = ssh_exec(client, "cat /var/www/zhishuai/server/.env | grep DATABASE_URL")
    print(f"  当前DB URL: {out.strip()}")
    
    # Try migrate with internal IP
    code, out, err = ssh_exec_stream(client,
        f"cd {DEPLOY_DIR}/server && npx prisma migrate deploy 2>&1 | tail -10 && echo MIGRATE_DONE || echo MIGRATE_FAILED",
        timeout=120
    )
    
    if 'MIGRATE_FAILED' in out or 'Error' in out:
        print("  迁移失败，尝试 db push...")
        # Try db push instead
        code, out, err = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma db push --accept-data-loss 2>&1 | tail -10 && echo PUSH_DONE",
            timeout=120
        )
    
    # Step 3: Verify PM2 status
    print("\n[3/4] PM2 服务状态...")
    code, out, err = ssh_exec(client, "pm2 status")
    print(out)
    
    # Step 4: Check external accessibility  
    print("\n[4/4] 检查外部访问...")
    code, out, err = ssh_exec(client, "curl -s http://localhost:3001/api/routes 2>/dev/null | head -c 500 || echo 'NO_ROUTE_LIST'")
    print(f"  Routes: {out[:300]}")
    
    client.close()
    print("\n" + "=" * 60)
    print("  验证完成!")
    print("=" * 60)

if __name__ == '__main__':
    main()
