#!/usr/bin/env python3
"""Step 1: Upload and run fix script on remote server"""
import paramiko, sys, time, os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("[1] Connecting...")
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
print("  Connected!")

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace')
    err = stderr.read().decode('utf-8', 'replace')
    return out, err

# Create fix script content as a string
# Using a separate file to avoid PowerShell parsing issues
fix_content = open(os.path.join(os.path.dirname(__file__), 'remote_fix.py'), 'r', encoding='utf-8').read()

# Upload via SFTP
print("\n[2] Uploading fix script...")
sftp = client.open_sftp()
with sftp.open('/tmp/remote_fix.py', 'w') as f:
    f.write(fix_content)
sftp.close()
print("  Uploaded!")

# Execute
print("\n[3] Running fix script on server...")
out, err = run('python3 /tmp/remote_fix.py 2>&1')
print(out if out else '(no output)')
if err:
    print(f'  stderr: {err[:200]}')

client.close()
print("\nDone! Now run rebuild_web.py")
