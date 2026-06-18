#!/usr/bin/env python3
"""Deploy script using paramiko for SSH/SFTP operations"""
import paramiko
import os
import sys
import time

SERVER_IP = "150.109.60.130"
SERVER_USER = "root"
SERVER_PASS = "Hao20061218"
TAR_FILE = os.path.join(os.environ.get("TEMP", "/tmp"), "zhishuai-deploy.tar.gz")

def create_ssh_client():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, port=22, username=SERVER_USER, password=SERVER_PASS, timeout=30)
    return client

def upload_file(client, local_path, remote_path):
    sftp = client.open_sftp()
    print(f"Uploading {local_path} -> {remote_path}...")
    file_size = os.path.getsize(local_path)
    print(f"File size: {file_size / (1024*1024):.1f} MB")
    sftp.put(local_path, remote_path)
    sftp.close()
    print("Upload complete!")

def run_command(client, cmd, timeout=300):
    print(f"\n>>> Running: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print(f"[stderr] {err}")
    print(f"Exit code: {exit_code}")
    return exit_code, out, err

def main():
    print("=" * 60)
    print("Starting deployment to 150.109.60.130")
    print("=" * 60)

    # Step 1: Connect
    print("\n[1] Connecting to server...")
    client = create_ssh_client()
    print("Connected!")

    # Step 2: Upload tar file
    print("\n[2] Uploading deployment package...")
    upload_file(client, TAR_FILE, "/tmp/zhishuai-deploy.tar.gz")

    # Step 3: Extract on server
    print("\n[3] Extracting on server...")
    run_command(client, "mkdir -p /opt/zhishuai && cd /opt/zhishuai && tar -xzf /tmp/zhishuai-deploy.tar.gz")

    # Step 4: Copy .env to server root
    print("\n[4] Setting up .env file...")
    run_command(client, "cp /opt/zhishuai/server/.env /opt/zhishuai/server/.env.bak 2>/dev/null; ls -la /opt/zhishuai/server/.env")

    # Step 5: Install dependencies
    print("\n[5] Installing server dependencies...")
    run_command(client, "cd /opt/zhishuai/server && npm install --production", timeout=600)

    # Step 6: Build server
    print("\n[6] Building server...")
    run_command(client, "cd /opt/zhishuai/server && npm run build 2>/dev/null || echo 'No build step needed'")

    # Step 7: Install PM2 globally
    print("\n[7] Ensuring PM2 is installed...")
    run_command(client, "npm install -g pm2 2>/dev/null || true")

    # Step 8: Start/restart server with PM2
    print("\n[8] Starting server with PM2...")
    run_command(client, "cd /opt/zhishuai && pm2 delete zhishuai-server 2>/dev/null; cd /opt/zhishuai/server && pm2 start ecosystem.config.cjs --name zhishuai-server || pm2 start src/index.js --name zhishuai-server")

    # Step 9: Save PM2 config
    print("\n[9] Saving PM2 configuration...")
    run_command(client, "pm2 save")

    # Step 10: Verify
    print("\n[10] Verifying deployment...")
    time.sleep(3)
    run_command(client, "pm2 list")
    run_command(client, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health || curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/ || echo 'Checking...'")
    run_command(client, "pm2 logs zhishuai-server --lines 20 --nostream")

    print("\n" + "=" * 60)
    print("Deployment complete!")
    print("=" * 60)
    client.close()

if __name__ == "__main__":
    main()
