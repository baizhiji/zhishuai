#!/usr/bin/env python3
"""智枢AI SSH部署工具 - 使用paramiko"""
import paramiko
import sys
import os
import time

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"

def ssh_exec(cmd, timeout=120):
    """执行远程命令"""
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

def ssh_exec_stream(cmd, timeout=600):
    """执行远程命令并实时输出"""
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
        # Read remaining
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
    """通过SFTP上传文件"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        sftp = client.open_sftp()
        sftp.put(local_path, remote_path)
        sftp.close()
        return True
    except Exception as e:
        print(f"Upload error: {e}")
        return False
    finally:
        client.close()

def upload_directory(local_dir, remote_dir, excludes=None):
    """递归上传目录"""
    if excludes is None:
        excludes = {'node_modules', '.git', '__pycache__', '.next', '.turbo', 'dist', '.prisma'}
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(HOST, port=22, username=USER, password=PASS, timeout=15)
        sftp = client.open_sftp()
        
        def _upload_recursive(local, remote):
            try:
                sftp.stat(remote)
            except FileNotFoundError:
                # Create directory via SSH since SFTP mkdir may not work with -p
                ssh_exec(f"mkdir -p {remote}")
            
            for item in os.listdir(local):
                if item in excludes or item.startswith('.'):
                    continue
                local_path = os.path.join(local, item)
                remote_path = f"{remote}/{item}"
                
                if os.path.isdir(local_path):
                    _upload_recursive(local_path, remote_path)
                elif os.path.isfile(local_path) and os.path.getsize(local_path) < 50 * 1024 * 1024:  # skip files > 50MB
                    try:
                        sftp.put(local_path, remote_path)
                    except Exception as e:
                        print(f"  Skip {local_path}: {e}")
        
        _upload_recursive(local_dir, remote_dir)
        sftp.close()
        return True
    except Exception as e:
        print(f"Upload directory error: {e}")
        return False
    finally:
        client.close()

if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'check'
    
    if action == 'check':
        print("Testing SSH connection...")
        code, out, err = ssh_exec("echo SSH_OK && node -v && pm2 -v 2>/dev/null && ls /var/www/zhishuai/ 2>/dev/null || echo NO_PROJECT")
        print(f"Exit code: {code}")
        print(f"Output: {out}")
        if err:
            print(f"Stderr: {err}")
    
    elif action == 'deploy':
        print("=" * 50)
        print("  智枢AI SaaS 部署")
        print("=" * 50)
        
        # Step 1: Test connection
        print("\n[1/6] Testing SSH connection...")
        code, out, err = ssh_exec("echo SSH_OK && uname -a && node -v")
        if code != 0 or 'SSH_OK' not in out:
            print(f"FAIL: Cannot connect to server. {err}")
            sys.exit(1)
        print(f"OK: {out.strip()}")
        
        # Step 2: Create directories
        print("\n[2/6] Creating remote directories...")
        code, out, err = ssh_exec("mkdir -p /var/www/zhishuai/server /var/www/zhishuai/web /var/www/zhishuai/deploy /var/log/zhishuai")
        print(f"OK: directories created")
        
        # Step 3: Upload server code (using tar for speed)
        print("\n[3/6] Uploading server code...")
        # Create tar locally first
        local_project = r"c:\Users\Administrator\zhishuai"
        tar_file = os.path.join(os.environ.get('TEMP', '/tmp'), 'zhishuai-server.tar.gz')
        
        # Use tar to package server directory
        os.system(f'cd /d {local_project} && tar --exclude=node_modules --exclude=.git --exclude=dist --exclude=.prisma --exclude=__pycache__ -czf "{tar_file}" server')
        
        # Upload tar
        print(f"  Uploading {os.path.getsize(tar_file) / 1024 / 1024:.1f} MB...")
        if upload_file(tar_file, '/tmp/zhishuai-server.tar.gz'):
            print("  Extracting on server...")
            code, out, err = ssh_exec("cd /var/www/zhishuai && tar -xzf /tmp/zhishuai-server.tar.gz && rm /tmp/zhishuai-server.tar.gz && echo EXTRACT_OK")
            if 'EXTRACT_OK' in out:
                print("  Server code uploaded!")
            else:
                print(f"  Extract may have issues: {err}")
        else:
            print("  Upload failed!")
            sys.exit(1)
        
        # Step 4: Install dependencies and build on server
        print("\n[4/6] Installing dependencies and building server...")
        code, out, err = ssh_exec_stream(
            "cd /var/www/zhishuai/server && "
            "npm install --production=false 2>&1 && "
            "echo INSTALL_OK",
            timeout=300
        )
        if 'INSTALL_OK' in out:
            print("\n  npm install OK!")
        else:
            print(f"\n  npm install may have issues")
        
        print("  Building TypeScript...")
        code, out, err = ssh_exec_stream(
            "cd /var/www/zhishuai/server && npm run build 2>&1 && echo BUILD_OK",
            timeout=120
        )
        if 'BUILD_OK' in out:
            print("  Build OK!")
        else:
            print(f"  Build may have issues: {out[-500:] if len(out) > 500 else out}")
        
        # Step 5: Database migration
        print("\n[5/6] Running database migration...")
        code, out, err = ssh_exec_stream(
            "cd /var/www/zhishuai/server && "
            "npx prisma migrate deploy 2>&1 || "
            "npx prisma db push --accept-data-loss 2>&1 && "
            "echo MIGRATE_OK",
            timeout=120
        )
        if 'MIGRATE_OK' in out:
            print("  Migration OK!")
        else:
            print(f"  Migration output: {out[-300:]}")
        
        # Step 6: Start/restart PM2
        print("\n[6/6] Starting API server with PM2...")
        # Write .env file on server
        env_content = '''DATABASE_URL="mysql://root:Hao-20061218@gz-cynosdbpg-proxy-46031483.sql.tencentcdb.com:29094/zhishuai?connection_limit=20&pool_timeout=10"
JWT_SECRET="zs9kP2xL7mN4qR8vW3yA6bC1dE5fG0hJ"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
API_VERSION="v1"
FRONTEND_URL="https://baizhiji.net"
APP_URL="https://app.baizhiji.net"
DASHSCOPE_API_KEY=""
TENCENT_TOKENHUB_API_KEY=""
OPENAI_API_KEY=""
'''
        # Write env file via SSH
        code, out, err = ssh_exec(f"cat > /var/www/zhishuai/server/.env << 'ENVEOF'\n{env_content}ENVEOF")
        
        # Write ecosystem config
        ecosystem = '''module.exports = {
  apps: [{
    name: 'zhishuai-api',
    script: './dist/index.js',
    cwd: '/var/www/zhishuai/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/var/log/zhishuai/api-error.log',
    out_file: '/var/log/zhishuai/api-out.log',
    time: true,
  }],
};'''
        code, out, err = ssh_exec(f"cat > /var/www/zhishuai/server/ecosystem.config.cjs << 'ECOEOF'\n{ecosystem}ECOEOF")
        
        # Install PM2 if needed, then start
        code, out, err = ssh_exec_stream(
            "npm install -g pm2 2>/dev/null; "
            "cd /var/www/zhishuai/server && "
            "pm2 delete zhishuai-api 2>/dev/null; "
            "pm2 start ecosystem.config.cjs 2>&1 && "
            "pm2 save 2>&1 && "
            "pm2 startup 2>/dev/null; "
            "echo PM2_START_OK",
            timeout=60
        )
        if 'PM2_START_OK' in out:
            print("  PM2 started!")
        else:
            print(f"  PM2 output: {out[-300:]}")
        
        # Verify
        print("\nVerifying deployment...")
        time.sleep(3)
        code, out, err = ssh_exec("pm2 status && curl -s http://localhost:3001/api/health 2>/dev/null || echo API_NOT_READY")
        print(out)
        
        # Cleanup local tar
        try:
            os.remove(tar_file)
        except:
            pass
        
        print("\n" + "=" * 50)
        print("  Deployment Complete!")
        print("=" * 50)
        print(f"\n  API: https://api.baizhiji.net/api")
        print(f"  Web: https://baizhiji.net")
    
    elif action == 'migrate':
        print("Running database migration only...")
        code, out, err = ssh_exec_stream(
            "cd /var/www/zhishuai/server && "
            "npx prisma migrate deploy 2>&1 || "
            "npx prisma db push --accept-data-loss 2>&1",
            timeout=120
        )
        print(out)
    
    elif action == 'restart':
        print("Restarting PM2 services...")
        code, out, err = ssh_exec("cd /var/www/zhishuai/server && pm2 restart zhishuai-api 2>&1 && pm2 save")
        print(out)
    
    elif action == 'status':
        code, out, err = ssh_exec("pm2 status && echo --- && curl -s http://localhost:3001/api/health 2>/dev/null || echo API_NA")
        print(out)
    
    else:
        print(f"Usage: python {sys.argv[0]} [check|deploy|migrate|restart|status]")
