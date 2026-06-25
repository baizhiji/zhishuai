#!/usr/bin/env python3
"""Upload fixed files and rebuild Next.js on server"""
import paramiko, sys, time, os, base64

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"
LOCAL_WEB = r"C:\Users\Administrator\zhishuai\web"
REMOTE_WEB = "/var/www/zhishuai/web"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("[1] Connecting...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
    print("  Connected!")

    def run(cmd, timeout=30):
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', 'replace')
        err = stderr.read().decode('utf-8', 'replace')
        return out, err

    # Upload files using base64 encoding to avoid shell escaping issues
    files = [
        ("app/account/page.tsx", "app/account/page.tsx"),
        ("app/account/recharge/page.tsx", "app/account/recharge/page.tsx"),
        ("app/admin/performance/page.tsx", "app/admin/performance/page.tsx"),
        ("next.config.js", "next.config.js"),
    ]

    print("\n[2] Uploading files via base64...")
    for local_rel, remote_rel in files:
        local_path = os.path.join(LOCAL_WEB, local_rel)
        remote_path = REMOTE_WEB + "/" + remote_rel
        
        print(f"  {local_rel}...")
        
        with open(local_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        encoded = base64.b64encode(content.encode('utf-8')).decode('ascii')
        
        # Split into chunks to avoid very long commands
        chunk_size = 4000
        chunks = [encoded[i:i+chunk_size] for i in range(0, len(encoded), chunk_size)]
        
        # First chunk: create file
        cmd = f"echo '{chunks[0]}' | base64 -d > '{remote_path}'"
        out, err = run(cmd, timeout=15)
        
        # Subsequent chunks: append
        for chunk in chunks[1:]:
            cmd = f"echo '{chunk}' | base64 -d >> '{remote_path}'"
            out, err = run(cmd, timeout=15)
        
        print(f"    Uploaded ({len(content)} bytes)")

    # Verify uploads
    print("\n[3] Verifying uploads...")
    out, _ = run("grep 'ignoreBuildErrors' /var/www/zhishuai/web/next.config.js | head -1")
    print(f"  next.config.js: {out.strip()}")
    
    out, _ = run("grep -n 's.iconType' /var/www/zhishuai/web/app/account/page.tsx | head -1")
    print(f"  account/page.tsx: {out.strip()}")

    # Clean and rebuild
    print("\n[4] Cleaning old build...")
    run("rm -rf /var/www/zhishuai/web/.next")
    print("  Done")

    print("\n[5] Building Next.js (2-3 min)...")
    out, err = run("cd /var/www/zhishuai/web && NODE_ENV=production npm run build 2>&1", timeout=300)

    if 'Failed to compile' in out:
        idx = out.find('Failed to compile')
        print(f"  BUILD FAILED:")
        print(out[idx:idx+1500])
        client.close()
        raise Exception("Build failed")
    
    print(f"  Build completed! Last output lines:")
    for line in out.split('\n')[-10:]:
        if line.strip():
            print(f"    {line.strip()[:100]}")

    # Verify BUILD_ID
    print("\n[6] Checking BUILD_ID...")
    out, _ = run("cat /var/www/zhishuai/web/.next/BUILD_ID 2>&1")
    bid = out.strip()
    print(f"  BUILD_ID = {bid}")
    
    if not bid or 'No such' in bid or 'error' in bid.lower():
        raise Exception("No BUILD_ID found")

    # Restart web
    print("\n[7] Restarting zhishuai-web...")
    run("pm2 delete zhishuai-web 2>/dev/null")
    out, _ = run("cd /var/www/zhishuai/web && pm2 start ecosystem.config.cjs 2>&1")
    run("pm2 save")

    # Wait and verify
    print("\n[8] Waiting 25 sec...")
    time.sleep(25)

    out, _ = run("pm2 status 2>&1")
    print(out)

    out, _ = run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>&1")
    local_code = out.strip()
    print(f"  localhost:3000 = {local_code}")

    out, _ = run("curl -s -o /dev/null -w '%{http_code}' https://baizhiji.net 2>&1")
    domain_code = out.strip()
    print(f"  baizhiji.net = {domain_code}")

    if local_code != '200' or domain_code != '200':
        print("\n  Debug logs:")
        out, _ = run("pm2 logs zhishuai-web --lines 10 --nostream 2>&1")
        print(out[-1000:])

    client.close()
    
    print("\n=== RESULT ===")
    if domain_code == '200':
        print("SUCCESS! Web frontend restored at https://baizhiji.net")
    else:
        print(f"Status: local={local_code}, domain={domain_code}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
