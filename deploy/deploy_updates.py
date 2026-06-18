#!/usr/bin/env python3
"""
智枢AI - 部署更新文件
仅上传修改的核心文件，重新构建并重启
"""
import paramiko
import sys
import os
import time

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

# 需要上传的文件列表（相对于项目根目录）
FILES_TO_UPLOAD = [
    "server/src/services/ai-model-router.ts",
    "server/src/services/pipeline.service.ts",
    "server/src/routes/ai-chat.ts",
    "server/src/routes/code-assistant.ts",
    "server/src/services/user-api-key.service.ts",
    "server/src/services/ai-models.ts",
    "server/src/index.ts",
]

LOCAL_PROJECT = r"c:\Users\Administrator\zhishuai"
REMOTE_BASE = "/www/zhishuai"

def ssh_exec(cmd, timeout=120):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        code = stdout.channel.recv_exit_status()
        return code, out, err
    except Exception as e:
        return -1, '', str(e)
    finally:
        client.close()

def ssh_exec_stream(cmd, timeout=300):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        output = ''
        error = ''
        while not stdout.channel.exit_status_ready():
            if stdout.channel.recv_ready():
                data = stdout.channel.recv(4096).decode('utf-8', errors='replace')
                output += data
                print(data, end='', flush=True)
            if stdout.channel.recv_stderr_ready():
                data = stdout.channel.recv_stderr(4096).decode('utf-8', errors='replace')
                error += data
                print(data, end='', flush=True)
            time.sleep(0.1)
        remaining_out = stdout.read().decode('utf-8', errors='replace')
        remaining_err = stderr.read().decode('utf-8', errors='replace')
        output += remaining_out
        error += remaining_err
        if remaining_out:
            print(remaining_out, end='', flush=True)
        if remaining_err:
            print(remaining_err, end='', flush=True)
        code = stdout.channel.recv_exit_status()
        return code, output, error
    except Exception as e:
        return -1, '', str(e)
    finally:
        client.close()

def upload_file(local_path, remote_path):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        sftp = client.open_sftp()
        # Ensure remote directory exists
        remote_dir = os.path.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            ssh_exec(f"mkdir -p {remote_dir}")
        sftp.put(local_path, remote_path)
        sftp.close()
        return True
    except Exception as e:
        print(f"  Upload error: {e}")
        return False
    finally:
        client.close()

def main():
    print("=" * 60)
    print("  智枢AI - 部署核心更新文件")
    print("  更新: ai-model-router, pipeline, ai-chat, index.ts")
    print("=" * 60)
    
    # Step 1: Test SSH connection
    print("\n[1/5] Testing SSH connection...")
    code, out, err = ssh_exec("echo SSH_OK && node -v && pwd")
    if code != 0 or 'SSH_OK' not in out:
        print(f"FAIL: Cannot connect. {err}")
        sys.exit(1)
    print(f"OK: {out.strip()}")
    
    # Step 2: Upload modified files
    print(f"\n[2/5] Uploading {len(FILES_TO_UPLOAD)} modified files...")
    success_count = 0
    for rel_path in FILES_TO_UPLOAD:
        local_path = os.path.join(LOCAL_PROJECT, rel_path.replace('/', os.sep))
        remote_path = f"{REMOTE_BASE}/{rel_path}"
        
        if not os.path.exists(local_path):
            print(f"  SKIP: {rel_path} (not found locally)")
            continue
        
        size_kb = os.path.getsize(local_path) / 1024
        if upload_file(local_path, remote_path):
            print(f"  OK: {rel_path} ({size_kb:.1f}KB)")
            success_count += 1
        else:
            print(f"  FAIL: {rel_path}")
    
    print(f"  Uploaded {success_count}/{len(FILES_TO_UPLOAD)} files")
    
    # Step 3: Rebuild TypeScript
    print("\n[3/5] Rebuilding TypeScript...")
    code, out, err = ssh_exec_stream(
        "cd /www/zhishuai/server && npm run build 2>&1 && echo BUILD_OK",
        timeout=120
    )
    if 'BUILD_OK' in out:
        print("\n  Build OK!")
    else:
        print(f"\n  Build may have issues:")
        # Print last part of output for debugging
        lines = out.strip().split('\n')
        for line in lines[-20:]:
            safe_line = line.encode('ascii', errors='replace').decode('ascii')
            print(f"    {safe_line}")
    
    # Step 4: Restart PM2
    print("\n[4/5] Restarting API server...")
    code, out, err = ssh_exec(
        "cd /www/zhishuai/server && pm2 restart zhishuai-api 2>&1 && pm2 save && echo RESTART_OK",
        timeout=30
    )
    if 'RESTART_OK' in out:
        print("  PM2 restarted!")
    else:
        print(f"  PM2 output: {out}")
    
    # Step 5: Verify
    print("\n[5/5] Verifying deployment...")
    time.sleep(5)  # Wait for server to start
    
    code, out, err = ssh_exec("pm2 status zhishuai-api 2>&1")
    # Safe print to avoid encoding issues on Windows
    safe_out = out.encode('ascii', errors='replace').decode('ascii')
    print(f"  PM2 Status:\n{safe_out}")
    
    code, out, err = ssh_exec("curl -s http://localhost:3001/api/health 2>/dev/null || echo API_NOT_READY")
    safe_out = out.encode('ascii', errors='replace').decode('ascii')
    if 'API_NOT_READY' not in out:
        print(f"  Health check: {safe_out[:200]}")
    else:
        print("  API not ready yet, checking logs...")
        code, out, err = ssh_exec("pm2 logs zhishuai-api --lines 20 --nostream 2>&1")
        safe_logs = out.encode('ascii', errors='replace').decode('ascii')
        print(safe_logs[-500:])
    
    # Test AI Chat endpoint
    print("\n  Testing AI Chat models endpoint...")
    code, out, err = ssh_exec(
        'curl -s http://localhost:3001/api/ai-chat/models 2>/dev/null | head -c 500 || echo MODELS_FAIL'
    )
    if 'MODELS_FAIL' not in out:
        safe_models = out.encode('ascii', errors='replace').decode('ascii')
        print(f"  Models response: {safe_models[:300]}...")
    else:
        print("  Models endpoint not accessible")
    
    print("\n" + "=" * 60)
    print("  Deployment Complete!")
    print("=" * 60)
    print(f"\n  API: https://api.baizhiji.net/api")
    print(f"  Web: https://baizhiji.net")

if __name__ == '__main__':
    main()
