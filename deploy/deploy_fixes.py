import paramiko
import os
import glob

# SSH connection
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)
sftp = c.open_sftp()

# Key files that were modified and need to be uploaded to server
files_to_upload = [
    ('server/src/middleware/ai-quota.ts', '/www/zhishuai/server/src/middleware/ai-quota.ts'),
    ('server/src/routes/ai-chat.ts', '/www/zhishuai/server/src/routes/ai-chat.ts'),
    ('server/src/routes/auth.ts', '/www/zhishuai/server/src/routes/auth.ts'),
    ('server/src/routes/code-assistant.ts', '/www/zhishuai/server/src/routes/code-assistant.ts'),
    ('server/src/routes/ai-enhanced.ts', '/www/zhishuai/server/src/routes/ai-enhanced.ts'),
    ('server/src/routes/ai-workflow.ts', '/www/zhishuai/server/src/routes/ai-workflow.ts'),
    ('server/src/services/ai-workflow.ts', '/www/zhishuai/server/src/services/ai-workflow.ts'),
    ('server/src/routes/admin-api-providers.ts', '/www/zhishuai/server/src/routes/admin-api-providers.ts'),
    ('server/src/routes/admin-features.ts', '/www/zhishuai/server/src/routes/admin-features.ts'),
    ('server/src/routes/admin-agents.ts', '/www/zhishuai/server/src/routes/admin-agents.ts'),
    ('server/src/routes/admin-logs.ts', '/www/zhishuai/server/src/routes/admin-logs.ts'),
    ('server/src/index.ts', '/www/zhishuai/server/src/index.ts'),
]

local_base = 'c:/Users/Administrator/zhishuai'

for local_rel, remote_path in files_to_upload:
    local_path = os.path.join(local_base, local_rel)
    if os.path.exists(local_path):
        print(f'Uploading {local_rel}...')
        sftp.put(local_path, remote_path)
        print(f'  OK')
    else:
        print(f'  SKIP - file not found: {local_path}')

# Also upload the chat-history.service.ts (already exists but need to verify it's on server)
chat_history = os.path.join(local_base, 'server/src/services/chat-history.service.ts')
if os.path.exists(chat_history):
    print('Uploading chat-history.service.ts...')
    sftp.put(chat_history, '/www/zhishuai/server/src/services/chat-history.service.ts')
    print('  OK')

sftp.close()

# Now build and restart on server
print('\n=== Building and restarting server ===')

cmds = [
    'cd /www/zhishuai/server && npm run build 2>&1',
    'cd /www/zhishuai/server && npx prisma generate 2>&1',
    'pm2 restart zhishuai-api 2>&1',
    'sleep 3 && curl -s http://localhost:3001/health',
]

for cmd in cmds:
    print(f'\n=== {cmd[:60]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out.encode('ascii', 'replace').decode('ascii')[:500])
    if err and 'Warning' not in err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))

c.close()
print('\n=== DEPLOYMENT COMPLETE ===')
