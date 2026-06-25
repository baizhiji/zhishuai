"""Quick verification of deployed OAuth V4"""
import paramiko
import time

HOST = '150.109.60.130'
USER = 'ubuntu'
PASSWORD = 'Hao20061218'

def ssh_exec(client, cmd, timeout=30):
    print(f"[SSH] {cmd[:120]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out[-3000:].encode('ascii', errors='replace').decode('ascii'))
    if code != 0 and err.strip():
        print(f"  ERR: {err[-500:].encode('ascii', errors='replace').decode('ascii')}")
    return out, err, code

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # 1. Check OAuth session creation error (properly decode Chinese)
    print("--- [1] Test OAuth session creation ---")
    out, err, code = ssh_exec(client,
        "curl -s -X POST http://localhost:3001/api/oauth/sessions -H 'Content-Type: application/json' -d '{\"platform\":\"douyin\",\"userId\":\"test_user\"}' 2>/dev/null",
        timeout=30)
    # The Chinese characters were garbled in previous output, let's decode properly
    try:
        print(f"  Raw response (UTF-8): {out[:500]}")
    except:
        print(f"  Raw response: {out[:500].encode('ascii', errors='replace').decode('ascii')}")
    
    # 2. Check what the oauth.ts route expects
    print("\n--- [2] Check oauth route file ---")
    ssh_exec(client, "cat /var/www/zhishuai/server/dist/routes/oauth.js | head -c 3000", timeout=10)

    # 3. Check API logs for startup errors
    print("\n--- [3] Check API startup logs ---")
    ssh_exec(client, "tail -50 /tmp/api_v4.log", timeout=10)

    # 4. Check if the web frontend needs updating for recruitment platforms
    print("\n--- [4] Check web frontend recruitment page ---")
    ssh_exec(client, "ls -la /var/www/zhishuai/web/.next/server/app/customer/recruitment/ 2>/dev/null | head -10", timeout=10)
    
    # 5. Check if there's a compiled page for recruitment
    ssh_exec(client, "find /var/www/zhishuai/web/.next -name '*recruitment*' -type f 2>/dev/null | head -10", timeout=10)

    client.close()
    print("\nVerification complete!")

if __name__ == '__main__':
    main()
