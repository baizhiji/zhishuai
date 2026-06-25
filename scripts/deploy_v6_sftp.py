import paramiko, os, sys, io, glob, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SERVER = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_PATH = '/var/www/zhishuai'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

sftp = ssh.open_sftp()

def upload(local_path, remote_path):
    if not os.path.exists(local_path):
        print(f'  SKIP: {local_path}')
        return
    # Create remote directory
    remote_dir = os.path.dirname(remote_path)
    try:
        sftp.stat(remote_dir)
    except:
        ssh.exec_command(f'mkdir -p {remote_dir}', timeout=10)
        time.sleep(1)
    try:
        sftp.put(local_path, remote_path)
        size = sftp.stat(remote_path).st_size
        print(f'  OK: {os.path.basename(local_path)} ({size} bytes)')
    except Exception as e:
        print(f'  ERROR: {e}')

print('=== V6 SFTP Deployment ===\n')

base = 'c:\\Users\\Administrator\\zhishuai'

# 1. Server backend
print('[1] Server backend...')
upload(f'{base}/server/dist/services/browser-auth.service.js', f'{REMOTE_PATH}/server/dist/services/browser-auth.service.js')
upload(f'{base}/server/dist/routes/oauth.js', f'{REMOTE_PATH}/server/dist/routes/oauth.js')

# 2. Frontend SSR pages  
print('\n[2] Frontend SSR pages...')
for page_dir in [
    'web/.next/server/app/customer/media/matrix',
    'web/.next/server/app/customer/recruitment/platforms',
]:
    local_dir = os.path.join(base, page_dir)
    if os.path.exists(local_dir):
        for f in glob.glob(os.path.join(local_dir, '*.js')):
            upload(f, f'{REMOTE_PATH}/{page_dir}/{os.path.basename(f)}')

# 3. Frontend static chunks for specific pages
print('\n[3] Frontend static chunks...')
for chunk_dir in [
    'web/.next/static/chunks/app/customer/media/matrix',
    'web/.next/static/chunks/app/customer/recruitment/platforms',
]:
    local_dir = os.path.join(base, chunk_dir)
    if os.path.exists(local_dir):
        for f in glob.glob(os.path.join(local_dir, '*.js')):
            upload(f, f'{REMOTE_PATH}/{chunk_dir}/{os.path.basename(f)}')

# 4. Shared chunks (recently modified)
print('\n[4] Recent shared chunks...')
shared_dir = os.path.join(base, 'web\\.next\\static\\chunks')
recent_time = time.time() - 300
count = 0
for f in glob.glob(os.path.join(shared_dir, '*.js')):
    if os.path.getmtime(f) > recent_time:
        fname = os.path.basename(f)
        upload(f, f'{REMOTE_PATH}/web/.next/static/chunks/{fname}')
        count += 1
print(f'  Uploaded {count} shared chunks')

# Also upload the webpack runtime and main app files
print('\n[5] Core web files...')
for core_dir in ['web/.next/static']:
    local_dir = os.path.join(base, core_dir)
    # Just upload the _buildManifest.js and _ssgManifest.js
    for pattern in ['_buildManifest.js', '_ssgManifest.js']:
        f = os.path.join(local_dir, pattern)
        if os.path.exists(f):
            upload(f, f'{REMOTE_PATH}/{core_dir}/{pattern}')

# 6. Restart
print('\n[6] Restarting...')
stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_PATH}/server && pm2 restart zhishuai-api && sleep 2 && cd {REMOTE_PATH}/web && pm2 restart zhishuai-web', timeout=30)
stdout.read()
time.sleep(5)

# 7. Verify
print('\n[7] Verify...')
stdin, stdout, stderr = ssh.exec_command('pm2 list --no-color | grep zhishuai', timeout=10)
print(stdout.read().decode())

# V6 markers
stdin, stdout, stderr = ssh.exec_command(f'grep -c "Auth-V6" {REMOTE_PATH}/server/dist/services/browser-auth.service.js', timeout=10)
print(f'V6 markers: {stdout.read().decode().strip()}')

stdin, stdout, stderr = ssh.exec_command(f'grep -c "playwright" {REMOTE_PATH}/server/dist/services/browser-auth.service.js', timeout=10)
print(f'Playwright refs: {stdout.read().decode().strip()} (should be 0)')

# Test API
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/oauth/platforms 2>&1 | head -3', timeout=10)
result = stdout.read().decode()
print(f'API test: {result[:500]}')

# Check API health
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/oauth/platforms', timeout=10)
code = stdout.read().decode().strip()
print(f'API HTTP status: {code}')

sftp.close()
ssh.close()
print('\n=== V6 Deployment Complete ===')
