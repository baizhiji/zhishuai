import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('150.109.60.130', 22, 'ubuntu', 'Hao20061218', timeout=60)

def run_cmd(cmd, timeout=60):
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

# 上传prisma版本脚本
sftp = c.open_sftp()
sftp.put('c:/Users/Administrator/zhishuai/update_pwd_prisma.js', '/www/zhishuai/server/update_pwd.js')
sftp.close()

# 运行
result = run_cmd('cd /www/zhishuai/server && node update_pwd.js 2>&1')
print(f'密码更新结果: {result[0]}')

# 测试登录
time.sleep(2)
result = run_cmd("curl -sk https://baizhiji.net/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"phone\":\"18601655222\",\"password\":\"123456\"}' 2>/dev/null")
if 'token' in result[0] or 'true' in result[0].lower():
    print('\n=== 登录成功! ===')
else:
    print(f'\n登录结果: {result[0][:300]}')
    # 查看auth.ts中用什么字段名
    run_cmd("grep -n 'password' /www/zhishuai/server/dist/routes/auth.js | head -10 2>/dev/null")

# 清理
run_cmd('rm -f /www/zhishuai/server/update_pwd.js')

c.close()
