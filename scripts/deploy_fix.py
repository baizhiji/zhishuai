#!/usr/bin/env python3
"""
智枢AI SaaS - 修复后同步到服务器并重新部署
"""
import paramiko
import os
import time

SERVER_IP = '150.109.60.130'
SERVER_USER = 'ubuntu'
SERVER_PASS = 'Hao20061218'
SERVER_DIR = '/www/zhishuai'
LOCAL_BASE = 'c:/Users/Administrator/zhishuai'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f'连接服务器 {SERVER_IP}...')
c.connect(SERVER_IP, 22, SERVER_USER, SERVER_PASS, timeout=30)
print('SSH 连接成功')

def run_cmd(cmd, timeout=120, silent=False):
    print(f'\n>>> {cmd[:120]}')
    try:
        stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        stderr.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        code = stdout.channel.recv_exit_status()
        if not silent:
            if out:
                print(out[:3000].encode('ascii', 'replace').decode('ascii'))
            if err and 'CLIXML' not in err and 'npm warn' not in err.lower():
                print('ERR:', err[:800].encode('ascii', 'replace').decode('ascii'))
            print(f'Exit: {code}')
        return out, err, code
    except Exception as e:
        if not silent:
            print(f'FAILED: {e}')
        return '', str(e), 1

# ============================================================
# 1. 上传修复后的文件
# ============================================================
print('\n' + '='*60)
print('1. 上传修复后的文件')
print('='*60)

sftp = c.open_sftp()

# 修复的文件列表
fixes = [
    ('server/src/services/ai-service.ts', f'{SERVER_DIR}/server/src/services/ai-service.ts'),
    ('server/prisma/schema.prisma', f'{SERVER_DIR}/server/prisma/schema.prisma'),
]

for local_rel, remote in fixes:
    local = os.path.join(LOCAL_BASE, local_rel)
    if os.path.exists(local):
        sftp.put(local, remote)
        print(f'  Uploaded: {local_rel}')
    else:
        print(f'  SKIP: {local_rel} (not found)')

# 上传所有 routes 文件（可能有更新）
routes_dir = os.path.join(LOCAL_BASE, 'server', 'src', 'routes')
if os.path.exists(routes_dir):
    for fname in os.listdir(routes_dir):
        if fname.endswith('.ts'):
            local = os.path.join(routes_dir, fname)
            remote = f'{SERVER_DIR}/server/src/routes/{fname}'
            try:
                local_stat = os.stat(local)
                try:
                    remote_stat = sftp.stat(remote)
                    if local_stat.st_size != remote_stat.st_size:
                        sftp.put(local, remote)
                        print(f'  Updated: routes/{fname}')
                except FileNotFoundError:
                    sftp.put(local, remote)
                    print(f'  New: routes/{fname}')
            except Exception as e:
                print(f'  Error routes/{fname}: {e}')

# 上传所有 services 文件
services_dir = os.path.join(LOCAL_BASE, 'server', 'src', 'services')
if os.path.exists(services_dir):
    for fname in os.listdir(services_dir):
        if fname.endswith('.ts'):
            local = os.path.join(services_dir, fname)
            remote = f'{SERVER_DIR}/server/src/services/{fname}'
            try:
                local_stat = os.stat(local)
                try:
                    remote_stat = sftp.stat(remote)
                    if local_stat.st_size != remote_stat.st_size:
                        sftp.put(local, remote)
                        print(f'  Updated: services/{fname}')
                except FileNotFoundError:
                    sftp.put(local, remote)
                    print(f'  New: services/{fname}')
            except Exception as e:
                print(f'  Error services/{fname}: {e}')

# 上传所有 middleware 文件
middleware_dir = os.path.join(LOCAL_BASE, 'server', 'src', 'middleware')
if os.path.exists(middleware_dir):
    for fname in os.listdir(middleware_dir):
        if fname.endswith('.ts'):
            local = os.path.join(middleware_dir, fname)
            remote = f'{SERVER_DIR}/server/src/middleware/{fname}'
            try:
                local_stat = os.stat(local)
                try:
                    remote_stat = sftp.stat(remote)
                    if local_stat.st_size != remote_stat.st_size:
                        sftp.put(local, remote)
                        print(f'  Updated: middleware/{fname}')
                except FileNotFoundError:
                    sftp.put(local, remote)
                    print(f'  New: middleware/{fname}')
            except Exception as e:
                print(f'  Error middleware/{fname}: {e}')

# 上传 utils 文件
utils_dir = os.path.join(LOCAL_BASE, 'server', 'src', 'utils')
if os.path.exists(utils_dir):
    for fname in os.listdir(utils_dir):
        if fname.endswith('.ts'):
            local = os.path.join(utils_dir, fname)
            remote = f'{SERVER_DIR}/server/src/utils/{fname}'
            try:
                local_stat = os.stat(local)
                try:
                    remote_stat = sftp.stat(remote)
                    if local_stat.st_size != remote_stat.st_size:
                        sftp.put(local, remote)
                        print(f'  Updated: utils/{fname}')
                except FileNotFoundError:
                    sftp.put(local, remote)
                    print(f'  New: utils/{fname}')
            except Exception as e:
                print(f'  Error utils/{fname}: {e}')

# 上传 index.ts
sftp.put(os.path.join(LOCAL_BASE, 'server', 'src', 'index.ts'), f'{SERVER_DIR}/server/src/index.ts')
print('  Uploaded: src/index.ts')

# 上传 .env
sftp.put(os.path.join(LOCAL_BASE, 'server', '.env'), f'{SERVER_DIR}/server/.env')
print('  Uploaded: server/.env')

# 上传 prisma migrations 目录
migrations_dir = os.path.join(LOCAL_BASE, 'server', 'prisma', 'migrations')
if os.path.exists(migrations_dir):
    for mig_name in os.listdir(migrations_dir):
        mig_path = os.path.join(migrations_dir, mig_name)
        if os.path.isdir(mig_path):
            run_cmd(f'mkdir -p {SERVER_DIR}/server/prisma/migrations/{mig_name}', silent=True)
            for f in os.listdir(mig_path):
                local_file = os.path.join(mig_path, f)
                if os.path.isfile(local_file):
                    sftp.put(local_file, f'{SERVER_DIR}/server/prisma/migrations/{mig_name}/{f}')
                    print(f'  Uploaded: prisma/migrations/{mig_name}/{f}')

sftp.close()

# ============================================================
# 2. 服务器上：Prisma generate + migrate
# ============================================================
print('\n' + '='*60)
print('2. 执行 Prisma generate + migrate')
print('='*60)

run_cmd(f'cd {SERVER_DIR}/server && npx prisma generate 2>&1', timeout=60)
run_cmd(f'cd {SERVER_DIR}/server && npx prisma migrate deploy 2>&1', timeout=120)

# 如果 migrate 失败，用 db push
out, err, code = run_cmd(f'cd {SERVER_DIR}/server && npx prisma migrate deploy 2>&1', timeout=120)
if code != 0:
    print('\nmigrate deploy 失败，尝试 db push...')
    run_cmd(f'cd {SERVER_DIR}/server && npx prisma db push 2>&1', timeout=120)

# ============================================================
# 3. 构建 TypeScript
# ============================================================
print('\n' + '='*60)
print('3. 构建 TypeScript')
print('='*60)

out, err, code = run_cmd(f'cd {SERVER_DIR}/server && npm run build 2>&1', timeout=180)
if code != 0:
    print('Build failed! Trying tsx instead...')
    # 如果 build 失败，用 tsx 直接运行
    print('将使用 tsx 运行模式替代编译模式')

# ============================================================
# 4. 启动 API 服务
# ============================================================
print('\n' + '='*60)
print('4. 启动 API 服务')
print('='*60)

# 停止旧服务
run_cmd('pm2 delete zhishuai-api 2>/dev/null', silent=True)
run_cmd('pkill -f "tsx.*index" 2>/dev/null', silent=True)

# 写入 ecosystem 配置
run_cmd(f"""cat > {SERVER_DIR}/server/ecosystem.config.cjs << 'EOF'
module.exports = {{
  apps: [{{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '{SERVER_DIR}/server',
    env: {{
      NODE_ENV: 'production',
      PORT: 3001,
    }},
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
    kill_timeout: 10000,
  }}]
}};
EOF
""")

# 检查 dist 是否存在，选择启动方式
out, _, _ = run_cmd(f'ls {SERVER_DIR}/server/dist/index.js 2>/dev/null || echo "MISSING"', silent=True)
if 'MISSING' not in out:
    # 使用编译后的 dist
    run_cmd(f'cd {SERVER_DIR}/server && pm2 start ecosystem.config.cjs 2>&1', timeout=30)
else:
    # 使用 tsx 直接运行
    run_cmd(f'cd {SERVER_DIR}/server && pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1', timeout=30)

# 等待启动
print('\n等待 API 服务启动（20秒）...')
time.sleep(20)

# ============================================================
# 5. Seed 数据库
# ============================================================
print('\n' + '='*60)
print('5. 初始化数据库 Seed')
print('='*60)

run_cmd(f'cd {SERVER_DIR}/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1', timeout=60)

# ============================================================
# 6. 验证
# ============================================================
print('\n' + '='*60)
print('6. 验证服务状态')
print('='*60)

# API 健康检查
print('\n--- API 健康检查 ---')
run_cmd('curl -s http://localhost:3001/api/health')

# Web 健康检查
print('\n--- Web 健康检查 ---')
out, _, _ = run_cmd('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000')
print(f'Web HTTP Status: {out}')

# PM2 状态
print('\n--- PM2 进程状态 ---')
run_cmd('pm2 list')

# 如果 API 有错误，查看日志
out, _, _ = run_cmd('curl -s http://localhost:3001/api/health', silent=True)
if not out or 'ok' not in out:
    print('\n--- API 错误日志 ---')
    run_cmd('pm2 logs zhishuai-api --lines 30 --nostream 2>&1', timeout=30)

# 保存 PM2
run_cmd('pm2 save 2>&1')

# 最终 HTTPS 验证
print('\n--- HTTPS 验证 ---')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null || echo "HTTPS not available"')

c.close()

print('\n' + '='*60)
print('部署完成!')
print('='*60)
print(f'''
  API: http://localhost:3001/api/health
  Web: https://baizhiji.net
  管理员: 18601655222 / 20061218
  日志: pm2 logs zhishuai-api
''')
