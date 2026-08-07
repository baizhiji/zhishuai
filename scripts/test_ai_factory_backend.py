import json, urllib.request

req = urllib.request.Request(
    "http://localhost:3001/api/auth/login",
    data=json.dumps({"phone": "18601655222", "password": "123456"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
resp = urllib.request.urlopen(req, timeout=30)
token = json.loads(resp.read().decode())["data"]["token"]
print("login ok")

req2 = urllib.request.Request(
    "http://localhost:3001/api/ai-factory/generate-text",
    data=json.dumps({
        "messages": [{"role": "user", "content": "为智枢AI写一句宣传语"}],
        "provider": "alibaba",
        "model": "qwen-plus"
    }).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="POST"
)
try:
    resp2 = urllib.request.urlopen(req2, timeout=90)
    print("ai-factory ok", resp2.status, resp2.read().decode()[:500])
except urllib.error.HTTPError as e:
    print("ai-factory err", e.code, e.read().decode()[:500])
