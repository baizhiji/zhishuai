import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('150.109.60.130', username='ubuntu', password='Hao20061218', timeout=15)

# Test creating an auth session for each platform
print("=== Test: Create auth sessions ===")

# Test douyin (iframe)
print("\n[1] Douyin (iframe)...")
stdin, stdout, stderr = ssh.exec_command("""
curl -s -X POST http://localhost:3001/api/oauth/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token_placeholder" \
  -d '{"platform":"douyin"}' 2>&1 | head -5
""""", timeout=20)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:1000])

# Test channels (api)
print("\n[2] Channels (api)...")
stdin, stdout, stderr = ssh.exec_command("""
curl -s -X POST http://localhost:3001/api/oauth/sessions \
  -H "Content-Type: application/json" \
  -d '{"platform":"channels"}' 2>&1
""""", timeout=30)
result = stdout.read().decode('utf-8', errors='replace')
print(result[:1000])

# Check pm2 logs for V6 activity
print("\n[3] Recent API logs...")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --lines 20 --nostream 2>&1 | grep -i "V6|auth|iframe"', timeout=15)
print(stdout.read().decode('utf-8', errors='replace')[:2000])

# Check that the API error is no longer "initialBodyLength is not defined"
print("\n[4] Check for old error...")
stdin, stdout, stderr = ssh.exec_command('pm2 logs zhishuai-api --err --lines 10 --nostream 2>&1', timeout=15)
err = stdout.read().decode('utf-8', errors='replace')
print(err[:1000])

ssh.close()
print("\nDONE")
