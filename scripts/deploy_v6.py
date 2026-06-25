import paramiko, base64, os, sys, io, glob
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SERVER = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_PATH = '/var/www/zhishuai'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASSWORD, timeout=15)

def upload_file(local_path, remote_path):
    """Upload a file via base64 encoding to avoid encoding issues"""
    if not os.path.exists(local_path):
        print(f'  SKIP: {local_path} not found')
        return False
    
    data = open(local_path, 'rb').read()
    b64 = base64.b64encode(data).decode('ascii')
    
    # Create directory and upload
    cmd = f"mkdir -p $(dirname '{remote_path}') && echo '{b64}' | base64 -d > '{remote_path}'"
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err:
        print(f'  ERROR uploading {remote_path}: {err[:200]}')
        return False
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command(f"stat -c '%s' '{remote_path}' 2>/dev/null || echo 'NOT_FOUND'", timeout=10)
    size = stdout.read().decode().strip()
    print(f'  OK: {os.path.basename(local_path)} -> {remote_path} ({size} bytes)')
    return True

print('=== V6 Deployment ===\n')

# 1. Upload server backend files
print('[1] Server backend files...')
server_files = [
    ('server/dist/services/browser-auth.service.js', f'{REMOTE_PATH}/server/dist/services/browser-auth.service.js'),
    ('server/dist/services/browser-auth.service.d.ts', f'{REMOTE_PATH}/server/dist/services/browser-auth.service.d.ts'),
    ('server/dist/routes/oauth.js', f'{REMOTE_PATH}/server/dist/routes/oauth.js'),
    ('server/dist/routes/oauth.d.ts', f'{REMOTE_PATH}/server/dist/routes/oauth.d.ts'),
]
for local, remote in server_files:
    upload_file(os.path.join('c:\\Users\\Administrator\\zhishuai', local), remote)

# 2. Upload frontend server-side rendered files
print('\n[2] Frontend SSR files...')
frontend_ssr_dirs = [
    'web/.next/server/app/customer/media/matrix',
    'web/.next/server/app/customer/recruitment/platforms',
]
for dir_path in frontend_ssr_dirs:
    local_dir = os.path.join('c:\\Users\\Administrator\\zhishuai', dir_path)
    if os.path.exists(local_dir):
        for f in glob.glob(os.path.join(local_dir, '*.js')):
            fname = os.path.basename(f)
            remote = f'{REMOTE_PATH}/{dir_path}/{fname}'
            upload_file(f, remote)

# 3. Upload frontend static chunks for the specific pages
print('\n[3] Frontend static chunks...')
frontend_chunk_dirs = [
    'web/.next/static/chunks/app/customer/media/matrix',
    'web/.next/static/chunks/app/customer/recruitment/platforms',
]
for dir_path in frontend_chunk_dirs:
    local_dir = os.path.join('c:\\Users\\Administrator\\zhishuai', dir_path)
    if os.path.exists(local_dir):
        for f in glob.glob(os.path.join(local_dir, '*.js')):
            fname = os.path.basename(f)
            remote = f'{REMOTE_PATH}/{dir_path}/{fname}'
            upload_file(f, remote)

# Also upload the shared chunks that changed
print('\n[4] Shared chunks...')
shared_chunks_dir = os.path.join('c:\\Users\\Administrator\\zhishuai', 'web\\.next\\static\\chunks')
# Find recently modified shared chunks (within 5 min)
import time
recent_time = time.time() - 300
for f in glob.glob(os.path.join(shared_chunks_dir, '*.js')):
    if os.path.getmtime(f) > recent_time:
        fname = os.path.basename(f)
        remote = f'{REMOTE_PATH}/web/.next/static/chunks/{fname}'
        upload_file(f, remote)

# 5. Restart services
print('\n[5] Restarting services...')
stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_PATH}/server && pm2 restart zhishuai-api && cd {REMOTE_PATH}/web && pm2 restart zhishuai-web', timeout=30)
print(stdout.read().decode('utf-8', errors='replace')[:500])
import time
time.sleep(5)

# 6. Verify
print('\n[6] Verification...')
stdin, stdout, stderr = ssh.exec_command('pm2 list --no-color | grep zhishuai', timeout=10)
print(stdout.read().decode('utf-8', errors='replace'))

# Check V6 code markers
stdin, stdout, stderr = ssh.exec_command(f'grep -c "Auth-V6" {REMOTE_PATH}/server/dist/services/browser-auth.service.js; grep -c "iframeUrl" {REMOTE_PATH}/server/dist/routes/oauth.js', timeout=10)
print('V6 markers:', stdout.read().decode().strip())

# Check that Playwright is no longer imported
stdin, stdout, stderr = ssh.exec_command(f'grep -c "playwright" {REMOTE_PATH}/server/dist/services/browser-auth.service.js', timeout=10)
pw_count = stdout.read().decode().strip()
print(f'Playwright references (should be 0): {pw_count}')

# Test API endpoint
print('\n[7] Test API...')
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/oauth/platforms 2>&1 | head -5', timeout=10)
print(stdout.read().decode('utf-8', errors='replace')[:500])

ssh.close()
print('\n=== V6 Deployment Complete ===')
