import requests
r = requests.post('http://localhost:3001/api/v1/auth/login', json={'phone':'18601655222','password':'123456'})
print('Status:', r.status_code)
print('Body:', r.text[:300])
