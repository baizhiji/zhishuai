"""Discover the actual project path on the remote server - v2 with encoding fix"""
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
        safe = out[-2000:].encode('ascii', errors='replace').decode('ascii')
        print(safe)
    if code != 0 and err.strip():
        safe_err = err[-500:].encode('ascii', errors='replace').decode('ascii')
        print(f"  ERR: {safe_err}")
    return out, err, code

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("Connected!\n")

    # 1. Find browser-auth.service.js - the key file
    print("--- [1] Find browser-auth.service.js ---")
    ssh_exec(client, "find /home /opt /var /workspace /root -name 'browser-auth.service.js' -type f 2>/dev/null", timeout=60)

    # 2. Find server/dist/index.js
    print("\n--- [2] Find server entry point ---")
    ssh_exec(client, "find /home /opt /var /workspace /root -name 'index.js' -path '*/server/dist/*' -type f 2>/dev/null", timeout=60)

    # 3. Find zhishuai directories
    print("\n--- [3] Find zhishuai dirs ---")
    ssh_exec(client, "find /home /opt /workspace /root -maxdepth 3 -name '*zhishuai*' -type d 2>/dev/null", timeout=30)

    # 4. Check running node processes - cwd info
    print("\n--- [4] Running node processes ---")
    ssh_exec(client, "ps aux | grep 'node.*dist' | grep -v grep | head -5", timeout=10)
    ssh_exec(client, "ls -la /proc/*/cwd 2>/dev/null | grep zhishuai | head -5", timeout=10)
    # Better: readlink on node process cwd
    out, _, _ = ssh_exec(client, "for pid in $(pgrep -f 'node.*server/dist' 2>/dev/null); do readlink /proc/$pid/cwd 2>/dev/null; done", timeout=10)
    
    # 5. Check ecosystem.config.js location
    print("\n--- [5] Find ecosystem config ---")
    ssh_exec(client, "find /home /opt /workspace /root -maxdepth 4 -name 'ecosystem.config.js' -type f 2>/dev/null", timeout=30)

    # 6. Check nginx for root directive
    print("\n--- [6] Check nginx ---")
    ssh_exec(client, "grep -r 'root' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -10", timeout=10)

    # 7. Check docker
    print("\n--- [7] Check docker ---")
    ssh_exec(client, "docker ps --format '{{.Names}} {{.Image}} {{.Ports}}' 2>/dev/null || echo 'no docker'", timeout=10)

    # 8. Find .next build output
    print("\n--- [8] Find .next build ---")
    ssh_exec(client, "find /home /opt /workspace /root -maxdepth 5 -name '.next' -type d 2>/dev/null", timeout=30)

    client.close()
    print("\nDiscovery complete!")

if __name__ == '__main__':
    main()
