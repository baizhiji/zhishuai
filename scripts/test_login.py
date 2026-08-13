import urllib.request, json

data = json.dumps({"phone":"18601655222","password":"123456"}).encode()
req = urllib.request.Request("http://localhost:3001/api/auth/login", data=data, headers={"Content-Type":"application/json"})
try:
    resp = urllib.request.urlopen(req)
    print("Status:", resp.status)
    print("Body:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("Status:", e.code)
    print("Body:", e.read().decode())
except Exception as e:
    print("Error:", e)
