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

def sudo_run(cmd):
    stdin, stdout, stderr = ssh.exec_command(f"sudo bash -c '{cmd}'")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

# Check current broken config line 29
print("=== Checking broken nginx config ===")
out, _ = run("sed -n '25,35p' /etc/nginx/sites-enabled/api-baizhiji")
print(out)

# Fix: Write a clean nginx config using heredoc with Python to avoid escaping issues
print("\n=== Writing fixed nginx config ===")

# Use python to write the file via SSH
fix_script = '''
import subprocess

config = """server {
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

with open('/tmp/api_nginx.conf', 'w') as f:
    f.write(config)
print("Config written to /tmp/api_nginx.conf")
'''

out, _ = run("python3 -c '" + fix_script.replace("'", "'") + "'")
print(out)

# Copy to nginx sites-available and enable
out, err = sudo_run("cp /tmp/api_nginx.conf /etc/nginx/sites-available/api-baizhiji && ln -sf /etc/nginx/sites-available/api-baizhiji /etc/nginx/sites-enabled/api-baizhiji")
print(err or "Config copied and enabled")

# Test nginx
print("\n=== Testing nginx config ===")
out, err = sudo_run("nginx -t 2>&1")
print(out or err)

# If nginx is OK, get SSL cert
if "test is successful" in (out + err):
    print("\nNginx OK! Getting SSL cert...")
    out, err = sudo_run("certbot --nginx -d api.baizhiji.net --non-interactive --agree-tos --email admin@baizhiji.net --redirect 2>&1")
    print(out or err)
else:
    print("\nNginx still has errors. Let me try standalone mode for certbot...")
    # Remove the broken config temporarily, get cert, then restore
    sudo_run("rm -f /etc/nginx/sites-enabled/api-baizhiji")
    sudo_run("nginx -s reload 2>&1 || true")
    
    # Use certbot in standalone mode
    print("\nTrying certbot standalone...")
    out, err = sudo_run("certbot certonly --standalone -d api.baizhiji.net --non-interactive --agree-tos --email admin@baizhiji.com --http-01-port 80 2>&1 | tail -20")
    print(out or err)
    
    # Re-enable the HTTPS config
    sudo_run("ln -sf /etc/nginx/sites-available/api-baizhiji /etc/nginx/sites-enabled/api-baizhiji")
    sudo_run("nginx -s reload 2>&1 || true")

# Verify cert exists
print("\n=== Verifying SSL cert ===")
out, _ = run("sudo ls -la /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null || echo 'Cert not found'")
print(out)

# Test API via subdomain
print("\n=== Testing api.baizhiji.net ===")
out, _ = run("curl -sk https://api.baizhiji.net/health 2>&1 | head -5")
print(f"Health check: {out[:200] if out else 'No response'}")

# ============================================
# Also fix .env AI keys
# ============================================
print("\n" + "=" * 60)
print("Fixing .env AI Keys")
print("=" * 60)

# Read current .env to see what's there
out, _ = run("cat /www/zhishuai/server/.env 2>/dev/null")
print(f"Current .env content:\n{out}")

# The sed command might have failed because the keys don't exist yet
# Let's just append them if they're missing
check_dashscope = "DASHSCOPE_API_KEY" in (out or "")
check_tencent = "TENCENT_TOKENHUB_API_KEY" in (out or "")

print(f"\nDASHSCOPE present: {check_dashscope}")
print(f"TENCENT present: {check_tencent}")

if not check_dashscope or not check_tencent:
    # Write keys directly
    env_append = '''
import os
env_path = "/www/zhishuai/server/.env"
with open(env_path, "r") as f:
        lines = f.readlines()

keys_to_add = []
has_dashscope = any("DASHSCOPE_API_KEY" in l for l in lines)
has_tencent = any("TENCENT_TOKENHUB_API_KEY" in l for l in lines)
has_encryption = any("ENCRYPTION_KEY" in l for l in lines)

if not has_dashscope:
    keys_to_add.append('DASHSCOPE_API_KEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"')
if not has_tencent:
    keys_to_add.append('TENCENT_TOKENHUB_API_KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"')
if not has_encryption:
    keys_to_add.append('ENCRYPTION_KEY=zhishuai-prod-key-32chars!!')

if keys_to_add:
    with open(env_path, "a") as f:
        for key in keys_to_add:
            f.write(key + "\\n")
    print(f"Added {len(keys_to_add)} keys to .env")
else:
    print("All keys already present")
'''
    out, _ = run("python3 -c '" + env_append.replace("'", "'") + "'")
    print(out)

# Verify final .env
print("\n=== Final .env AI keys ===")
out, _ = run("cat /www/zhishuai/server/.env | grep -E '(DASHSCOPE|TENCENT|ENCRYPTION|OPENAI)'")
print(out)

# Rebuild and restart
print("\n=== Rebuilding and restarting API ===")
run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -3")
run("pm2 restart zhishuai-api 2>&1 | tail -3")

import time
time.sleep(4)

# Test AI chat
print("\n=== Testing AI Chat with new keys ===")
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
import json
token_data = json.loads(out)
token = token_data['data']['token']

ai_out, _ = run(f"""curl -s -w '\\nHTTP: %{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer {token}' \\
  -d '{{"message":"你好，测试AI功能是否正常工作","modelKey":"qwen-turbo"}}'""")
print(f"AI Chat result: {ai_out[:500]}")

ssh.close()
print("\nDone!")
