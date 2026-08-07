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
    "http://localhost:3001/api/ai/generate-script",
    data=json.dumps({
        "scene": "short_video",
        "sceneName": "产品介绍",
        "scenePrompt": "为一款AI SaaS产品写一段15秒短视频口播",
        "style": "professional",
        "context": "智枢AI"
    }).encode(),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
    method="POST"
)
try:
    resp2 = urllib.request.urlopen(req2, timeout=90)
    print("generate-script ok", resp2.status, resp2.read().decode()[:500])
except urllib.error.HTTPError as e:
    print("generate-script err", e.code, e.read().decode()[:500])
