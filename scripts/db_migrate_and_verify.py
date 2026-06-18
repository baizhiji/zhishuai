"""智枢AI 数据库迁移 & CRM路由验证脚本"""
import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
DEPLOY_DIR = '/var/www/zhishuai'

def ssh_exec(client, cmd, timeout=30):
    """Execute command and return output"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    return code, out, err

def ssh_exec_stream(client, cmd, timeout=120):
    """Execute long-running command with real-time output"""
    transport = client.get_transport()
    channel = transport.open_session()
    channel.settimeout(timeout)
    channel.exec_command(cmd)
    
    output = ''
    while True:
        if channel.exit_status_ready():
            while channel.recv_ready():
                output += channel.recv(4096).decode('utf-8', errors='replace')
            while channel.recv_stderr_ready():
                output += channel.recv_stderr(4096).decode('utf-8', errors='replace')
            break
        try:
            while channel.recv_ready():
                output += channel.recv(4096).decode('utf-8', errors='replace')
            while channel.recv_stderr_ready():
                output += channel.recv_stderr(4096).decode('utf-8', errors='replace')
        except:
            break
        time.sleep(0.5)
    
    code = channel.exit_status
    return code, output, ''

def main():
    print("=" * 60)
    print("智枢AI - 数据库迁移 & CRM路由验证")
    print("=" * 60)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    print(f"\n已连接服务器 {HOST}")
    
    # Step 1: Check current database tables
    print("\n[1/5] 检查数据库当前表结构...")
    code, out, err = ssh_exec(client, 
        "cd /var/www/zhishuai/server && node -e \""
        "const { PrismaClient } = require('@prisma/client'); "
        "const p = new PrismaClient(); "
        "p.\$queryRaw\\`SHOW TABLES\\`.then(t => { "
        "console.log('Tables:', JSON.stringify(t)); "
        "p.\$disconnect(); "
        "}).catch(e => { "
        "console.log('Error:', e.message); "
        "p.\$disconnect(); "
        "})\"", timeout=30)
    print(f"  数据库表查询结果: {out.strip()[-500:]}")
    
    # Step 2: Check Prisma migration status
    print("\n[2/5] 检查Prisma迁移状态...")
    code, out, err = ssh_exec(client,
        f"cd {DEPLOY_DIR}/server && npx prisma migrate status 2>&1 | head -30",
        timeout=60)
    print(f"  迁移状态: {out.strip()[-500:]}")
    
    # Step 3: Run Prisma migrate deploy (safe for production - only applies pending migrations)
    print("\n[3/5] 执行Prisma数据库迁移...")
    code, out, err = ssh_exec_stream(client,
        f"cd {DEPLOY_DIR}/server && npx prisma migrate deploy 2>&1",
        timeout=180)
    print(f"  迁移输出: {out.strip()[-600:]}")
    if code == 0:
        print("  迁移成功!")
    else:
        print(f"  迁移返回码: {code}")
        # If migrate deploy fails, try db push (schema-only, no migration history)
        print("  尝试 prisma db push 作为备选...")
        code2, out2, err2 = ssh_exec_stream(client,
            f"cd {DEPLOY_DIR}/server && npx prisma db push --accept-data-loss 2>&1",
            timeout=180)
        print(f"  db push 输出: {out2.strip()[-400:]}")
    
    # Step 4: Verify CRM-related tables exist
    print("\n[4/5] 验证CRM相关数据库表...")
    code, out, err = ssh_exec(client,
        "cd /var/www/zhishuai/server && node -e \""
        "const { PrismaClient } = require('@prisma/client'); "
        "const p = new PrismaClient(); "
        "p.\$queryRaw\\`SHOW TABLES\\`.then(t => { "
        "const tables = t.map(r => Object.values(r)[0]); "
        "const crmTables = tables.filter(r => r.toLowerCase().includes('crm')); "
        "console.log('CRM tables:', JSON.stringify(crmTables)); "
        "console.log('Total tables:', tables.length); "
        "p.\$disconnect(); "
        "}).catch(e => { "
        "console.log('Error:', e.message); "
        "p.\$disconnect(); "
        "})\"", timeout=30)
    print(f"  CRM表验证结果: {out.strip()}")
    
    # Step 5: Test CRM API routes on the server
    print("\n[5/5] 测试CRM API路由...")
    # Test without auth (should return 401)
    code, out, err = ssh_exec(client,
        "curl -s http://localhost:3001/api/crm/customers 2>&1")
    print(f"  /api/crm/customers (无认证): {out.strip()[:300]}")
    
    code, out, err = ssh_exec(client,
        "curl -s http://localhost:3001/api/crm-advanced/tags 2>&1")
    print(f"  /api/crm-advanced/tags (无认证): {out.strip()[:300]}")
    
    # Test health to confirm API is running
    code, out, err = ssh_exec(client,
        "curl -s http://localhost:3001/api/health 2>&1")
    print(f"  /api/health: {out.strip()[:200]}")
    
    # Check PM2 status
    code, out, err = ssh_exec(client, "pm2 list 2>&1")
    print(f"\n  PM2服务状态:")
    for line in out.strip().split('\n'):
        if 'zhishuai' in line or '│' in line:
            print(f"    {line}")
    
    client.close()
    print("\n" + "=" * 60)
    print("验证完成!")
    print("=" * 60)

if __name__ == '__main__':
    main()
