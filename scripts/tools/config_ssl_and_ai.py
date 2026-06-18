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

# ============================================
# Step 1: Configure SSL for api.baizhiji.net
# ============================================
print("=" * 60)
print("STEP 1: Configuring SSL for api.baizhiji.net")
print("=" * 60)

# First check if DNS resolves
print("\n--- Check DNS resolution ---")
out, _ = run("dig api.baizhiji.net +short 2>/dev/null || nslookup api.baizhiji.net 2>/dev/null | tail -3")
print(f"DNS: {out or 'Not resolved yet'}")

# Apply the final HTTPS nginx config (prepared earlier)
print("\n--- Applying HTTPS nginx config ---")
api_nginx_https = """# API subdomain - final HTTPS config
server {
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

    # CORS headers for APK access
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }

    # Increase max body size for file uploads
    client_max_body_size 50M;

    # Timeout settings
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;

    # API proxy - no /api prefix stripping, just forward to API server
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

out, err = sudo_run(f"cat > /etc/nginx/sites-available/api-baizhiji << 'NGINX_EOF'\n{api_nginx_https}\nNGINX_EOF")
print(f"Written HTTPS config: {err or 'OK'}")

# Test nginx config
print("\n--- Testing nginx config ---")
out, err = sudo_run("nginx -t 2>&1")
print(out or err)

# Reload nginx
print("\n--- Reloading nginx ---")
out, err = sudo_run("nginx -s reload 2>&1")
print(out or err)

# Now use certbot to get SSL cert
print("\n--- Requesting SSL certificate via certbot ---")
out, err = sudo_run("certbot --nginx -d api.baizhiji.net --non-interactive --agree-tos --email admin@baizhiji.net --redirect 2>&1")
print(out or err)

# Verify cert exists
print("\n--- Verifying SSL cert ---")
out, _ = run("sudo ls -la /etc/letsencrypt/live/api.baizhiji.net/ 2>/dev/null || echo 'Cert not found'")
print(out)

# Test HTTPS access to api domain
print("\n--- Testing HTTPS access ---")
out, _ = run("curl -sk https://api.baizhiji.net/health 2>/dev/null || echo 'HTTPS not working yet'")
print(f"API Health via HTTPS: {out}")

# ============================================
# Step 2: Configure AI API Keys in .env
# ============================================
print("\n" + "=" * 60)
print("STEP 2: Configuring AI API Keys")
print("=" * 60)

# Read current .env
print("\n--- Current .env content ---")
out, _ = run("cat /www/zhishuai/server/.env 2>/dev/null | grep -E '(DASHSCOPE|TENCENT|OPENAI|ENCRYPTION)' || echo 'No keys found'")
print(out)

# Update .env with new keys
print("\n--- Updating .env with AI Keys ---")

env_update_cmd = r"""
cd /www/zhishuai/server && \
sed -i 's/^DASHSCOPE_API_KEY=.*/DASHSCOPE_API_KEY="sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"/' .env && \
sed -i 's/^TENCENT_TOKENHUB_API_KEY=.*/TENCENT_TOKENHUB_API_KEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"/' .env && \
grep -q '^ENCRYPTION_KEY=' .env || echo 'ENCRYPTION_KEY=zhishuai-prod-key-32chars!!' >> .env && \
echo "Updated successfully"
"""
out, _ = run(env_update_cmd)
print(out)

# Verify the update
print("\n--- Verified updated .env ---")
out, _ = run("cat /www/zhishuai/server/.env 2>/dev/null | grep -E '(DASHSCOPE|TENCENT|OPENAI|ENCRYPTION)'")
print(out)

# Rebuild and restart API with new env vars
print("\n--- Rebuilding and restarting API ---")
out, _ = run("cd /www/zhishuai/server && npx tsup src/index.ts --outDir dist --format cjs --minify 2>&1 | tail -3")
print(out)

out, _ = run("pm2 restart zhishuai-api 2>&1 | tail -3")
print(out)

import time
time.sleep(4)

# Test AI functionality
print("\n--- Testing AI functionality ---")
out, _ = run('''curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"phone":"18601655222","password":"20061218","loginType":"admin"}' ''')
import json
try:
    token_data = json.loads(out)
    token = token_data['data']['token']
    
    # Test AI chat endpoint (should work now with env key)
    ai_out, _ = run(f"""curl -s -w '\\nHTTP: %{{http_code}}' -X POST http://localhost:3001/api/ai-chat/chat \\
      -H 'Content-Type: application/json' \\
      -H 'Authorization: Bearer {token}' \\
      -d '{{"message":"你好，测试一下","modelKey":"qwen-turbo"}}'""")
    print(f"AI Chat test: {ai_out[:500]}")
except Exception as e:
    print(f"Token error: {e}")
    print(f"Raw output: {out[:200]}")

# Final verification of external HTTPS
print("\n" + "=" * 60)
print("FINAL VERIFICATION")
print("=" * 60)
print("\n--- Web frontend (https) ---")
out, _ = run("curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/")
print(f"baizhiji.net -> {out}")

print("\n--- API via main domain (https) ---")
out, _ = run("curl -sk -o /dev/null -w '%{http_code}' https://baizhiji.net/api/health")
print(f"baizhiji.net/api/health -> {out}")

print("\n--- API via subdomain (https) ---")
out, _ = run("curl -sk -o /dev/null -w '%{http_code}' https://api.baizhiji.net/health 2>/dev/null || echo 'N/A'")
print(f"api.baizhiji.net/health -> {out}")

ssh.close()
print("\nDone!")
