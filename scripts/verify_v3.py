import urllib.request, json, sys, time

API = "http://localhost:3001/api"
time.sleep(3)  # wait for API to start

def login(phone, password, login_type):
    data = json.dumps({"phone": phone, "password": password, "loginType": login_type}).encode()
    req = urllib.request.Request(f"{API}/auth/login", data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        body = json.loads(resp.read().decode())
        d = body.get("data", body)
        return True, d.get("token", ""), d.get("user", {}).get("id", "")
    except urllib.error.HTTPError as e:
        return False, "", f"{e.code}: {e.read().decode()[:200]}"
    except Exception as e:
        return False, "", str(e)

def api_get(path, token):
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)

passed = failed = 0

def check(name, ok, detail=""):
    global passed, failed
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f" - {detail}" if detail else ""))
    if ok: passed += 1
    else: failed += 1

print("=" * 60)
print("智枢AI 全链路验证 V2")
print("=" * 60)

# LOGIN
print("\n[Phase 1] 登录")
a_ok, at, aid = login("18601655222", "123456", "admin")
b_ok, bt, bid = login("13900000099", "123456", "agent")
c_ok, ct, cid = login("13800000001", "123456", "user")
check("Admin", a_ok)
check("Agent", b_ok)
check("Customer", c_ok)

# USER INFO
print("\n[Phase 2] 用户信息")
check("Admin    /auth/me", api_get("/auth/me", at)[0] == 200)
check("Agent    /auth/me", api_get("/auth/me", bt)[0] == 200)
check("Customer /auth/me", api_get("/auth/me", ct)[0] == 200)

# ADMIN APIs
print("\n[Phase 3] Admin 总后台 API")
s, _ = api_get("/admin/dashboard/", at)
check("运营看板   GET /admin/dashboard/", 200 <= s < 300, f"s={s}")
s, _ = api_get("/admin/agents", at)
check("代理商管理 GET /admin/agents", 200 <= s < 300, f"s={s}")
s, _ = api_get("/admin/customers", at)
check("客户管理   GET /admin/customers", 200 <= s < 300, f"s={s}")
s, _ = api_get("/admin/features", at)
check("功能开关   GET /admin/features", 200 <= s < 300, f"s={s}")
s, _ = api_get("/announcements", at)
check("公告管理   GET /announcements", 200 <= s < 300, f"s={s}")

# AGENT APIs
print("\n[Phase 4] Agent 代理商 API")
s, _ = api_get("/agent/statistics", bt)
check("数据统计   GET /agent/statistics", 200 <= s < 300, f"s={s}")
s, _ = api_get("/agent/customers", bt)
check("客户列表   GET /agent/customers", 200 <= s < 300, f"s={s}")

# CUSTOMER 4 FEATURES
print("\n[Phase 5] 客户端 4大功能 API")
s, _ = api_get("/ai-chat/conversations", ct)
check("AI创作工厂 GET /ai-chat/conversations", 200 <= s < 300, f"s={s}")
s, _ = api_get("/recruitment/jobs", ct)
check("智能招聘   GET /recruitment/jobs", 200 <= s < 300, f"s={s}")
s, _ = api_get("/acquisition/tasks", ct)
check("智能获客   GET /acquisition/tasks", 200 <= s < 300, f"s={s}")
s, _ = api_get("/share/stats", ct)
check("推荐分享   GET /share/stats", 200 <= s < 300, f"s={s}")
s, _ = api_get("/materials/recent", ct)
check("素材库     GET /materials/recent", 200 <= s < 300, f"s={s}")
s, _ = api_get("/tickets", ct)
check("工单       GET /tickets", 200 <= s < 300, f"s={s}")

# FRONTEND PAGES
print("\n[Phase 6] 前端页面")
BASE = "http://localhost:3000"
pages = [
    ("Admin仪表盘", "/admin/dashboard"),
    ("Admin代理商", "/admin/agents"),
    ("Admin租户", "/admin/tenants"),
    ("Agent仪表盘", "/agent/dashboard"),
    ("Agent客户管理", "/agent/customers"),
    ("Client仪表盘", "/customer/dashboard"),
    ("AI创作工厂", "/customer/ai-factory"),
    ("智能招聘", "/customer/recruitment"),
    ("智能获客", "/customer/acquisition/board"),
    ("推荐分享", "/customer/share/board"),
    ("素材库", "/customer/materials"),
]

for name, path in pages:
    try:
        req = urllib.request.Request(f"{BASE}{path}")
        resp = urllib.request.urlopen(req)
        check(name, resp.status == 200, f"s={resp.status}")
    except Exception as e:
        check(name, False, str(e)[:80])

# SUMMARY
print("\n" + "=" * 60)
print(f"结果: PASS={passed}  FAIL={failed}")
print("=" * 60)
if failed > 0:
    sys.exit(1)
