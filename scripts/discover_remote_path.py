"""Discover the actual project path on the remote server"""
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
        print(out[-3000:])
    if code != 0 and err.strip():
        print(f"  ERR: {err[-500:]}")
    return out, err, code

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # 1. Find browser-auth.service.js
    print("--- [1] Find browser-auth.service.js ---")
    ssh_exec(client, "find / -name 'browser-auth.service.js' -type f 2>/dev/null | head -10", timeout=60)

    # 2. Find server/dist/index.js (main entry point)
    print("\n--- [2] Find server entry point ---")
    ssh_exec(client, "find / -name 'index.js' -path '*/server/dist/*' -type f 2>/dev/null | head -10", timeout=60)

    # 3. Check common project locations
    print("\n--- [3] Check common locations ---")
    ssh_exec(client, "ls -la /home/ubuntu/ /opt/ /var/www/ /workspace/ /root/ 2>/dev/null | grep zhishuai", timeout=10)

    # 4. Find pm2 managed processes
    print("\n--- [4] Check PM2 processes ---")
    ssh_exec(client, "pm2 list 2>/dev/null || echo 'pm2 not found'", timeout=10)

    # 5. Check running node processes
    print("\n--- [5] Check running node processes ---")
    ssh_exec(client, "ps aux | grep node | grep -v grep", timeout=10)

    # 6. Find ecosystem.config.js
    print("\n--- [6] Find ecosystem config ---")
    ssh_exec(client, "find / -name 'ecosystem.config.js' -type f 2>/dev/null | head -10", timeout=60)

    # 7. Check nginx config for hints
    print("\n--- [7] Check nginx config ---")
    ssh_exec(client, "cat /etc/nginx/sites-enabled/* 2>/dev/null | grep -i root | head -5; cat /etc/nginx/conf.d/*.conf 2>/dev/null | grep -i root | head -5", timeout=10)

    # 8. Check systemd services
    print("\n--- [8] Check systemd ---")
    ssh_exec(client, "systemctl list-units --type=service --state=running 2>/dev/null | grep -i 'zhishuai\\|node\\|api' | head -5", timeout=10)

    # 9. Check docker containers
    print("\n--- [9] Check docker ---")
    ssh_exec(client, "docker ps 2>/dev/null || echo 'docker not running'", timeout=10)

    # 10. Try to find web build output
    print("\n--- [10] Find Next.js build output ---")
    ssh_exec(client, "find / -name '.next' -type d 2>/dev/null | head -10", timeout=60)

    client.close()
    print("\nDiscovery complete!")

if __name__ == '__main__':
    main()
