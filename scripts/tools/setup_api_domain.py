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

# Check SSL cert actual location
print("=== SSL cert locations ===")
out, _ = run("find /etc/letsencrypt/ -name '*.pem' 2>/dev/null | head -20")
print(out)

# Check cert directory
out, _ = run("ls -la /etc/letsencrypt/live/ 2>/dev/null")
print(out)

# Check archive
out, _ = run("ls -la /etc/letsencrypt/archive/ 2>/dev/null")
print(out)

# Check renewal
out, _ = run("ls -la /etc/letsencrypt/renewal/ 2>/dev/null")
print(out)

# Verify current nginx can serve HTTPS (meaning certs exist somewhere)
out, _ = run("sudo nginx -t 2>&1")
print(f"\nNginx test: {out}")

# Try the actual cert path referenced in config
out, _ = run("sudo ls -la /etc/letsencrypt/live/baizhiji.net/ 2>/dev/null || echo 'Cannot access or not found'")
print(out)

ssh.close()
