import urllib.request, json

print('health:', urllib.request.urlopen('https://zhishuai.ai/api/v1/health', timeout=10).status)
req = urllib.request.Request(
    'https://zhishuai.ai/api/auth/login',
    data=json.dumps({'phone': '18601655222', 'password': '123456'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    resp = urllib.request.urlopen(req, timeout=10)
    print('login:', resp.status)
except urllib.error.HTTPError as e:
    print('login:', e.code)
