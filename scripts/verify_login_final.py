import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# Simple login test - no complex parsing
cmd = '''curl -s -X POST https://baizhiji.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218","loginType":"user"}' \
  -k'''
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
result = stdout.read().decode('utf-8', errors='replace').strip()
print(f'HTTPS Login Result: {result}')

# Check if it contains success
if 'success' in result:
    print('STATUS: LOGIN WORKS!')
elif 'error' in result:
    print('STATUS: LOGIN FAILED')
else:
    print('STATUS: UNKNOWN')

# Also test the api subdomain login
cmd2 = '''curl -s -X POST https://api.baizhiji.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"18601655222","password":"20061218"}' \
  -k'''
stdin, stdout, stderr = ssh.exec_command(cmd2, timeout=15)
result2 = stdout.read().decode('utf-8', errors='replace').strip()
print(f'\nAPI Subdomain Login: {result2}')
if 'success' in result2:
    print('STATUS: API SUBDOMAIN LOGIN WORKS!')

ssh.close()
