"""Build and deploy script - Windows compatible"""
import os
import sys
import subprocess
import shutil

SERVER_DIR = r"c:\Users\Administrator\zhishuai\server"

def run_cmd(cmd, cwd=None):
    """Run command and return result"""
    print(f"Running: {cmd[:80]}...")
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd or SERVER_DIR,
            capture_output=True, timeout=120,
            encoding='utf-8', errors='replace'
        )
        if result.returncode != 0:
            print(f"  Exit code: {result.returncode}")
        if result.stdout:
            lines = result.stdout.strip().split('\n')
            out = '\n'.join(lines[-5:])
            print(f"  OUT: {out[:500]}")
        if result.stderr:
            lines = result.stderr.strip().split('\n')
            err = '\n'.join(lines[-5:])
            print(f"  ERR: {err[:500]}")
        return result.returncode == 0
    except Exception as e:
        print(f"  Exception: {e}")
        return False

# Build TypeScript
print("=" * 60)
print("Building server (tsc)...")
print("=" * 60)

# Use npm run build which calls tsc in package.json
run_cmd("npm run build 2>&1", SERVER_DIR)

# Verify dist exists and has new code
dist_file = os.path.join(SERVER_DIR, "dist", "services", "browser-auth.service.js")
if os.path.exists(dist_file):
    size = os.path.getsize(dist_file)
    with open(dist_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    checks = {
        'smartFindQRCode': 'smartFindQRCode' in content,
        'fallbackScreenshot': 'fallbackScreenshot' in content,
        'platformPreprocess': 'platformPreprocess' in content,
        'boss': '"boss"' in content or "'boss'" in content,
        'successUrlPatterns': 'successUrlPatterns' in content,
        'needSwitchToQrTab': 'needSwitchToQrTab' in content,
    }
    
    print(f"\ndist file: {size} bytes")
    print("Code checks:")
    for name, ok in checks.items():
        status = "OK" if ok else "MISSING!"
        print(f"  {name}: {status}")
else:
    print("ERROR: dist file not found!")

print("\nDone!")
