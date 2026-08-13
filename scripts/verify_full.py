import urllib.request, json, sys
from typing import Optional, Tuple, Any

API = "http://localhost:3001/api"

def login(phone: str, password: str, login_type: str) -> Tuple[bool, str, str]:
    """Returns (success, token, user_id)"""
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

def api_get(path: str, token: str) -> Tuple[int, Any]:
    req = urllib.request.Request(f"{API}{path}", headers={"Authorization": f"Bearer {token}"})
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)

def api_post(path: str, token: str, body_data: dict) -> Tuple[int, Any]:
    data = json.dumps(body_data).encode()
    req = urllib.request.Request(f"{API}{path}", data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]
    except Exception as e:
        return -1, str(e)

passed = failed = 0

def check(name: str, ok: bool, detail: str = ""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  [PASS] {name}")
    else:
        failed += 1
        print(f"  [FAIL] {name} - {detail}")

# ============================================================
print("=" * 60)
print("智枢AI 全链路验证")
print("=" * 60)

# PHASE 1: 登录
print("\n[Phase 1] 三种角色登录")
admin_ok, admin_tok, admin_id = login("18601655222", "123456", "admin")
agent_ok, agent_tok, agent_id = login("13900000099", "123456", "agent")
cust_ok, cust_tok, cust_id = login("13800000001", "123456", "user")

check("Admin登录", admin_ok, f"token={'...' if admin_tok else 'NONE'}")
check("Agent登录", agent_ok, f"token={'...' if agent_tok else 'NONE'}")
check("Customer登录", cust_ok, f"token={'...' if cust_tok else 'NONE'}")

# PHASE 2: 用户信息
print("\n[Phase 2] 用户信息 API")
for name, tok in [("Admin", admin_tok), ("Agent", agent_tok), ("Customer", cust_tok)]:
    s, d = api_get("/auth/me", tok)
    check(f"{name} /auth/me", s == 200, f"status={s}")

# PHASE 3: Admin 核心 API
print("\n[Phase 3] Admin 核心功能")

# Admin dashboard
s, d = api_get("/admin/dashboard/", admin_tok)
check("Admin运营看板 GET /admin/dashboard/", s == 200, f"s={s}")

# Admin 代理商管理
s, d = api_get("/admin/agents", admin_tok)
check("Admin代理商列表 GET /admin/agents", s == 200, f"s={s}")

# Admin 客户管理
s, d = api_get("/admin/customers", admin_tok)
check("Admin客户列表 GET /admin/customers", 200 <= s < 300, f"s={s}")

# Admin features
s, d = api_get("/admin/features", admin_tok)
check("Admin功能开关 GET /admin/features", s == 200, f"s={s}")

# PHASE 4: Agent 核心 API
print("\n[Phase 4] Agent 核心功能")

s, d = api_get("/agent/statistics", agent_tok)
check("Agent统计 GET /agent/statistics", s == 200, f"s={s}")

s, d = api_get("/agent/customers", agent_tok)
check("Agent客户列表 GET /agent/customers", s == 200, f"s={s}")

# PHASE 5: Customer 4大功能 API
print("\n[Phase 5] 客户端 4大功能")

# 1. AI创作工厂 (ai-chat)
s, d = api_get("/ai-chat/chats", cust_tok)
check("AI创作工厂 GET /ai-chat/chats", 200 <= s < 300, f"s={s}")

# 2. 智能招聘 (recruitment)
s, d = api_get("/recruitment/list", cust_tok)
check("智能招聘 GET /recruitment/list", 200 <= s < 300, f"s={s}")

# 3. 智能获客 (acquisition)
s, d = api_get("/acquisition/tasks", cust_tok)
check("智能获客 GET /acquisition/tasks", 200 <= s < 300, f"s={s}")

# 4. 推荐分享 (share)
s, d = api_get("/share/stats", cust_tok)
check("推荐分享 GET /share/stats", 200 <= s < 300, f"s={s}")

# 素材库
s, d = api_get("/materials/list", cust_tok)
check("素材库 GET /materials/list", 200 <= s < 300, f"s={s}")

# 工单
s, d = api_get("/tickets", cust_tok)
check("工单 GET /tickets", 200 <= s < 300, f"s={s}")

# PHASE 6: 前端页面验证
print("\n[Phase 6] 前端页面")

BASE = "http://localhost:3000"
def page_ok(path: str) -> bool:
    try:
        req = urllib.request.Request(f"{BASE}{path}")
        resp = urllib.request.urlopen(req)
        return resp.status == 200
    except:
        return False

pages = [
    ("Admin仪表盘", "/admin/dashboard"),
    ("Admin代理商", "/admin/agents"),
    ("Admin租户", "/admin/tenants"),
    ("Admin公告", "/admin/announcement"),
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
    check(name, page_ok(path))

# SUMMARY
print("\n" + "=" * 60)
print(f"结果: PASS={passed}  FAIL={failed}")
if failed > 0:
    print("有失败项需要修复!")
    sys.exit(1)
else:
    print("全链路验证通过!")
print("=" * 60)
