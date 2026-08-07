import json, urllib.request
for path, payload in [("/api/auth/send-code", {"phone":"13800000001","type":"login"}), ("/api/auth/login", {"phone":"13800000001","password":"123456"})]:
    req = urllib.request.Request(
        f"http://localhost:3001{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type":"application/json"},
        method="POST"
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        print(path, "OK", resp.status, resp.read().decode()[:200])
    except urllib.error.HTTPError as e:
        print(path, "ERR", e.code, e.read().decode()[:200])
