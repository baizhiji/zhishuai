#!/usr/bin/env python3
"""部署 OAuth 授权修复 v3 到服务器"""
import paramiko
import os
import time
import sys
import traceback

HOST = "150.109.60.130"
USER = "ubuntu"
PASS = "Hao20061218"
REMOTE_DIR = "/var/www/zhishuai"

def ssh_connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"[连接] {USER}@{HOST}...")
    client.connect(HOST, port=22, username=USER, password=PASS, timeout=30)
    print("[连接] 成功!")
    return client

def ssh_exec(client, cmd, timeout=120, silent=False):
    print(f"[SSH] {cmd[:80]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    if not silent and out: 
        # 安全打印，避免编码问题
        try:
            print(out[-2000:])
        except UnicodeEncodeError:
            print(out[-2000:].encode('ascii', errors='replace').decode('ascii'))
    return out, err, code

def scp_upload(client, local_path, remote_path):
    print(f"[SCP] {os.path.basename(local_path)} -> {remote_path}")
    sftp = client.open_sftp()
    sftp.put(local_path, remote_path)
    print("[SCP] 成功!")
    sftp.close()

def main():
    print("=" * 60)
    print("  智枢AI - OAuth 授权修复 v3 部署")
    print("=" * 60)
    
    client = ssh_connect()
    
    # 1. 上传 server 编译产物
    print("\n[1] 上传 browser-auth.service.js...")
    scp_upload(client,
        "c:/Users/Administrator/zhishuai/server/dist/services/browser-auth.service.js",
        f"{REMOTE_DIR}/server/dist/services/browser-auth.service.js"
    )
    scp_upload(client,
        "c:/Users/Administrator/zhishuai/server/dist/services/browser-auth.service.js.map",
        f"{REMOTE_DIR}/server/dist/services/browser-auth.service.js.map"
    )
    
    # 2. 验证新代码
    print("\n[2] 验证新代码...")
    out, _, _ = ssh_exec(client, f"grep -c 'successUrls' {REMOTE_DIR}/server/dist/services/browser-auth.service.js")
    print(f"  successUrls: {out.strip()}")
    out, _, _ = ssh_exec(client, f"grep -c 'qrSearchResult' {REMOTE_DIR}/server/dist/services/browser-auth.service.js")
    print(f"  qrSearchResult: {out.strip()}")
    
    # 3. 上传前端页面文件
    print("\n[3] 上传 page.tsx...")
    scp_upload(client,
        "c:/Users/Administrator/zhishuai/web/app/customer/media/matrix/page.tsx",
        f"{REMOTE_DIR}/web/app/customer/media/matrix/page.tsx"
    )
    
    # 4. 服务器上构建前端
    print("\n[4] 构建前端 (需要几分钟)...")
    out, err, code = ssh_exec(client, f"cd {REMOTE_DIR}/web && npm run build 2>&1", timeout=300, silent=True)
    print(f"  构建退出码: {code}")
    if code != 0:
        # 只打印错误部分
        err_lines = err.split('\n')
        print(f"  错误行数: {len(err_lines)}")
        try:
            print(f"  最后5行错误: {err_lines[-5:]}")
        except:
            pass
    
    # 5. 重启 API 服务
    print("\n[5] 重启 API 服务...")
    # ubuntu 用户可能需要 sudo 来操作 pm2
    out, err, code = ssh_exec(client, f"cd {REMOTE_DIR}/server && sudo pm2 restart zhishuai-api 2>&1")
    time.sleep(5)
    
    # 6. 重启 Web 服务
    print("\n[6] 重启 Web 服务...")
    out, err, code = ssh_exec(client, f"cd {REMOTE_DIR}/web && sudo pm2 restart zhishuai-web 2>&1")
    time.sleep(5)
    
    # 7. 验证服务
    print("\n[7] 验证服务...")
    ssh_exec(client, "sudo pm2 status 2>&1")
    
    # 8. 健康检查
    print("\n[8] API 健康检查...")
    ssh_exec(client, "curl -s http://localhost:3001/api/health 2>&1 | head -5")
    
    client.close()
    
    print("\n" + "=" * 60)
    print("  部署完成!")
    print("  测试: https://baizhiji.net/customer/media/matrix")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n部署失败: {e}")
        traceback.print_exc()
        sys.exit(1)
