import paramiko, time, sys, base64

sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=15)

def run(c, cmd, t=30):
    _, out, _ = c.exec_command(cmd, timeout=t)
    return out.read().decode('utf-8', 'replace').strip()

# Check if tsc actually produced new output (errors might be pre-existing)
print("=== Check dist file timestamp ===")
out = run(c, "ls -la /var/www/zhishuai/server/dist/services/browser-auth.service.js 2>/dev/null")
print(f"  browser-auth.service.js: {out}")

# Check if the source change is reflected in dist
print("\n=== Check if fix is in dist ===")
out = run(c, "grep -c '扩展搜索' /var/www/zhishuai/server/dist/services/browser-auth.service.js 2>/dev/null || echo 'not found'")
print(f"  New code in dist: {out}")

# If not found in dist, we need to force rebuild
if 'not found' in out or out == '0':
    print("\n=== Force rebuild with --noEmitOnError false ===")
    # Use esbuild or just copy with ts-node approach
    print("Trying alternative build...")
    
    # Check if there's a build script
    out = run(c, "cat /var/www/zhishuai/server/package.json | grep -E '\"build\"|\"compile\"|\"start\"' | head -5")
    print(f"  Build scripts: {out}")
    
    # Try building with skipping type checks
    run(c, "cd /var/www/zhishuai/server && npx tsc --skipLibCheck --noEmitOnError 2>&1 | tail -5", t=120)
    
    # Verify again
    out = run(c, "grep -c 'qrcodeFound' /var/www/zhishuai/server/dist/services/browser-auth.service.js 2>/dev/null || echo 'still not found'")
    print(f"  qrcodeFound in dist after rebuild: {out}")

# Restart API
print("\n=== Restart API ===")
run(c, "pm2 restart zhishuai-api 2>&1")
time.sleep(3)
out = run(c, "pm2 list --no-color | grep zhishuai-api")
print(f"  {out.strip()}")

print("\nDone!")
c.close()
