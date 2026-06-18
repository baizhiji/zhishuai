#!/usr/bin/env python3
"""Check tsconfig and fix build on server"""
import paramiko

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)

cmds = [
    "cat /www/zhishuai/server/tsconfig.json",
    "ls /www/zhishuai/server/src/__tests__/ 2>/dev/null | head -10",
    # Check if the previously built dist exists and works
    "ls -la /www/zhishuai/server/dist/services/ai-model-router.js /www/zhishuai/server/dist/services/pipeline.service.js /www/zhishuai/server/dist/routes/ai-chat.js 2>/dev/null || echo NO_DIST_FILES",
    "head -5 /www/zhishuai/server/dist/services/ai-model-router.js 2>/dev/null || echo NO_FILE",
]

for cmd in cmds:
    print(f"\n>>> {cmd[:80]}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    safe = out.encode('ascii', errors='replace').decode('ascii')
    print(safe[:2000])

client.close()
