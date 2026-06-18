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

def sudo(cmd):
    stdin, stdout, stderr = ssh.exec_command(f"sudo bash -c '{cmd}'")
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

# 1. DNS resolution test
print("=== DNS Resolution ===")
out, _ = run("nslookup tokenhub.cloud.tencent.com 2>&1")
print(out[:500])

out, _ = run("dig tokenhub.cloud.tencent.com +short 2>&1 || echo 'dig not installed'")
print(f"dig: {out}")

out, _ = run("cat /etc/resolv.conf")
print(f"\nDNS config:\n{out}")

# 2. Try with different DNS
print("\n=== Try with 8.8.8.8 ===")
out, _ = run("nslookup tokenhub.cloud.tencent.com 8.8.8.8 2>&1")
print(out[:500])

out, _ = run("nslookup tokenhub.cloud.tencent.com 119.29.29.29 2>&1")
print(f"\nWith Tencent DNS (119.29.29.29):\n{out[:500]}")

# 3. Direct curl test
print("\n=== Direct curl test ===")
out, _ = run("curl -sv --connect-timeout 5 https://tokenhub.cloud.tencent.com/ 2>&1 | head -15")
print(out[:600])

# 4. Try ping
print("\n=== Ping test ===")
out, _ = run("ping -c 2 -W 3 tokenhub.cloud.tencent.com 2>&1")
print(out[:300])

# 5. Check if it's a /etc/hosts issue or firewall
print("\n=== Network checks ===")
out, _ = run("curl -sv --connect-timeout 5 https://cloud.tencent.com/ 2>&1 | head -10")
print(f"cloud.tencent.com: {out[:300]}")

ssh.close()
print("\nDone!")
