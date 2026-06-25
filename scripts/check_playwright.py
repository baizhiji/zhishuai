"""Check Playwright availability and Chromium on remote server"""
import paramiko

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'

def ssh_exec(client, cmd, timeout=30, silent=False):
    if not silent:
        print(f"[SSH] {cmd[:100]}...")
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

    # 1. Check Playwright installation
    print("--- [1] Playwright check ---")
    ssh_exec(client, "node -e \"try { require('playwright'); console.log('playwright: installed'); } catch(e) { console.log('playwright: NOT installed', e.message); }\"", timeout=10)
    
    # 2. Check Chromium browser
    print("\n--- [2] Chromium check ---")
    ssh_exec(client, "ls ~/.cache/ms-playwright/ 2>/dev/null || echo 'no playwright browsers'", timeout=10)
    ssh_exec(client, "which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null || echo 'no system chrome'", timeout=10)
    
    # 3. Try to launch a browser session briefly
    print("\n--- [3] Test browser launch ---")
    ssh_exec(client, "node -e \"const pw = require('playwright'); (async () => { try { const b = await pw.chromium.launch({headless:true}); console.log('Browser launched OK'); const p = await b.newPage(); await p.goto('https://www.baidu.com'); console.log('Page title:', await p.title()); await b.close(); } catch(e) { console.log('Browser launch FAILED:', e.message); } })()\"", timeout=30)
    
    # 4. Check LD_LIBRARY_PATH and dependencies
    print("\n--- [4] Dependencies ---")
    ssh_exec(client, "ldd ~/.cache/ms-playwright/chromium-*/chrome-linux/chrome 2>/dev/null | grep 'not found' | head -10 || echo 'all deps ok'", timeout=10)
    
    # 5. Check the API can find playwright
    print("\n--- [5] API playwright path ---")
    ssh_exec(client, "grep -i 'playwright\\|chromium\\|puppeteer' /var/www/zhishuai/server/dist/services/browser-auth.service.js | head -5", timeout=5)
    
    # 6. Check recent API logs for browser errors
    print("\n--- [6] Recent API logs ---")
    ssh_exec(client, "pm2 logs zhishuai-api --lines 15 --nostream 2>/dev/null", timeout=15)

    client.close()
    print("\nCheck complete!")

if __name__ == '__main__':
    main()
