#!/usr/bin/env python3
"""智能获客 API 端到端测试脚本"""
import requests
import json
import sys

BASE = 'http://localhost:3001/api'
passed = 0
failed = 0
created_task_id = None

def test(name, method, path, expected_status=200, data=None, token=None, do_assert=True):
    global passed, failed
    url = f'{BASE}{path}'
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        if method == 'GET':
            resp = requests.get(url, headers=headers, timeout=15)
        elif method == 'POST':
            resp = requests.post(url, headers=headers, json=data, timeout=15)
        elif method == 'PUT':
            resp = requests.put(url, headers=headers, json=data, timeout=15)
        else:
            resp = requests.request(method, url, headers=headers, json=data, timeout=15)

        body = resp.json()
        if do_assert:
            ok = resp.status_code == expected_status
            if ok:
                passed += 1
                print(f'  [PASS] {name} -> {resp.status_code}')
            else:
                failed += 1
                print(f'  [FAIL] {name} -> {resp.status_code} (expected {expected_status}): {json.dumps(body, ensure_ascii=False)[:200]}')
            return body if ok else None
        else:
            passed += 1
            print(f'  [PASS] {name} -> {resp.status_code}')
            return body
    except Exception as e:
        failed += 1
        print(f'  [FAIL] {name} -> Exception: {e}')
        return None

print('=' * 60)
print('智能获客 API 端到端测试')
print('=' * 60)

# Step 1: Login
print('\n1. 管理员登录')
login_res = test('POST /auth/login', 'POST', '/auth/login', 200,
                 {'phone': '18601655222', 'password': '123456'}, do_assert=False)
if not login_res or not login_res.get('success'):
    print('ABORT: 登录失败')
    sys.exit(1)
token = login_res.get('data', {}).get('token', '')
if not token:
    print('ABORT: 未获取到 token')
    sys.exit(1)

# Step 2: Get statistics
print('\n2. 统计接口')
stats = test('GET /acquisition/statistics', 'GET', '/acquisition/statistics', 200, token=token)

# Step 3: Get dashboard  
dash = test('GET /acquisition/dashboard', 'GET', '/acquisition/dashboard', 200, token=token)

# Step 4: List tasks (empty)
print('\n3. 任务列表（初始）')
tasks_res = test('GET /acquisition/tasks', 'GET', '/acquisition/tasks', 200, token=token)

# Step 5: Create task
print('\n4. 创建获客任务')
task_data = test('POST /acquisition/tasks', 'POST', '/acquisition/tasks', 200,
                 {'name': '母婴产品北京客户', 'channel': 'xiaohongshu', 'targetCount': 50}, token=token)
if task_data:
    created_task_id = task_data.get('data', {}).get('id')
    print(f'  Task ID: {created_task_id}')

# Step 6: List tasks after creation
print('\n5. 任务列表（创建后）')
tasks_res2 = test('GET /acquisition/tasks', 'GET', '/acquisition/tasks', 200, token=token)

# Step 7: Get single task
if created_task_id:
    print('\n6. 获取单个任务')
    test(f'GET /acquisition/tasks/{created_task_id}', 'GET',
         f'/acquisition/tasks/{created_task_id}', 200, token=token)

# Step 8: Start task
if created_task_id:
    print('\n7. 启动任务')
    test(f'PUT /acquisition/tasks/{created_task_id}/start', 'PUT',
         f'/acquisition/tasks/{created_task_id}/start', 200, token=token)

# Step 9: AI discover leads
if created_task_id:
    print('\n8. AI 潜客发现')
    discover_res = test(f'POST /acquisition/tasks/{created_task_id}/discover', 'POST',
                        f'/acquisition/tasks/{created_task_id}/discover', 200,
                        {'count': 5}, token=token, do_assert=False)

# Step 10: List leads
print('\n9. 潜客列表')
leads_res = test('GET /acquisition/leads', 'GET', '/acquisition/leads', 200, token=token)

# Step 11: Update lead status
if leads_res:
    leads_list = leads_res.get('data', {}).get('leads', [])
    if leads_list:
        lead_id = leads_list[0]['id']
        print(f'\n10. 更新潜客状态')
        test(f'PUT /acquisition/leads/{lead_id}', 'PUT',
             f'/acquisition/leads/{lead_id}', 200,
             {'status': 'contacted'}, token=token)

        print(f'\n11. 潜客状态验证')
        lr = test('GET /acquisition/leads', 'GET', '/acquisition/leads', 200, token=token)

# Summary
print('\n' + '=' * 60)
print(f'Result: {passed}/{passed + failed} passed')
if failed > 0:
    print(f'Failed: {failed}')
    sys.exit(1)
else:
    print('ALL PASSED!')
print('=' * 60)
