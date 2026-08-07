#!/usr/bin/env python3
"""Test all share/acquisition/recruitment API endpoints."""
import json, urllib.request, ssl

BASE = "http://localhost:3001/api"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def api(method, path, data=None, token=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=10)
        return json.loads(resp.read().decode())
    except urllib.request.HTTPError as e:
        try:
            body = e.read().decode()
            return json.loads(body)
        except:
            return {"error": "HTTP " + str(e.code), "body": body}
    except Exception as e:
        return {"error": str(e)}

# Login
print("=== Login ===")
login = api("POST", "/auth/login", {"phone": "18601655222", "password": "123456", "loginType": "admin"})
print(json.dumps(login, indent=2, ensure_ascii=False)[:300])

token = ""
data = login.get("data")
if data and isinstance(data, dict):
    token = data.get("token", "")
    print(f"Token OK: {token[:20]}...")
else:
    print("Login failed! Check response above.")

def test(path, method="GET", data=None, desc=""):
    r = api(method, path, data, token)
    s = r.get("success", False)
    status = "PASS" if s else "FAIL"
    detail = ""
    dd = r.get("data")
    if isinstance(dd, dict):
        if "list" in dd:
            detail = f"list_len={len(dd['list'])}"
        else:
            detail = f"keys={list(dd.keys())[:4]}"
    elif isinstance(dd, list):
        detail = f"array_len={len(dd)}"
    err = r.get("error", "")
    if not s and not detail:
        detail = f"err={err[:80]}"
    print(f"  [{status}] {method} {path} - {detail}")

print("\n=== 推荐分享 (Share) ===")
test("/share/codes")
test("/share/records")
test("/share/statistics")
test("/share/my-code")
test("/share/codes", "POST", {"title": "Test", "description": "Desc", "type": "douyin"})

print("\n=== 智能获客 (Acquisition) ===")
test("/acquisition/dashboard", data={"period": "week"})
test("/acquisition/tasks")
test("/acquisition/leads")
test("/acquisition/stats")

# Debug: show full response for failing endpoints
print("\n=== Debug: Acquisition failures ===")
for path in ["/acquisition/tasks", "/acquisition/leads", "/acquisition/stats"]:
    r = api("GET", path, None, token)
    print(f"  {path}: {json.dumps(r, ensure_ascii=False)[:150]}")

print("\n=== 智能招聘 (Recruitment) ===")
test("/recruitment/posts")
test("/recruitment/stats")
test("/recruitment/candidates")

# Debug: show full response for failing endpoints
print("\n=== Debug: Recruitment failures ===")
for path in ["/recruitment/posts", "/recruitment/stats", "/recruitment/candidates"]:
    r = api("GET", path, None, token)
    print(f"  {path}: {json.dumps(r, ensure_ascii=False)[:200]}")

print("\nDone!")
