"""Test SSH connection with different methods"""
import paramiko
import os

HOST = '150.109.60.130'

# Method 1: Try with password
print("Method 1: Password auth...")
try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username='ubuntu', password='Hao20061218', timeout=10)
    print("  SUCCESS with ubuntu/password!")
    
    stdin, stdout, stderr = client.exec_command('echo connected && whoami', timeout=10)
    print(f"  Response: {stdout.read().decode()}")
    client.close()
except Exception as e:
    print(f"  Failed: {e}")

# Method 2: Try root
print("\nMethod 2: Root user...")
for user in ['root']:
    for method in ['password', 'key']:
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            if method == 'password':
                client.connect(HOST, username=user, password='Hao20061218', timeout=8)
            else:
                key = paramiko.RSAKey.from_private_key_file(r'C:\Users\Administrator\.ssh\id_rsa')
                client.connect(HOST, username=user, pkey=key, timeout=8)
            print(f"  SUCCESS with {user}/{method}!")
            client.close()
        except Exception as e:
            pass

# Method 3: Check available keys
print("\nAvailable SSH keys:")
ssh_dir = r'C:\Users\Administrator\.ssh'
if os.path.exists(ssh_dir):
    for f in os.listdir(ssh_dir):
        fpath = os.path.join(ssh_dir, f)
        if os.path.isfile(fpath):
            print(f"  {f} ({os.path.getsize(fpath)} bytes)")
