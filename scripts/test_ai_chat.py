import json, urllib.request

# login
req = urllib.request.Request(
    "http://localhost:3001/api/auth/login",
    data=json.dumps({"phone": "18601655222", "password": "123456"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
resp = urllib.request.urlopen(req, timeout=30)
login_data = json.loads(resp.read().decode())
token = login_data["data"]["token"]
print("login ok, token prefix:", token[:20])

# ai chat
messages = [{"role": "user", "content": "你好，请用一句话介绍自己"}]
req2 = urllib.request.Request(
    "http://localhost:3001/api/ai-chat/chat",
    data=json.dumps({"messages": messages, "modelKey": "qwen-plus", "preferProvider": "aliyun"}).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="POST"
)
try:
    resp2 = urllib.request.urlopen(req2, timeout=90)
    print("ai-chat ok", resp2.status, resp2.read().decode()[:500])
except urllib.error.HTTPError as e:
    print("ai-chat err", e.code, e.read().decode()[:500])
