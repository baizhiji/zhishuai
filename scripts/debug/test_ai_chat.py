import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(cmd, timeout=30):
    print(f'\n=== {cmd[:80]} ===')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    out_safe = out.encode('ascii', 'replace').decode('ascii')
    if out_safe: print(out_safe[:2000])
    return out

# Login
login_result = run('curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"phone":"18601655222","password":"123456"}\'')

token = login_result.split('"token":"')[1].split('"')[0] if '"token":"' in login_result else ''
print(f'\nToken: {token[:30]}...')

# Test AI Chat with CORRECT format: messages array + modelKey
# This should fail because user has no API Key configured yet (expected behavior)
result = run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"messages":[{{"role":"user","content":"Hello, tell me a joke"}}],"modelKey":"qwen_turbo"}}\'')

# If it says "no API key", that's the correct behavior!
# Let's also test with env var fallback (admin should have global API keys set in env)
print(f'\n*** Chat result: {result[:200] if result else "empty"} ***')

# Test the complete user flow: configure API key first, then chat
# Step 1: Save a valid-looking API key (it will be validated on use)
# For now, let's check if the server has env var API keys configured
run('grep "DASHSCOPE_API_KEY" /www/zhishuai/server/.env 2>&1 | head -5')
run('grep "TENCENT_TOKENHUB" /www/zhishuai/server/.env 2>&1 | head -5')

# Test with fallback to env key (the getUserApiKey should fall back to env var if user has no key)
# This is the key test - does the fallback work?
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"messages":[{{"role":"user","content":"Hello"}}],"modelKey":"qwen_turbo","preferProvider":"aliyun"}}\'')

# Test code assistant with correct format
run('grep -A 10 "router.post.*chat" /www/zhishuai/server/src/routes/code-assistant.ts | head -15')

c.close()
print('\n=== DONE ===')
