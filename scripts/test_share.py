#!/usr/bin/env python3
"""智能推荐分享 API 测试"""
import requests, json, sys

BASE = 'http://localhost:3001/api'
passed = 0
failed = 0

def t(name, ok):
    global passed, failed
    if ok:
        passed += 1
        print(f'  [PASS] {name}')
    else:
        failed += 1
        print(f'  [FAIL] {name}')

# Login
r = requests.post(f'{BASE}/auth/login', json={'phone': '18601655222', 'password': '123456'})
b = r.json()
t('管理员登录', b.get('success') and b['data'].get('token'))
token = b['data']['token']
h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# 1. my-code
r = requests.get(f'{BASE}/share/my-code', headers=h)
b = r.json()
t('获取我的推荐码', b.get('code') == 200 and 'code' in b.get('data', {}))

# 2. statistics
r = requests.get(f'{BASE}/share/statistics', headers=h)
b = r.json()
t('获取统计概览', b.get('code') == 200 and 'totalScans' in b.get('data', {}))

# 3. codes list
r = requests.get(f'{BASE}/share/codes', headers=h)
b = r.json()
t('获取分享码列表', b.get('code') == 200 and 'list' in b.get('data', {}))
init_total = b['data']['total']

# 4. create code
r = requests.post(f'{BASE}/share/codes', headers=h, json={
    'title': '测试分享',
    'videoUrl': 'https://example.com/video',
    'platforms': ['douyin', 'xiaohongshu'],
})
b = r.json()
t('创建分享码', b.get('code') == 200 and 'id' in b.get('data', {}) and 'scanUrl' in b.get('data', {}))
code_id = b['data']['id']

# 5. get code detail
r = requests.get(f'{BASE}/share/codes/{code_id}', headers=h)
b = r.json()
t('获取分享码详情', b.get('code') == 200 and b['data'].get('id') == code_id)

# 6. list increased
r = requests.get(f'{BASE}/share/codes', headers=h)
b = r.json()
t('列表计数增加', b.get('code') == 200 and b['data']['total'] > init_total)

# 7. stats
r = requests.get(f'{BASE}/share/stats', headers=h)
b = r.json()
t('获取详细统计', b.get('code') == 200 and 'totalCodes' in b.get('data', {}))

# 8. dashboard
r = requests.get(f'{BASE}/share/dashboard?period=week', headers=h)
b = r.json()
t('获取看板数据', b.get('code') == 200 and 'totalLinks' in b.get('data', {}))

# 9. update code
r = requests.put(f'{BASE}/share/codes/{code_id}', headers=h, json={
    'title': '更新后的测试分享',
    'videoUrl': 'https://example.com/v2',
    'platforms': ['douyin', 'kuaishou', 'xiaohongshu'],
})
b = r.json()
t('更新分享码', b.get('code') == 200 and b['data'].get('title') == '更新后的测试分享')

# 10. scan (self-scan returns ok with selfScan)
r = requests.post(f'{BASE}/share/scan/{code_id}', headers=h, json={'platform': 'douyin'})
b = r.json()
t('扫码接口可用', b.get('code') == 200)

# 11. share records
r = requests.get(f'{BASE}/share/records', headers=h)
b = r.json()
t('获取分享记录', b.get('code') == 200 and 'list' in b.get('data', {}))

# 12. effects sync
r = requests.post(f'{BASE}/share/effects/sync', headers=h, json={
    'qrCodeId': code_id,
    'platform': 'douyin',
    'data': {'viewCount': 500, 'likeCount': 100},
})
b = r.json()
t('同步效果数据', b.get('code') == 200)

# 13. effects query
r = requests.get(f'{BASE}/share/effects/{code_id}', headers=h)
b = r.json()
t('查询效果追踪', b.get('code') == 200 and 'byPlatform' in b.get('data', {}))

# 14. commission
r = requests.get(f'{BASE}/share/commission', headers=h)
b = r.json()
t('获取佣金明细', b.get('code') == 200 and 'list' in b.get('data', {}))

# 15. referral chain
r = requests.get(f'{BASE}/share/chain/{code_id}', headers=h)
b = r.json()
t('获取推荐链', b.get('code') == 200 and 'tree' in b.get('data', {}))

# 16. delete code
r = requests.delete(f'{BASE}/share/codes/{code_id}', headers=h)
b = r.json()
t('删除分享码', b.get('code') == 200)

# 17. verify deleted
r = requests.get(f'{BASE}/share/codes/{code_id}', headers=h)
b = r.json()
t('验证已删除', b.get('code') == 404)

print(f'\n{"="*50}')
print(f'Total: {passed}/{passed+failed} PASSED')
sys.exit(0 if failed == 0 else 1)
