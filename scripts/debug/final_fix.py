import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218')

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

def sudo(cmd):
    stdin, stdout, stderr = ssh.exec_command(f"sudo bash -c '{cmd}'")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

# Step 1: Fix nginx config - remove broken one, write new one via sftp
print("Step 1: Fix nginx config")

# First remove broken config
sudo("rm -f /etc/nginx/sites-enabled/api-baizhiji")
sudo("nginx -s reload 2>&1 || true")

# Write the correct nginx config using SFTP
sftp = ssh.open_sftp()

nginx_config = """server {
    listen 80;
    server_name api.baizhiji.net;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.baizhiji.net;

    ssl_certificate /etc/letsencrypt/live/api.baizhiji.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.baizhiji.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    if ($request_method = OPTIONS) {
        return 204;
    }

    client_max_body_size 50M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""

with sftp.open('/tmp/api_nginx_fixed.conf', 'w') as f:
    f.write(nginx_config)

sudo("cp /tmp/api_nginx_fixed.conf /etc/nginx/sites-available/api-baizhiji")
sudo("ln -sf /etc/nginx/sites-available/api-baizhiji /etc/nginx/sites-enabled/api-baizhiji")

out, err = sudo("nginx -t 2>&1")
print(f"nginx test: {out or err}")

# Step 2: Get SSL cert using certbot webroot mode (port 80 is free now since we removed api config)
print("\nStep 2: Getting SSL cert")
out, err = sudo("certbot certonly --webroot -w /var/www/html -d api.baizhiji.net --non-interactive --agree-tos --email admin@baizhiji.net 2>&1")
print(f"certbot: {out[:1000] if out else err}")

# Re-enable HTTPS config and reload nginx
sudo("nginx -s reload 2>&1 || true")

out, _ = run("ls /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null || echo 'NO CERT'")
print(f"Cert exists: {'YES' if 'NO' not in out else 'NO'}")

# Step 3: Fix .env - append AI keys
print("\nStep 3: Adding AI keys to .env")

# Read current env
out, _ = run("cat /www/zhishuai/server/.env")
lines = out.split('\n') if out else []

has_dashscope = any('DASHSCOPE_API_KEY' in l for l in lines)
has_tencent = any('TENCENT_TOKENHUB_API_KEY' in l for l in lines)

new_lines = []
if not has_dashscope:
    new_lines.append('DASHSCOPE_API_KEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"')
if not has_tencent:
    new_lines.append('TENCENT_TOKENHUB_API_KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"')
if not any('ENCRYPTION_KEY' in l for l in lines):
    new_lines.append('ENCRYPTION_KEY=zhishuai-prod-key-32chars!!')

if new_lines:
    with sftp.open('/tmp/env_additions.txt', 'w') as f:
        f.write('\n'.join(new_lines) + '\n')
    
    # Append to .env
    run("cat /tmp/env_additions.txt >> /www/zhishuai/server/.env")
    print(f"Added {len(new_lines)} keys to .env")
else:
    print("All keys already present")

# Verify
print("\n=== Verifying .env ===")
out, _ = run("grep -E '(DASHSCOPE|TENCENT|ENCRYPTION)' /www/zhishuai/server/.env")
for line in (out or '').split('\n'):
    if line.strip():
        # Mask the actual key value
        masked = line.split('=')[0] + '=***MASKED***'
        print(masked)

# Step 4: Rebuild and restart API
print("\nStep 4: Rebuild & restart")
run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -3")
run("pm2 restart zhishuai-api 2>&1 | tail -3")

import time
time.sleep(5)

# Step 5: Test everything
print("\nStep 5: Final verification")

# Login
import json
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
token_data = json.loads(out)
token = token_data['data']['token']
print(f"Login: OK (role={token_data['data']['user']['role']})")

# Test AI Chat
ai_out, _ = run(f"""curl -s -w '\\nHTTP:%{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer {token}' \\
  -d '{{"message":"说你好测试","modelKey":"qwen-turbo"}}'""")
print(f"\nAI Chat: {ai_out[:300]}")

# Test external access
print("\n--- External access ---")
tests = [
    ("Web (https)", "curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/"),
    ("API main domain", "curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/api/health"),
    ("API subdomain", "curl -sk -o /dev/null -w '%{http_code}' https://api.baizhiji.net/health"),
]
for name, cmd in tests:
    out, _ = run(cmd)
    print(f"  {name}: HTTP {out.strip()}")

sftp.close()
ssh.close()
print("\nDone!")
