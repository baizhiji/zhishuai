"""Verify Playwright works from the server project directory"""
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

    # 1. Check playwright in server node_modules
    print("--- [1] Playwright in server ---")
    ssh_exec(client, "ls /var/www/zhishuai/server/node_modules/playwright/ 2>/dev/null | head -5 || echo 'not found'", timeout=10)
    
    # 2. Test playwright require from server directory
    print("\n--- [2] Test require from server dir ---")
    ssh_exec(client, "cd /var/www/zhishuai/server && node -e \"try { const pw = require('playwright'); console.log('playwright OK, chromium available'); } catch(e) { console.log('FAIL:', e.message); }\"", timeout=10)
    
    # 3. Try launching browser from server directory
    print("\n--- [3] Browser launch test ---")
    ssh_exec(client, "cd /var/www/zhishuai/server && node -e \"const pw = require('playwright'); (async () => { try { const b = await pw.chromium.launch({headless:true, args:['--no-sandbox']}); console.log('Browser launched OK'); await b.close(); } catch(e) { console.log('Launch FAILED:', e.message.substring(0,200)); } })()\"", timeout=30)
    
    # 4. Check the browser-auth service expects LD_LIBRARY_PATH
    print("\n--- [4] LD_LIBRARY_PATH in ecosystem ---")
    ssh_exec(client, "cat /var/www/zhishuai/ecosystem.config.js | grep LD_LIBRARY", timeout=5)
    
    # 5. Check missing system deps for chromium
    print("\n--- [5] Chromium deps ---")
    ssh_exec(client, "ldd ~/.cache/ms-playwright/chromium-1223/chrome-linux/chrome 2>/dev/null | grep 'not found' | head -10 || echo 'all deps satisfied'", timeout=10)

    client.close()
    print("\nDone!")

if __name__ == '__main__':
    main()
