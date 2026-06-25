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

    # 1. Check what port API is actually on
    print("--- [1] API port check ---")
    ssh_exec(client, "lsof -i -P -n | grep node | grep LISTEN | head -10", timeout=10)
    
    # 2. Try different ports for API
    print("\n--- [2] Try ports ---")
    for port in [3001, 3000, 8080, 5000, 4000]:
        out, _, code = ssh_exec(client, f"curl -s -o /dev/null -w '%{http_code}' http://localhost:{port}/api/health 2>/dev/null || echo 'X'", timeout=5, silent=True)
        print(f"  Port {port}: {out.strip()}")
    
    # 3. Try OAuth platforms on port 3001
    print("\n--- [3] OAuth platforms on 3001 ---")
    out, _, _ = ssh_exec(client, "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null", timeout=10, silent=True)
    print(f"  Response: {out.encode('ascii', errors='replace').decode('ascii')[:300]}")
    
    # 4. Check PM2 logs for errors
    print("\n--- [4] PM2 logs ---")
    ssh_exec(client, "pm2 logs zhishuai-api --lines 20 --nostream 2>/dev/null", timeout=15)
    
    # 5. Check API startup log
    print("\n--- [5] Startup log ---")
    ssh_exec(client, "cat /tmp/api_v4b.log 2>/dev/null || cat /tmp/api_v4.log 2>/dev/null || echo 'no log'", timeout=10)
    
    # 6. Check the ecosystem.config for port info
    print("\n--- [6] Check config ---")
    ssh_exec(client, f"cat /var/www/zhishuai/ecosystem.config.js 2>/dev/null | head -30", timeout=10)
    ssh_exec(client, f"cat /var/www/zhishuai/server/.env 2>/dev/null | head -10 || echo 'no .env'", timeout=5)
    
    # 7. Find compiled recruitment page
    print("\n--- [7] Find compiled recruitment page ---")
    ssh_exec(client, f"find /var/www/zhishuai/web/.next -name '*.js' -path '*recruitment*' 2>/dev/null | head -10", timeout=10)
    # Check in the page.js (Next.js 14 uses this pattern)
    ssh_exec(client, f"ls /var/www/zhishuai/web/.next/static/chunks/ 2>/dev/null | tail -5", timeout=5)

    # 8. Try API on different path
    print("\n--- [8] Try direct port 3001 ---")
    out, _, _ = ssh_exec(client, "curl -s http://localhost:3001/ 2>/dev/null | head -c 200", timeout=10)
    print(f"  Root response: {out.encode('ascii', errors='replace').decode('ascii')[:200]}")
    
    # 9. Check nginx proxy config
    print("\n--- [9] Check nginx ---")
    ssh_exec(client, "find /etc/nginx -name '*.conf' -type f 2>/dev/null | xargs grep -l 'zhishuai\\|3001' 2>/dev/null", timeout=10)
    ssh_exec(client, "cat /etc/nginx/nginx.conf 2>/dev/null | grep -A5 'upstream\\|proxy_pass\\|server_name\\|location' | head -30", timeout=10)

    client.close()
    print("\nCheck complete!")

if __name__ == '__main__':
    main()
