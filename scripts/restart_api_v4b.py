"""Force restart the API service with V4 code - fixed version"""
import paramiko
import time

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'
REMOTE_DIR = '/var/www/zhishuai'

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

    # Step 1: Kill all node processes
    print("--- [1] Kill processes ---")
    ssh_exec(client, "pkill -9 -f 'node.*zhishuai' 2>/dev/null; echo 'killed'", timeout=10)
    time.sleep(3)
    ssh_exec(client, "ps aux | grep 'node.*zhishuai' | grep -v grep", timeout=10)
    ssh_exec(client, "lsof -i :3001 2>/dev/null || echo 'port 3001 free'", timeout=10)

    # Step 2: Start new API
    print("\n--- [2] Start API ---")
    ssh_exec(client, f"cd {REMOTE_DIR}/server && nohup node dist/index.js > /tmp/api_v4b.log 2>&1 & echo 'started'", timeout=15)
    time.sleep(5)

    # Step 3: Verify
    print("\n--- [3] Verify ---")
    for i in range(8):
        out, _, _ = ssh_exec(client, "curl -s http://localhost:3001/api/oauth/platforms 2>/dev/null | head -c 300", timeout=10, silent=True)
        if 'boss' in out:
            print(f"  V4 API confirmed! (attempt {i+1})")
            print(f"  {out.encode('ascii', errors='replace').decode('ascii')[:200]}")
            break
        print(f"  Waiting... {i+1}")
        time.sleep(3)

    # Step 4: Confirm V4 code
    print("\n--- [4] V4 features check ---")
    ssh_exec(client, f"grep -c 'smartFindQRCode' {REMOTE_DIR}/server/dist/services/browser-auth.service.js", timeout=5)
    ssh_exec(client, f"grep -c 'successUrlPatterns' {REMOTE_DIR}/server/dist/services/browser-auth.service.js", timeout=5)

    # Step 5: Check recruitment page source on remote
    print("\n--- [5] Recruitment page check ---")
    ssh_exec(client, f"grep 'oauth/initiate\\|oauth/sessions' {REMOTE_DIR}/web/app/customer/recruitment/platforms/page.tsx 2>/dev/null | head -5", timeout=5)

    # Step 6: Final process check
    print("\n--- [6] Process status ---")
    ssh_exec(client, "ps aux | grep 'node.*zhishuai' | grep -v grep", timeout=10)

    client.close()
    print("\nRestart complete!")

if __name__ == '__main__':
    main()
