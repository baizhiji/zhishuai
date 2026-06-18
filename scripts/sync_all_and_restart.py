import paramiko, os

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)
sftp = c.open_sftp()

# Upload missing middleware/ownership.ts and any other files that may have been missed
local_base = 'c:/Users/Administrator/zhishuai/server/src'

# Check which files are referenced as imports but might be missing on server
missing_files = [
    'middleware/ownership.ts',
    'services/ai-model-router.ts',
    'services/scheduler.ts',
    'services/sentry.ts',
    'utils/errors.ts',
    'utils/swagger.ts',
    'middleware/ai-quota.ts',  # re-upload to be safe
]

# Also scan all route files for imports and check they exist on server
for f in missing_files:
    local = os.path.join(local_base, f)
    remote = f'/www/zhishuai/server/src/{f}'
    if os.path.exists(local):
        print(f'Uploading {f}...')
        sftp.put(local, remote)
    else:
        print(f'SKIP {f} (not found locally)')

# Check ALL files in middleware/ directory on local
local_middleware = os.path.join(local_base, 'middleware')
for fname in os.listdir(local_middleware):
    if fname.endswith('.ts'):
        local = os.path.join(local_middleware, fname)
        remote = f'/www/zhishuai/server/src/middleware/{fname}'
        try:
            sftp.stat(remote)
            # Check if sizes differ
            local_stat = os.stat(local)
            remote_stat = sftp.stat(remote)
            if local_stat.st_size != remote_stat.st_size:
                print(f'Updating middleware/{fname} (size differs: local={local_stat.st_size}, remote={remote_stat.st_size})')
                sftp.put(local, remote)
            else:
                print(f'OK middleware/{fname}')
        except FileNotFoundError:
            print(f'Creating middleware/{fname} (missing on server)')
            sftp.put(local, remote)

# Check ALL services/ files
local_services = os.path.join(local_base, 'services')
for fname in os.listdir(local_services):
    if fname.endswith('.ts'):
        local = os.path.join(local_services, fname)
        remote = f'/www/zhishuai/server/src/services/{fname}'
        try:
            sftp.stat(remote)
            local_stat = os.stat(local)
            remote_stat = sftp.stat(remote)
            if local_stat.st_size != remote_stat.st_size:
                print(f'Updating services/{fname} (differs)')
                sftp.put(local, remote)
            else:
                print(f'OK services/{fname}')
        except FileNotFoundError:
            print(f'Creating services/{fname} (missing on server)')
            sftp.put(local, remote)

# Check ALL utils/ files
local_utils = os.path.join(local_base, 'utils')
if os.path.exists(local_utils):
    for fname in os.listdir(local_utils):
        if fname.endswith('.ts'):
            local = os.path.join(local_utils, fname)
            remote = f'/www/zhishuai/server/src/utils/{fname}'
            try:
                sftp.stat(remote)
                local_stat = os.stat(local)
                remote_stat = sftp.stat(remote)
                if local_stat.st_size != remote_stat.st_size:
                    print(f'Updating utils/{fname} (differs)')
                    sftp.put(local, remote)
                else:
                    print(f'OK utils/{fname}')
            except FileNotFoundError:
                print(f'Creating utils/{fname} (missing on server)')
                sftp.put(local, remote)

# Check ALL routes/ files
local_routes = os.path.join(local_base, 'routes')
for fname in os.listdir(local_routes):
    if fname.endswith('.ts'):
        local = os.path.join(local_routes, fname)
        remote = f'/www/zhishuai/server/src/routes/{fname}'
        try:
            sftp.stat(remote)
            local_stat = os.stat(local)
            remote_stat = sftp.stat(remote)
            if local_stat.st_size != remote_stat.st_size:
                print(f'Updating routes/{fname} (differs)')
                sftp.put(local, remote)
            else:
                print(f'OK routes/{fname}')
        except FileNotFoundError:
            print(f'Creating routes/{fname} (missing on server)')
            sftp.put(local, remote)

sftp.close()

# Now restart API
cmds = [
    'pm2 delete zhishuai-api 2>/dev/null; pkill -f "tsx" 2>/dev/null',
    'cd /www/zhishuai/server && PORT=3001 NODE_ENV=production pm2 start "npx tsx src/index.ts" --name zhishuai-api 2>&1',
    'sleep 20',
    'curl -s http://localhost:3001/api/health',
    'pm2 save 2>&1',
]

for cmd in cmds:
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=35)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:800].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err and 'Warning' not in err: print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== ALL DONE ===')
