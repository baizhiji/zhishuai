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

# 1. Check what format /chat expects - look at the route handler
run('grep -A 20 "router.post.*chat.*authMiddleware" /www/zhishuai/server/src/routes/ai-chat.ts | head -25')

# 2. Test AI chat with proper message format
# Try the format: {content: "...", modelId: "..."}
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"content":"Hello, please tell me a joke","modelId":"qwen-turbo"}}\'')

# 3. Try the messages route format
run(f'curl -s -X POST "http://localhost:3001/api/ai-chat/messages" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"content":"Hello","modelId":"qwen-turbo","conversationId":"test"}}\'')

# 4. Check the enhanced routes work
run(f'curl -s -X POST "http://localhost:3001/api/ai-enhanced/title" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"content":"Marketing strategy for social media"}}\'')

# 5. Test AI workflow  
run(f'curl -s -X POST "http://localhost:3001/api/ai-workflow/execute" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"workflowType":"titleGeneration","params":{{"content":"Test content"}}}}\'')

# 6. Test Code assistant
run(f'curl -s -X POST "http://localhost:3001/api/code-assistant/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d \'{{"message":"Write a hello world function"}}\'')

c.close()
print('\n=== DONE ===')
