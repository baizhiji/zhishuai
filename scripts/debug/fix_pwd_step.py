import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=60)

def run_cmd(cmd, timeout=120):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    stderr.channel.settimeout(timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(out[:600].encode('ascii', 'replace').decode('ascii'))
    if err and 'CLIXML' not in err:
        print('ERR:', err[:300].encode('ascii', 'replace').decode('ascii'))
    print(f'Exit: {exit_code}')
    return out, err, exit_code

# 1. 安装mysql2
print('\n=== 1. 安装mysql2 ===')
run_cmd('cd /www/zhishuai/server && npm install mysql2 2>&1', timeout=180)

# 2. 上传脚本到server目录
print('\n=== 2. 上传脚本 ===')
sftp = c.open_sftp()
sftp.put('c:/Users/Administrator/zhishuai/update_pwd.js', '/www/zhishuai/server/update_pwd.js')
sftp.close()

# 3. 运行密码更新
print('\n=== 3. 运行密码更新 ===')
run_cmd('cd /www/zhishuai/server && node update_pwd.js 2>&1')

# 4. 测试登录
print('\n=== 4. 测试登录 ===')
time.sleep(2)
result = run_cmd("curl -sk https://baizhiji.net/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"phone\":\"18601655222\",\"password\":\"123456\"}' 2>/dev/null")
print(f'登录结果: {result[0][:300]}')

# 5. 清理和验证
print('\n=== 5. 清理和验证 ===')
run_cmd('rm -f /www/zhishuai/server/update_pwd.js /tmp/update_pwd.js /tmp/update_pwd.sql')
run_cmd('pm2 save 2>&1')
run_cmd('curl -sk https://baizhiji.net/api/health 2>/dev/null')

c.close()
