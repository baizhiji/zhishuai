import urllib.request, json, sys

BASE = "http://localhost:3000"
API = "http://localhost:3001/api"

# 测试页面
pages = {
    "Admin": [
        "/admin/dashboard",
        "/admin/tenants",
        "/admin/agents",
        "/admin/api-providers",
        "/admin/announcement",
        "/admin/logs",
        "/admin/version",
    ],
    "Agent": [
        "/agent/dashboard",
        "/agent/customers",
        "/agent/tickets",
        "/agent/settlement",
        "/agent/usage",
    ],
    "Customer": [
        "/customer/dashboard",
        "/customer/ai-factory",
        "/customer/recruitment",
        "/customer/acquisition/board",
        "/customer/acquisition/discover",
        "/customer/acquisition/task",
        "/customer/share/board",
        "/customer/share/code",
        "/customer/share/track",
        "/customer/materials",
        "/customer/tickets",
    ],
}

def test_login(phone, password):
    data = json.dumps({"phone": phone, "password": password}).encode()
    req = urllib.request.Request(f"{API}/auth/login", data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        body = json.loads(resp.read().decode())
        return body["data"]["token"]
    except Exception as e:
        print(f"  LOGIN FAIL: {e}")
        return None

def test_page(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        # 先尝试通过login获取cookie
    try:
        req = urllib.request.Request(f"{BASE}{path}", headers=headers)
        resp = urllib.request.urlopen(req)
        html = resp.read().decode()
        return resp.status, len(html)
    except urllib.error.HTTPError as e:
        return e.code, 0
    except Exception as e:
        return -1, 0

print("=" * 60)
print("智枢AI 三面板全链路验证")
print("=" * 60)

# 登录获取token
print("\n[1] 登录验证")
admin_token = test_login("18601655222", "123456")
agent_token = test_login("13900000099", "123456")
customer_token = test_login("13800000001", "123456")

print(f"  Admin(18601655222): {'OK' if admin_token else 'FAIL'}")
print(f"  Agent(13900000099): {'OK' if agent_token else 'FAIL'}")
print(f"  Customer(13800000001): {'OK' if customer_token else 'FAIL'}")

# 测试各面板页面（页面HTML可访问即可，不强制登录态）
print("\n[2] 页面可访问性验证")

for role, paths in pages.items():
    token = None
    if role == "Admin":
        token = admin_token
    elif role == "Agent":
        token = agent_token
    else:
        token = customer_token
    
    print(f"\n  [{role}]")
    for path in paths:
        status, size = test_page(path, token)
        ok = status == 200
        print(f"    {'✓' if ok else '✗'} {path} -> {status} ({size} bytes)")

print("\n" + "=" * 60)
print("验证完成")
print("=" * 60)
