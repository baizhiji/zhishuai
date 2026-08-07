#!/usr/bin/env python3
"""
智枢 Customer 终端全功能 API 端到端测试 v2
使用正确的路由路径
"""
import requests, json, time, sys

BASE = 'http://localhost:3001/api'
CUST = {'phone': '13800000001', 'password': '123456', 'loginType': 'user'}
pass_count = 0
fail_count = 0
errors = []

def T(name, method, path, expected=200, data=None, check=None):
    global pass_count, fail_count
    h = {'Authorization': f'Bearer {CUST_TOKEN}', 'Content-Type': 'application/json'}
    try:
        if method == 'GET':
            r = requests.get(f'{BASE}{path}', headers=h, timeout=20)
        elif method == 'POST':
            r = requests.post(f'{BASE}{path}', headers=h, json=data or {}, timeout=20)
        elif method == 'PUT':
            r = requests.put(f'{BASE}{path}', headers=h, json=data or {}, timeout=20)
        elif method == 'DELETE':
            r = requests.delete(f'{BASE}{path}', headers=h, timeout=20)
        else:
            r = requests.request(method, f'{BASE}{path}', headers=h, json=data or {}, timeout=20)

        body = r.json() if r.text and r.text.strip() else {}
        status_ok = r.status_code == expected
        if check:
            check_ok = check(r.status_code, body)
        else:
            check_ok = status_ok

        if check_ok:
            print(f'  [PASS] {name} ({r.status_code})')
            pass_count += 1
            return body
        else:
            detail = str(body)[:200] if isinstance(body, dict) else str(r.text)[:200]
            print(f'  [FAIL] {name} -> {r.status_code} (exp {expected}) {detail}')
            fail_count += 1
            errors.append(f'{name}: {r.status_code} {detail}')
            return None
    except Exception as e:
        print(f'  [FAIL] {name} -> ERROR: {e}')
        fail_count += 1
        errors.append(f'{name}: {e}')
        return None

# === Login ===
print('='*60)
print('Customer Full API Test v2')
print(f'{CUST["phone"]} | {time.strftime("%H:%M:%S")}')
print('='*60)

r = requests.post(f'{BASE}/auth/login', json=CUST, timeout=20)
rbody = r.json() if r.text and r.text.strip() else {}
CUST_TOKEN = rbody.get('data', {}).get('token', '') if isinstance(rbody, dict) else ''
print(f'Login: {"OK" if CUST_TOKEN else "FAIL"}')

# === Tests with confirmed working/corrected endpoints ===
print('\n--- 1. Account ---')
T('账户信息', 'GET', '/account/')
T('套餐列表', 'GET', '/account/packages')
T('使用统计', 'GET', '/account/usage-stats')
T('修改密码（旧密码错误）', 'PUT', '/account/password', 400, {'oldPassword': 'wrong', 'newPassword': '123456'})

print('\n--- 2. Statistics (Fixed) ---')
T('统计总览', 'GET', '/statistics/overview')
T('7天趋势', 'GET', '/statistics/trend?days=7')
T('统计看板', 'GET', '/statistics/dashboard')

print('\n--- 3. User Features (Fixed) ---')
T('功能列表', 'GET', '/features')
T('我的功能', 'GET', '/features/my-features')
T('可用功能', 'GET', '/features/available')

print('\n--- 4. Share / Referrals ---')
T('分享统计', 'GET', '/share/statistics')
T('分享看板', 'GET', '/share/dashboard')
T('分享码列表', 'GET', '/share/codes')
share_body = T('创建分享码', 'POST', '/share/codes', data={'name': 'API测试码', 'platforms': ['douyin']})
sid = None
if share_body:
    d = share_body.get('data', share_body) if isinstance(share_body, dict) else {}
    if isinstance(d, dict):
        sid = d.get('id', '')
if sid:
    T('分享码详情', 'GET', f'/share/codes/{sid}')
    T('更新分享码', 'PUT', f'/share/codes/{sid}', data={'name': '更新码'})
    T('分享记录', 'GET', '/share/records')
    T('删除分享码', 'DELETE', f'/share/codes/{sid}')

print('\n--- 5. Digital Human ---')
T('数字人列表', 'GET', '/digital-human/humans')

print('\n--- 6. Voice Clone (Fixed) ---')
T('声音克隆状态', 'GET', '/voice-clone/status')
T('声音列表', 'GET', '/voice-clone/voices')
T('视频列表', 'GET', '/voice-clone/videos')

print('\n--- 7. AI Chat ---')
T('AI模型列表', 'GET', '/ai-chat/models')
T('对话列表', 'GET', '/ai-chat/conversations')

print('\n--- 8. AI Enhanced ---')
T('AI增强工具列表', 'GET', '/ai-enhanced/tools')

print('\n--- 9. Materials ---')
T('素材列表', 'GET', '/materials')
T('最近素材', 'GET', '/materials/recent')

print('\n--- 10. Recruitment ---')
T('职位列表', 'GET', '/recruitment/posts')
T('候选人列表', 'GET', '/recruitment/candidates')

print('\n--- 11. Acquisition ---')
T('获客任务', 'GET', '/acquisition/tasks')
T('获客统计（已测试）', 'GET', '/acquisition/stats')

print('\n--- 12. Announcements ---')
T('公告列表', 'GET', '/announcements')
T('通知列表', 'GET', '/notifications')

print('\n--- 13. Tickets ---')
T('工单列表', 'GET', '/tickets')
T('获取我的工单', 'GET', '/tickets/my')

print('\n--- 14. Feedback ---')
T('反馈列表', 'GET', '/ai-feedback')
T('我的反馈', 'GET', '/ai-feedback/my')

print('\n--- 15. Scripts ---')
T('脚本模板列表', 'GET', '/scripts/scripts')
T('脚本列表', 'GET', '/scripts/list')

print('\n--- 16. Business Assistant ---')
T('业务场景列表', 'GET', '/business/scenarios')
T('业务助手列表', 'GET', '/business/list')

print('\n--- 17. Hot Topics ---')
T('热点话题', 'GET', '/hot-topics')

print('\n--- 18. Usage Stats ---')
T('使用统计（备用）', 'GET', '/account/usage-stats')

# === Summary ===
print('\n' + '='*60)
total = pass_count + fail_count
rate = 100*pass_count//total if total > 0 else 0
print(f'Results: {pass_count}/{total} passed ({rate}%)')
if fail_count > 0:
    print('Failures:')
    for e in errors:
        print(f'  X {e}')
else:
    print('ALL PASSED!')

# verify-login
print('\n--- Server Health ---')
r1 = requests.post(f'{BASE}/auth/login', json={'phone': '18601655222', 'password': '123456', 'loginType': 'admin'}, timeout=15)
r2 = requests.post(f'{BASE}/auth/login', json={'phone': '13900000099', 'password': '123456', 'loginType': 'agent'}, timeout=15)
r3 = requests.post(f'{BASE}/auth/login', json=CUST, timeout=15)
print(f'Admin: {r1.status_code} | Agent: {r2.status_code} | Customer: {r3.status_code}')

print('='*60)
sys.exit(0 if fail_count == 0 else 1)
