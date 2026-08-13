import urllib.request, json, sys

API = "http://localhost:3001/api"

def test_login(phone, password, login_type):
    data = json.dumps({"phone": phone, "password": password, "loginType": login_type}).encode()
    req = urllib.request.Request(f"{API}/auth/login", data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        body = json.loads(resp.read().decode())
        return True, body["data"]["token"], body["data"]["user"]
    except urllib.error.HTTPError as e:
        return False, None, e.read().decode()[:300]
    except Exception as e:
        return False, None, str(e)

def test_api(path, token):
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return -1, str(e)

print("=" * 60)
print("智枢AI 三面板全链路验证 V2")
print("=" * 60)

# 1. 三种角色登录
roles = [
    ("Admin", "18601655222", "admin"),
    ("Agent", "13900000099", "agent"),
    ("Customer", "13800000001", "user"),
]

tokens = {}
for name, phone, lt in roles:
    ok, token, info = test_login(phone, "123456", lt)
    if ok:
        user_info = info if isinstance(info, dict) else {}
        print(f"[✓] {name}({phone}) 登录成功 -> {user_info.get('name', '?')} (role={user_info.get('role', '?')})")
        tokens[name] = token
    else:
        print(f"[✗] {name}({phone}) 登录失败 -> {info[:200]}")

# 2. 获取当前用户信息
print("\n--- 用户信息验证 ---")
for name, token in tokens.items():
    status, data = test_api("/auth/me", token)
    if status == 200 and data:
        print(f"[✓] {name} /auth/me -> {data.get('data', {}).get('name', '?')} (status={data.get('data', {}).get('status', '?')})")
    else:
        print(f"[✗] {name} /auth/me -> {status}")

# 3. API功能验证
print("\n--- API功能验证 ---")
api_tests = [
    ("Admin:仪表盘", "/admin-dashboard/stats", "Admin"),
    ("Admin:租户列表", "/admin-tenants", "Admin"),
    ("Admin:代理商列表", "/admin-agents", "Admin"),
    ("Agent:仪表盘", "/agent/stats", "Agent"),
    ("Agent:客户列表", "/agent/customers", "Agent"),
    ("Customer:仪表盘", "/agent/stats", "Customer"),
    ("Customer:AI工厂", "/ai-chat/chat-sessions", "Customer"),
]

for name, path, role in api_tests:
    token = tokens.get(role)
    if not token:
        print(f"[✗] {name} {path} -> 无token")
        continue
    status, data = test_api(path, token)
    ok = status in (200, 201, 204)
    print(f"[{'✓' if ok else '✗'}] {name} {path} -> {status}")

print("\n" + "=" * 60)
print("验证完成")
print("=" * 60)
