import requests, json
r = requests.post('http://localhost:3001/api/auth/login', 
                   json={'phone': '13800000001', 'password': '123456'})
print('Status:', r.status_code)
print('Body:', r.text[:500])
