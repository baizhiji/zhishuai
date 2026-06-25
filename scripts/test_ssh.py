#!/usr/bin/env python3
import paramiko, sys, traceback
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...")
    client.connect('150.109.60.130', port=22, username='ubuntu', password='Hao20061218', timeout=15)
    print("Connected!")
    
    print("Running pm2 status...")
    stdin, stdout, stderr = client.exec_command('pm2 status', timeout=10)
    out = stdout.read().decode('utf-8','replace')
    print(out[:500])
    
    client.close()
    print("Done!")
except Exception as e:
    print(f"EXCEPTION: {type(e).__name__}: {e}")
    traceback.print_exc()
