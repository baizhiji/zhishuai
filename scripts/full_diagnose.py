#!/usr/bin/env python3
"""全面诊断：登录入口、页面访问、授权功能"""
import subprocess, json, sys

def run(cmd, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except Exception as e:
        return "", str(e), -1

def curl_get(url, desc):
    out, err, code = run(f'curl -sk -o /dev/null -w "%{{http_code}}" "{url}"')
    status = out if out else f"ERR:{err[:80]}"
    print(f"  [{status}] {desc}: {url}")
    return status

def curl_post(url, data, desc):
    cmd = f'''curl -sk -X POST "{url}" -H "Content-Type: application/json" -d '{json.dumps(data)}' '''
    out, err, code = run(cmd)
    try:
        result = json.loads(out)
        success = result.get('success', result.get('token', False))
        msg = result.get('message', result.get('error', ''))[:60]
        print(f"  [{'OK' if success else 'FAIL'}] {desc}: {msg}")
        return result
    except:
        print(f"  [??] {desc}: {out[:100]}")
        return {}

print("=" * 70)
print("第1部分：所有登录入口")
print("=" * 70)

# 测试不同角色的登录
login_tests = [
    # (url, phone, password, desc)
    ("https://baizhiji.net/api/auth/login", "18601655222", "20061218", "主站-管理员登录"),
    ("https://api.baizhiji.net/api/auth/login", "18601655222", "20061218", "API子域-管理员登录"),
]

# 检查是否有其他用户
print("\n--- 检查数据库中的用户 ---")
out, err, code = run("ssh root@150.109.60.130 'cd /www/wwwroot/baizhiji/server && npx prisma db execute --stdin <<\"SQL\"\nSELECT phone, name, role FROM users LIMIT 20;\nSQL'", timeout=30)
if out:
    print(out[:500])
else:
    # 尝试另一种方式
    out2, err2, _ = run('ssh root@150.109.60.130 "cd /www/wwwroot/baizhiji/server && node -e \\"const {PrismaClient}=require(\'@prisma/client\');const p=new PrismaClient();p.user.findMany({select:{phone:true,name:true,role:true}}).then(r=>console.log(JSON.stringify(r))).catch(e=>console.error(e))\\""', timeout=30)
    print(out2[:500] if out2 else f"DB查询失败: {err2[:100]}")

print("\n--- 测试登录入口 ---")
tokens = {}
for url, phone, pwd, desc in login_tests:
    result = curl_post(url, {"phone": phone, "password": pwd}, desc)
    if result.get('token') or result.get('data', {}).get('token'):
        token = result.get('token') or result.get('data', {}).get('token')
        tokens[desc] = token
        print(f"    Token: {token[:30]}...")

print("\n" + "=" * 70)
print("第2部分：所有页面访问检查")
print("=" * 70)

pages = [
    ("https://baizhiji.net/", "首页"),
    ("https://baizhiji.net/login", "登录页"),
    ("https://baizhiji.net/dashboard", "仪表盘"),
    ("https://baizhiji.net/customers", "客户管理"),
    ("https://baizhiji.net/crm", "CRM"),
    ("https://baizhiji.net/marketing", "营销管理"),
    ("https://baizhiji.net/materials", "素材管理"),
    ("https://baizhiji.net/ai", "AI功能"),
    ("https://baizhiji.net/recruitment", "招聘管理"),
    ("https://baizhiji.net/data", "数据中心"),
    ("https://baizhiji.net/matrix-accounts", "矩阵账号"),
    ("https://baizhiji.net/acquisition", "获客管理"),
    ("https://baizhiji.net/accounts", "账户管理"),
    ("https://baizhiji.net/settings", "设置"),
    ("https://baizhiji.net/profile", "个人资料"),
    ("https://api.baizhiji.net/", "API子域首页"),
    ("https://api.baizhiji.net/api/health", "API健康检查"),
]

print("\n--- 无认证页面 ---")
for url, desc in pages:
    curl_get(url, desc)

print("\n" + "=" * 70)
print("第3部分：API端点授权检查")
print("=" * 70)

api_endpoints = [
    ("GET", "/api/health", "健康检查(无需认证)"),
    ("GET", "/api/auth/me", "当前用户(需认证)"),
    ("GET", "/api/customers", "客户列表(需认证)"),
    ("GET", "/api/crm/contacts", "CRM联系人(需认证)"),
    ("GET", "/api/marketing/campaigns", "营销活动(需认证)"),
    ("GET", "/api/materials", "素材列表(需认证)"),
    ("GET", "/api/ai/templates", "AI模板(需认证)"),
    ("GET", "/api/recruitment/jobs", "招聘职位(需认证)"),
    ("GET", "/api/data/reports", "数据报表(需认证)"),
    ("GET", "/api/matrix-accounts", "矩阵账号(需认证)"),
    ("GET", "/api/acquisition/channels", "获客渠道(需认证)"),
    ("GET", "/api/settings", "系统设置(需认证)"),
    ("GET", "/api/users", "用户列表(需认证)"),
]

base = "https://baizhiji.net"
admin_token = tokens.get("主站-管理员登录", "")

print("\n--- 无Token访问(应返回401) ---")
for method, path, desc in api_endpoints:
    if "health" in path:
        continue
    url = f"{base}{path}"
    out, _, _ = run(f'curl -sk -o /dev/null -w "%{{http_code}}" "{url}"')
    expected = "401" if "health" not in path else "200"
    status = "OK" if out == expected else "WARN"
    print(f"  [{status}] {desc}: HTTP {out}")

if admin_token:
    print(f"\n--- 有Token访问(应返回200) ---")
    for method, path, desc in api_endpoints:
        url = f"{base}{path}"
        cmd = f'curl -sk -o /dev/null -w "%{{http_code}}" -H "Authorization: Bearer {admin_token}" "{url}"'
        out, _, _ = run(cmd)
        print(f"  [{'OK' if out in ['200','201'] else out}] {desc}: HTTP {out}")

print("\n" + "=" * 70)
print("第4部分：第三方授权入口检查")
print("=" * 70)

# 检查自媒体授权、招聘授权等
auth_endpoints = [
    ("GET", "/api/auth/wechat", "微信授权"),
    ("GET", "/api/auth/wechat/callback", "微信回调"),
    ("GET", "/api/auth/douyin", "抖音授权"),
    ("GET", "/api/auth/xiaohongshu", "小红书授权"),
    ("GET", "/api/matrix-accounts/auth/wechat", "矩阵账号-微信授权"),
    ("GET", "/api/matrix-accounts/auth/douyin", "矩阵账号-抖音授权"),
    ("GET", "/api/matrix-accounts/auth/xiaohongshu", "矩阵账号-小红书授权"),
    ("GET", "/api/recruitment/platforms", "招聘平台列表"),
    ("GET", "/api/recruitment/auth/boss", "BOSS直聘授权"),
    ("GET", "/api/recruitment/auth/zhaopin", "智联招聘授权"),
]

print("\n--- 第三方授权端点 ---")
for method, path, desc in auth_endpoints:
    url = f"{base}{path}"
    out, err, code = run(f'curl -sk -L -o /dev/null -w "%{{http_code}}|%{{redirect_url}}" "{url}"', timeout=10)
    parts = out.split("|")
    http_code = parts[0] if parts else "?"
    redirect = parts[1] if len(parts) > 1 and parts[1] != "" else ""
    extra = f" -> {redirect[:60]}" if redirect else ""
    print(f"  [{http_code}] {desc}: {path}{extra}")

print("\n诊断完成！")
