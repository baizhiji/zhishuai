import json, urllib.request

BASE = "http://127.0.0.1:3001/api"

def post(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except Exception as e:
        return 0, {"error": str(e)}

print("=== Test Agent Login ===")
# Test with loginType=agent
for phone, pwd, lt in [
    ("13900000099", "123456", "agent"),
    ("18601655222", "123456", "agent"),
    ("13800000001", "123456", "agent"),
]:
    code, data = post("/auth/login", {"phone": phone, "password": pwd, "loginType": lt})
    succ = "OK" if data.get("success") else "FAIL"
    print(f"  {phone} / {lt}: [{code}] {succ} - {json.dumps(data, ensure_ascii=False)[:200]}")
