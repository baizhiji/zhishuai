"""Quick check: API health, port, and recruitment page compiled state"""
import paramiko
import time

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'

def ssh_exec(client, cmd, timeout=30, silent=False):
    if not silent:
        print(f"[SSH] {cmd[:120]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if not silent and out.strip():
        print(out[-2000:].encode('ascii', errors='replace').decode('ascii'))
    if code != 0 and not silent and err.strip():
        print(f"  ERR: {err[-500:].encode('ascii', errors='replace').decode('ascii')}")
    return out, err, code

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # 1. Check what port API is on
    print("--- [1] API port check ---")
    ssh_exec(client, "ss -tlnp | grep node 2>/dev/null", timeout=10)
    
    # 2. Try ports with simple curl
    print("\n--- [2] Try API on different ports ---")
    for port in [3001, 3000, 8080, 5000, 4000]:
        out, _, code = ssh_exec(client, f"curl -s http://localhost:{port}/api/oauth/platforms 2>/dev/null | head -c 100", timeout=5, silent=True)
        if out.strip() and out.strip() != '':
            print(f"  Port {port}: {out.encode('ascii', errors='replace').decode('ascii')[:80]}")
        else:
            print(f"  Port {port}: empty/no response")
    
    # 3. Check PM2 logs
    print("\n--- [3] PM2 logs ---")
    ssh_exec(client, "pm2 logs zhishuai-api --lines 30 --nostream 2>/dev/null", timeout=15)
    
    # 4. Check .env and ecosystem config for port info
    print("\n--- [4] Check configs ---")
    ssh_exec(client, "cat /var/www/zhishuai/server/.env 2>/dev/null | head -15 || echo 'no .env'", timeout=5)
    ssh_exec(client, "cat /var/www/zhishuai/ecosystem.config.js 2>/dev/null | head -30 || echo 'no ecosystem'", timeout=5)
    
    # 5. Check nginx config
    print("\n--- [5] Nginx ---")
    ssh_exec(client, "find /etc/nginx -name '*.conf' -type f 2>/dev/null", timeout=5)
    ssh_exec(client, "cat /etc/nginx/sites-enabled/default 2>/dev/null | head -50 || cat /etc/nginx/conf.d/default.conf 2>/dev/null | head -50 || echo 'no default config'", timeout=10)

    # 6. Check the actual recruitment page.tsx on remote 
    print("\n--- [6] Verify remote recruitment page ---")
    ssh_exec(client, "head -5 /var/www/zhishuai/web/app/customer/recruitment/platforms/page.tsx 2>/dev/null || echo 'not found'", timeout=5)
    ssh_exec(client, "grep 'oauth' /var/www/zhishuai/web/app/customer/recruitment/platforms/page.tsx 2>/dev/null | head -5", timeout=5)

    # 7. Also need to check: does the oauth.ts route on remote include recruitment platforms?
    print("\n--- [7] Check oauth.ts route ---")
    ssh_exec(client, "grep -c 'boss\\|zhilian\\|liepin\\|lagou' /var/www/zhishuai/server/dist/routes/oauth.js 2>/dev/null || echo 'not in route'", timeout=5)
    # Check the source oauth.ts
    ssh_exec(client, "grep -c 'boss\\|zhilian\\|liepin\\|lagou' /var/www/zhishuai/server/src/routes/oauth.ts 2>/dev/null || echo 'not in source'", timeout=5)

    client.close()
    print("\nCheck complete!")

if __name__ == '__main__':
    main()
