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

    def run(cmd, timeout=30):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', 'replace')
        err = stderr.read().decode('utf-8', 'replace')
        return out, err

    # 1. Clean .next
    print("\n[1] rm -rf .next...")
    out, err = run("rm -rf /var/www/zhishuai/web/.next")
    print(f"  Done")

    # 2. Build (long timeout)
    print("\n[2] npm run build (timeout 5min)...")
    out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

    # Check result
    has_build_id = False
    if 'Failed to compile' in out:
        idx = out.find('Failed to compile')
        print(f"  BUILD FAILED:")
        print(out[idx:idx+1500])
    else:
        # Show success markers
        for line in out.split('\n'):
            if '✓' in line or 'Creating' in line or 'Compiled' in line or 'Route' in line or 'Build' in line:
                print(f"  {line.strip()}")
        has_build_id = True

    # 3. Verify BUILD_ID
    print("\n[3] Check BUILD_ID...")
    out, err = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
    bid = out.strip()
    print(f"  BUILD_ID = {bid}")
    if not bid or 'No such file' in bid:
        print("  MISSING BUILD_ID - build probably failed")
        # Show .next dir
        out2, _ = run("ls -la /var/www/zhishuai/web/.next/ 2>&1")
        print(out2)
        client.close()
        raise Exception("Build failed - no BUILD_ID")

    # 4. Restart web
    print("\n[4] Restart zhishuai-web...")
    run("pm2 delete zhishuai-web 2>/dev/null")
    out, err = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
    print(f"  {out.strip()[-200:]}")
    run("pm2 save")

    # 5. Wait and check
    print("\n[5] Waiting 25 seconds...")
    import time
    time.sleep(25)

    out, _ = run("pm2 status 2>&1")
    print(out)

    out, _ = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
    print(f"  localhost:3000 = {out.strip()}")

    out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
    print(f"  baizhiji.net = {out.strip()}")

    out, _ = run("curl -s http://localhost:3001/api/health 2>&1")
    print(f"  API = {out.strip()[:100]}")

    client.close()
    print("\n=== COMPLETE ===")

except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    traceback.print_exc()
