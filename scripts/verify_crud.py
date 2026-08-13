import urllib.request, json, sys

API = "http://localhost:3001/api"

def login(phone, password, login_type):
    data = json.dumps({"phone": phone, "password": password, "loginType": login_type}).encode()
    req = urllib.request.Request(f"{API}/auth/login", data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    body = json.loads(resp.read().decode())
    return body["data"]["token"], body["data"]["user"]

def api_post(path, token, body_data):
    data = json.dumps(body_data).encode()
    req = urllib.request.Request(f"{API}{path}", data=data, headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {token}"
    })
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return -1, str(e)

def api_get(path, token):
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=== 端到端CRUD验证: Admin -> 管理客户 ===\n")

# Login as admin
at, admin = login("18601655222", "123456", "admin")
print(f"[OK] Admin {admin['name']} (id={admin['id']}) login")

# 1. List existing customers
s, d = api_get("/admin/customers", at)
print(f"\n[1] 客户列表 GET /admin/customers -> {s}")
total = d.get("data", {}).get("total", 0) if d.get("data") else "?"
print(f"    总数: {total}")

# 2. Check agent list
s, d = api_get("/admin/agents", at)
print(f"\n[2] 代理商列表 GET /admin/agents -> {s}")
agents = d.get("data", []) if d.get("data") else []
if agents:
    print(f"    代理商数量: {len(agents)}")
    print(f"    第一个代理商: {agents[0].get('name', '?')}")

# 3. Create a test customer (if possible)
print(f"\n[3] 尝试创建测试客户...")
s, d = api_post("/admin/customers", at, {
    "name": "测试客户_验证",
    "phone": "15000000999",
    "password": "123456",
    "tenantName": "测试企业"
})
print(f"    POST /admin/customers -> {s}")
if 200 <= s < 300:
    print(f"    创建成功! -> {json.dumps(d, ensure_ascii=False)[:200]}")
elif s == 409:
    print(f"    已存在(正常)")
elif s == 400:
    msg = d.get("error", d)
    print(f"    参数校验失败: {msg}" if isinstance(msg, str) else f"    响应: {json.dumps(d, ensure_ascii=False)[:300]}")
else:
    print(f"    响应: {json.dumps(d, ensure_ascii=False)[:300]}")

# 4. Validate API feature toggle endpoint
print(f"\n[4] 功能开关验证...")
s, d = api_get("/admin/features", at)
print(f"    GET /admin/features -> {s}")
if d.get("data"):
    features = d["data"]
    print(f"    功能列表: {list(features.keys())[:5] if isinstance(features, dict) else '非字典类型'}")
else:
    print(f"    响应: {json.dumps(d, ensure_ascii=False)[:200]}")

# 5. Try customer features as the test customer
print(f"\n[5] 客户侧功能验证...")
ct, cuser = login("13800000001", "123456", "user")
print(f"    Customer {cuser['name']} login OK")

features = [
    ("AI创作工厂", "/ai-chat/conversations"),
    ("智能招聘", "/recruitment/jobs"),
    ("智能获客", "/acquisition/tasks"),
    ("推荐分享", "/share/stats"),
    ("素材库", "/materials/recent"),
    ("工单", "/tickets"),
]
for name, path in features:
    s, _ = api_get(path, ct)
    print(f"    [{'OK' if s==200 else 'FAIL'}] {name} -> {s}")

print(f"\n=== 全链路CRUD验证完成 ===")
