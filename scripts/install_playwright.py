# -*- coding: utf-8 -*-
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '150.109.60.130'
USER = 'ubuntu'
PASS = 'Hao20061218'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', 'replace').strip()
    err = stderr.read().decode('utf-8', 'replace').strip()
    return out, err

print("Step 1: Installing Playwright browsers...")
out, err = run("cd /var/www/zhishuai/server && npx playwright install chromium 2>&1", timeout=180)
print(out or err)
print()

print("Step 2: Verifying installation...")
out, err = run("ls /home/ubuntu/.cache/ms-playwright/ 2>&1")
print(out or err)
out, err = run("npx playwright install --dry-run 2>&1 | head -5")
print(out or err)
print()

print("=== DONE ===")
client.close()
