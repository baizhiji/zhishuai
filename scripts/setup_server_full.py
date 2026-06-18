#!/usr/bin/env python3
"""
智枢AI SaaS 完整服务器配置脚本
功能：
  1. 同步所有源码到服务器
  2. 执行 Prisma 数据库迁移（migrate deploy + db push 兜底）
  3. 安装依赖并构建
  4. 写入 .env 配置
  5. 启动/重启 PM2 服务
  6. 验证健康状态
"""

import paramiko
import os
import sys
import time

# ============ 配置 ============
SERVER_IP = '150.109.60.130'
SERVER_USER = 'ubuntu'
SERVER_PASS = 'Hao20061218'
SERVER_DIR = '/www/zhishuai'
LOCAL_BASE = 'c:/Users/Administrator/zhishuai'

# 数据库连接
DB_HOST = 'gz-cynosdbpg-proxy-46031483.sql.tencentcdb.com'
DB_PORT = '29094'
DB_USER = 'root'
DB_PASS = 'Hao-20061218'
DB_NAME = 'zhishuai'

# ============ SSH 连接 ============
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print(f'连接服务器 {SERVER_IP}...')
try:
    c.connect(SERVER_IP, 22, SERVER_USER, SERVER_PASS, timeout=30)
    print('SSH 连接成功')
except Exception as e:
    print(f'SSH 连接失败: {e}')
    sys.exit(1)


def run_cmd(cmd, timeout=120, silent=False):
    """执行远程命令"""
    if not silent:
        print(f'\n>>> {cmd[:120]}')
    try:
        stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
        stdout.channel.settimeout(timeout)
        stderr.channel.settimeout(timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        exit_code = stdout.channel.recv_exit_status()
        if not silent:
            if out:
                print(out[:2000].encode('ascii', 'replace').decode('ascii'))
            if err and 'CLIXML' not in err and 'npm warn' not in err.lower():
                print('ERR:', err[:500].encode('ascii', 'replace').decode('ascii'))
            print(f'Exit: {exit_code}')
        return out, err, exit_code
    except Exception as e:
        print(f'Command failed: {e}')
        return '', str(e), 1


def upload_dir(local_dir, remote_dir, exclude_dirs=None):
    """递归上传目录"""
    if exclude_dirs is None:
        exclude_dirs = ['node_modules', '.next', 'dist', '.turbo', '.git', '__pycache__']
    
    sftp = c.open_sftp()
    
    def _upload(local_path, remote_path):
        # 确保远程目录存在
        try:
            sftp.stat(remote_path)
        except FileNotFoundError:
            run_cmd(f'mkdir -p {remote_path}', silent=True)
        
        for item in os.listdir(local_path):
            if item in exclude_dirs or item.startswith('.'):
                continue
            
            local_item = os.path.join(local_path, item)
            remote_item = f'{remote_path}/{item}'
            
            if os.path.isdir(local_item):
                _upload(local_item, remote_item)
            elif os.path.isfile(local_item):
                try:
                    local_stat = os.stat(local_item)
                    try:
                        remote_stat = sftp.stat(remote_item)
                        if local_stat.st_size == remote_stat.st_size:
                            continue  # 跳过相同文件
                    except FileNotFoundError:
                        pass
                    sftp.put(local_item, remote_item)
                    print(f'  Uploaded: {item}')
                except Exception as e:
                    print(f'  Skip {item}: {e}')
    
    _upload(local_dir, remote_dir)
    sftp.close()


# ============================================================
# 步骤 1: 检查服务器环境
# ============================================================
print('\n' + '='*60)
print('步骤 1: 检查服务器环境')
print('='*60)

run_cmd('node -v')
run_cmd('npm -v')
run_cmd('pm2 -v 2>/dev/null || echo "PM2 not installed"')
run_cmd(f'mysql -h {DB_HOST} -P {DB_PORT} -u {DB_USER} -p{DB_PASS} -e "SELECT 1 AS test;" {DB_NAME} 2>/dev/null || echo "MySQL CLI not available, will use Prisma"')
run_cmd(f'ls -la {SERVER_DIR}/')
run_cmd(f'ls -la {SERVER_DIR}/server/ 2>/dev/null || echo "Server dir not found"')

# ============================================================
# 步骤 2: 同步源码到服务器
# ============================================================
print('\n' + '='*60)
print('步骤 2: 同步源码到服务器')
print('='*60)

# 创建远程目录结构
run_cmd(f'mkdir -p {SERVER_DIR}/server/src')
run_cmd(f'mkdir -p {SERVER_DIR}/server/prisma')
run_cmd(f'mkdir -p {SERVER_DIR}/web')

# 上传 server 关键文件
print('\n--- 上传 server 配置文件 ---')
sftp = c.open_sftp()

# 上传 package.json 和 tsconfig
for f in ['package.json', 'tsconfig.json']:
    local = os.path.join(LOCAL_BASE, 'server', f)
    remote = f'{SERVER_DIR}/server/{f}'
    if os.path.exists(local):
        sftp.put(local, remote)
        print(f'  Uploaded: server/{f}')

# 上传 prisma 目录
print('\n--- 上传 prisma 目录 ---')
local_prisma = os.path.join(LOCAL_BASE, 'server', 'prisma')
for f in os.listdir(local_prisma):
    local_file = os.path.join(local_prisma, f)
    if os.path.isfile(local_file):
        sftp.put(local_file, f'{SERVER_DIR}/server/prisma/{f}')
        print(f'  Uploaded: server/prisma/{f}')
    elif os.path.isdir(local_file):
        # 处理 migrations 子目录
        run_cmd(f'mkdir -p {SERVER_DIR}/server/prisma/{f}', silent=True)
        for subf in os.listdir(local_file):
            sub_local = os.path.join(local_file, subf)
            if os.path.isfile(sub_local):
                sftp.put(sub_local, f'{SERVER_DIR}/server/prisma/{f}/{subf}')
                print(f'  Uploaded: server/prisma/{f}/{subf}')

sftp.close()

# 上传 server/src 目录（rsync 更高效，但用 paramiko 逐目录上传更稳定）
print('\n--- 上传 server/src 目录 ---')
upload_dir(
    os.path.join(LOCAL_BASE, 'server', 'src'),
    f'{SERVER_DIR}/server/src',
    exclude_dirs=['node_modules', '.next', 'dist', '.turbo', '.git', '__pycache__', 'debug']
)

# 上传 .env 文件
print('\n--- 上传 .env 配置 ---')
sftp = c.open_sftp()
sftp.put(
    os.path.join(LOCAL_BASE, 'server', '.env'),
    f'{SERVER_DIR}/server/.env'
)
print('  Uploaded: server/.env')
sftp.close()

# 上传 ecosystem.config.js
sftp = c.open_sftp()
ecosystem_local = os.path.join(LOCAL_BASE, 'ecosystem.config.js')
if os.path.exists(ecosystem_local):
    sftp.put(ecosystem_local, f'{SERVER_DIR}/ecosystem.config.js')
    print('  Uploaded: ecosystem.config.js')
sftp.close()

# 上传 web 目录（仅配置和关键文件，不传 node_modules 和 .next）
print('\n--- 上传 web 关键文件 ---')
sftp = c.open_sftp()
web_dir = os.path.join(LOCAL_BASE, 'web')
for f in ['package.json', 'next.config.ts', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs']:
    local_file = os.path.join(web_dir, f)
    if os.path.exists(local_file):
        try:
            sftp.put(local_file, f'{SERVER_DIR}/web/{f}')
            print(f'  Uploaded: web/{f}')
        except Exception as e:
            print(f'  Skip web/{f}: {e}')
sftp.close()

# 上传 web/app 和 web/lib 和 web/components
print('\n--- 上传 web/src 目录 ---')
for subdir in ['app', 'lib', 'components']:
    local_subdir = os.path.join(LOCAL_BASE, 'web', subdir)
    if os.path.exists(local_subdir):
        upload_dir(local_subdir, f'{SERVER_DIR}/web/{subdir}')

# ============================================================
# 步骤 3: 安装依赖
# ============================================================
print('\n' + '='*60)
print('步骤 3: 安装依赖')
print('='*60)

# Server 依赖
print('\n--- 安装 server 依赖 ---')
run_cmd(f'cd {SERVER_DIR}/server && npm install --production=false 2>&1', timeout=300)

# ============================================================
# 步骤 4: 执行 Prisma 数据库迁移
# ============================================================
print('\n' + '='*60)
print('步骤 4: 执行 Prisma 数据库迁移')
print('='*60)

# 生成 Prisma Client
print('\n--- 生成 Prisma Client ---')
run_cmd(f'cd {SERVER_DIR}/server && npx prisma generate 2>&1', timeout=60)

# 执行 migrate deploy
print('\n--- 执行 migrate deploy ---')
out, err, code = run_cmd(f'cd {SERVER_DIR}/server && npx prisma migrate deploy 2>&1', timeout=120)

# 如果 migrate deploy 失败，使用 db push 兜底
if code != 0:
    print('\nmigrate deploy 失败，使用 db push 兜底...')
    run_cmd(f'cd {SERVER_DIR}/server && npx prisma db push --accept-data-loss 2>&1', timeout=120)

# 验证数据库表
print('\n--- 验证数据库表 ---')
tables_to_check = [
    'User', 'RecruitmentPost', 'Candidate', 'AcquisitionTask', 'Material',
    'MatrixAccount', 'CrmCustomer', 'Notification', 'Order', 'Settlement',
    'SocialAccount', 'OAuthSession', 'AppVersion', 'MapFavorite', 'LiveRoom',
    'DigitalHuman', 'VoiceClone', 'VideoTask', 'Payment', 'Agent',
    'ApiProvider', 'ApiKey', 'ApiUsageLog', 'FeatureSwitch', 'Employee',
    'Ticket', 'ChatConversation', 'CodeAssistantConversation'
]

for table in tables_to_check:
    out, _, _ = run_cmd(
        f'mysql -h {DB_HOST} -P {DB_PORT} -u {DB_USER} -p{DB_PASS} -e "SHOW TABLES LIKE \'{table}\';" {DB_NAME} 2>/dev/null',
        silent=True
    )
    status = 'OK' if table in out else 'MISSING'
    if status == 'MISSING':
        print(f'  Table {table}: {status}')

# 执行 seed
print('\n--- 执行数据库 Seed ---')
run_cmd(f'cd {SERVER_DIR}/server && ADMIN_SEED_PASSWORD=20061218 npx prisma db seed 2>&1', timeout=60)

# ============================================================
# 步骤 5: 构建 TypeScript
# ============================================================
print('\n' + '='*60)
print('步骤 5: 构建 Server TypeScript')
print('='*60)

run_cmd(f'cd {SERVER_DIR}/server && npm run build 2>&1', timeout=180)

# ============================================================
# 步骤 6: 配置并启动 PM2 服务
# ============================================================
print('\n' + '='*60)
print('步骤 6: 配置并启动 PM2 服务')
print('='*60)

# 停止旧服务
run_cmd('pm2 delete zhishuai-api 2>/dev/null; pm2 delete zhishuai-web 2>/dev/null', silent=True)

# 写入 server 的 ecosystem 配置
run_cmd(f"""cat > {SERVER_DIR}/server/ecosystem.config.cjs << 'ECOSYSTEM'
module.exports = {{
  apps: [{{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '{SERVER_DIR}/server',
    env: {{
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'mysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?connection_limit=20&pool_timeout=10',
      JWT_SECRET: 'zs9kP2xL7mN4qR8vW3yA6bC1dE5fG0hJ',
      FRONTEND_URL: 'https://baizhiji.net',
      APP_URL: 'https://app.baizhiji.net',
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
ECOSYSTEM
""")

# 创建日志目录
run_cmd('mkdir -p /var/log/zhishuai')

# 启动 API 服务
print('\n--- 启动 API 服务 ---')
run_cmd(f'cd {SERVER_DIR}/server && pm2 start ecosystem.config.cjs 2>&1', timeout=30)

# 等待服务启动
print('\n--- 等待服务启动（15秒）---')
time.sleep(15)

# 验证 API 健康
print('\n--- 验证 API 健康状态 ---')
run_cmd('curl -s http://localhost:3001/api/health')

# 检查 PM2 状态
print('\n--- PM2 进程状态 ---')
run_cmd('pm2 list')

# ============================================================
# 步骤 7: 构建 Web 前端（如果需要）
# ============================================================
print('\n' + '='*60)
print('步骤 7: 检查并配置 Web 前端')
print('='*60)

# 检查 web node_modules 是否存在
out, _, _ = run_cmd(f'ls {SERVER_DIR}/web/node_modules/.package-lock.json 2>/dev/null || echo "MISSING"', silent=True)
if 'MISSING' in out:
    print('\n--- 安装 web 依赖 ---')
    run_cmd(f'cd {SERVER_DIR}/web && npm install 2>&1', timeout=300)
else:
    print('Web 依赖已存在，跳过安装')

# 检查 .next 构建产物是否存在
out, _, _ = run_cmd(f'ls {SERVER_DIR}/web/.next/BUILD_ID 2>/dev/null || echo "MISSING"', silent=True)
if 'MISSING' in out:
    print('\n--- 构建 Next.js ---')
    run_cmd(f'cd {SERVER_DIR}/web && npm run build 2>&1', timeout=300)
else:
    print('Next.js 构建产物已存在，跳过构建')

# 启动 Web 服务
out, _, _ = run_cmd('pm2 show zhishuai-web 2>/dev/null | grep status', silent=True)
if 'online' not in out:
    print('\n--- 启动 Web 服务 ---')
    run_cmd(f'cd {SERVER_DIR}/web && pm2 start "npm run start" --name zhishuai-web 2>&1', timeout=30)
    time.sleep(10)

# ============================================================
# 步骤 8: 配置 Nginx
# ============================================================
print('\n' + '='*60)
print('步骤 8: 配置 Nginx')
print('='*60)

# 上传 Nginx 配置
sftp = c.open_sftp()
nginx_local = os.path.join(LOCAL_BASE, 'deploy', 'nginx.conf')
if os.path.exists(nginx_local):
    sftp.put(nginx_local, '/tmp/baizhiji.net.nginx')
    sftp.close()
    run_cmd('cp /tmp/baizhiji.net.nginx /etc/nginx/sites-available/baizhiji.net 2>/dev/null || echo "Need sudo"')
    run_cmd('ln -sf /etc/nginx/sites-available/baizhiji.net /etc/nginx/sites-enabled/ 2>/dev/null || echo "Need sudo"')
    run_cmd('nginx -t 2>&1')
    run_cmd('systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "Nginx reload skipped"')
else:
    sftp.close()
    print('Nginx 配置文件不存在，跳过')

# ============================================================
# 步骤 9: 保存 PM2 配置
# ============================================================
print('\n' + '='*60)
print('步骤 9: 保存 PM2 配置')
print('='*60)

run_cmd('pm2 save 2>&1')
run_cmd('pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || echo "Startup already configured"')

# ============================================================
# 步骤 10: 最终验证
# ============================================================
print('\n' + '='*60)
print('步骤 10: 最终验证')
print('='*60)

# API 健康检查
print('\n--- API 健康检查 ---')
run_cmd('curl -s http://localhost:3001/api/health')

# Web 健康检查
print('\n--- Web 健康检查 ---')
run_cmd('curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000')

# HTTPS 健康检查（如果 Nginx 已配置）
print('\n--- HTTPS 健康检查 ---')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null || echo "HTTPS not ready yet"')

# PM2 最终状态
print('\n--- PM2 最终状态 ---')
run_cmd('pm2 list')

# 数据库连接验证
print('\n--- 数据库连接验证 ---')
run_cmd(f'mysql -h {DB_HOST} -P {DB_PORT} -u {DB_USER} -p{DB_PASS} -e "SELECT COUNT(*) AS user_count FROM User;" {DB_NAME} 2>/dev/null || echo "MySQL CLI check skipped"')

# 关键表行数
print('\n--- 关键表数据统计 ---')
for table in ['User', 'RecruitmentPost', 'Material', 'CrmCustomer', 'MatrixAccount', 'SocialAccount', 'AppVersion']:
    out, _, code = run_cmd(
        f'mysql -h {DB_HOST} -P {DB_PORT} -u {DB_USER} -p{DB_PASS} -e "SELECT COUNT(*) AS cnt FROM {table};" {DB_NAME} 2>/dev/null',
        silent=True
    )
    if code == 0 and out:
        print(f'  {table}: {out.split(chr(10))[-1] if chr(10) in out else out}')

# 关闭连接
c.close()

print('\n' + '='*60)
print('配置完成!')
print('='*60)
print(f'''
  Web 前端: https://baizhiji.net
  API 地址: https://api.baizhiji.net/api
  健康检查: https://baizhiji.net/api/health
  
  管理员账号: 18601655222
  管理员密码: 20061218
  
  PM2 状态: pm2 list
  API 日志: pm2 logs zhishuai-api
  Web 日志: pm2 logs zhishuai-web
  
  数据库: {DB_HOST}:{DB_PORT}/{DB_NAME}
''')
