import requests
r = requests.post('http://localhost:3001/api/auth/login', json={'phone':'18601655222','password':'123456'})
body = r.json()
print('Status:', r.status_code)
print('Keys:', list(body.keys()))
print('Code:', body.get('code'))
print('Data keys:', list(body.get('data', {}).keys()) if body.get('data') else 'NO DATA')
print('Token present:', 'token' in body.get('data', {}))
print('Full:', str(body)[:500])
