import urllib.request, json

# Test customer login
data = json.dumps({"phone":"13800000001","password":"123456"}).encode()
req = urllib.request.Request("http://localhost:3001/api/auth/login", data=data, headers={"Content-Type":"application/json"})
try:
    resp = urllib.request.urlopen(req)
    print("OK:", resp.read().decode()[:300])
except urllib.error.HTTPError as e:
    print("Error:", e.code)
    print("Body:", e.read().decode()[:500])

# Also check admin switching to agent
print("\n--- Admin switching to agent ---")
data2 = json.dumps({"phone":"18601655222","password":"123456","targetRole":"agent"}).encode()
req2 = urllib.request.Request("http://localhost:3001/api/auth/login", data=data2, headers={"Content-Type":"application/json"})
try:
    resp2 = urllib.request.urlopen(req2)
    print("OK:", resp2.read().decode()[:300])
except urllib.error.HTTPError as e:
    print("Error:", e.code)
    print("Body:", e.read().decode()[:500])
