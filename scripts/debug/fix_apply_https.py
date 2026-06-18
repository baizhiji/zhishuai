import paramiko
import sys
import json
import time
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

sftp = ssh.open_sftp()

# Step 1: Verify cert exists
print("Step 1: Verify SSL cert")
out, _ = run("sudo ls -la /etc/letsencrypt/live/api.baizhiji.net/")
print(f"Cert files:\n{out}")

# Step 2: Apply HTTPS config
print("\nStep 2: Apply HTTPS nginx config")

https_nginx = """server {
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

with sftp.open('/tmp/api_nginx_https.conf', 'w') as f:
    f.write(https_nginx)

sudo("cp /tmp/api_nginx_https.conf /etc/nginx/sites-available/api-baizhiji")
sudo("ln -sf /etc/nginx/sites-available/api-baizhiji /etc/nginx/sites-enabled/api-baizhiji")

out, err = sudo("nginx -t 2>&1")
print(f"nginx test: {out or err}")

if 'ok' in (out + err).lower():
    sudo("nginx -s reload 2>&1 || sudo systemctl restart nginx 2>&1")
    print("HTTPS nginx config applied!")
else:
    print("FAILED: nginx config test did not pass")
    sftp.close()
    ssh.close()
    sys.exit(1)

time.sleep(3)

# Step 3: Debug AI Chat 401 issue
print("\nStep 3: Debug AI Chat 401 issue")

# Login
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
try:
    token_data = json.loads(out)
    token = token_data['data']['token']
    print(f"Login OK, token length: {len(token)}")
except:
    print(f"Login failed: {out[:300]}")
    token = None

if token:
    # Check auth middleware - try the ai-chat route directly
    print("\nTesting AI chat with verbose output:")
    out, _ = run(f"""curl -sv -X POST http://localhost:3001/api/ai-chat/chat \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer {token}' \
      -d '{{"message":"你好","modelKey":"qwen-turbo"}}' 2>&1 | head -30""")
    print(out[:800])

    # Check pm2 logs for auth errors
    print("\nPM2 recent logs (last 20 lines):")
    out, _ = run("pm2 logs zhishuai-api --nostream --lines 20 2>&1")
    print(out[:1500])

    # Check the .env for AI keys
    print("\nChecking .env AI keys:")
    out, _ = run("grep -E '(DASHSCOPE|TENCENT|ENCRYPTION)' /www/zhishuai/server/.env")
    for line in (out or '').split('\n'):
        if line.strip():
            key = line.split('=')[0]
            print(f"  {key}=present")

    # Check if the ai-chat route exists
    print("\nChecking route registration:")
    out, _ = run("curl -s http://localhost:3001/api/ai-chat/ 2>&1")
    print(f"  /api/ai-chat/ => {out[:200]}")

    out, _ = run("curl -s http://localhost:3001/api/ai-chat/chat 2>&1")
    print(f"  /api/ai-chat/chat (GET) => {out[:200]}")

# Step 4: Test external HTTPS access
print("\nStep 4: External HTTPS test")

tests = [
    ("API HTTPS", "curl -sk -o /dev/null -w '%{http_code}' https://api.baizhiji.net/health"),
    ("API HTTP redirect", "curl -s -o /dev/null -w '%{http_code}' -L http://api.baizhiji.net/health 2>&1"),
    ("Main site", "curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/"),
]

for name, cmd in tests:
    out, _ = run(cmd)
    print(f"  {name}: HTTP {out.strip()}")

sftp.close()
ssh.close()
print("\nDone!")
