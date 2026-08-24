"""内容中心 API 交叉验证：列表 / 状态筛选 / downloadedAt 标记与回查"""
import json
import urllib.request
import urllib.error
from datetime import datetime

BASE = 'http://127.0.0.1:3001'


def req(method, path, token=None, body=None):
    r = urllib.request.Request(BASE + path, method=method)
    r.add_header('Content-Type', 'application/json')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    if body is not None:
        r.data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        return e.code, None


def main():
    # 1. 管理员登录
    st, data = req('POST', '/api/auth/login',
                   body={'phone': '18601655222', 'password': '20061218', 'loginType': 'admin'})
    assert st == 200, f'管理员登录失败: {st}'
    token = data['data']['token'] if isinstance(data.get('data'), dict) and 'token' in data['data'] else data['token']
    print(f'[1] 管理员登录 OK (token 长度 {len(token)})')

    # 2. 素材列表
    st, data = req('GET', '/api/materials?page=1&pageSize=5', token)
    assert st == 200, f'列表接口失败: {st}'
    payload = data.get('data', {}) if isinstance(data.get('data'), dict) else {}
    print(f"[2] 素材列表 OK total={payload.get('total')}")

    # 3. 状态筛选（下载状态）
    for s in ['downloaded', 'undownloaded']:
        st, data = req('GET', f'/api/materials?status={s}&page=1&pageSize=3', token)
        total = 'N/A'
        if st == 200 and isinstance(data.get('data'), dict):
            total = data['data'].get('total')
        print(f"[3] status={s} -> HTTP {st}, total={total}")
        assert st == 200, f'状态筛选 status={s} 失败: {st}'

    # 4. 下载标记与回查
    first_id = None
    if payload.get('list'):
        first_id = payload['list'][0]['id']
        print(f"[4] 取首个素材 id={first_id}, 原 downloadedAt={payload['list'][0].get('downloadedAt')}")
    else:
        print('[4] 当前无素材，创建测试素材')
        st, data = req('POST', '/api/materials', token,
                       {'title': '[verify] 测试素材', 'type': 'copywriting', 'content': '测试内容'})
        assert st == 200, f'创建素材失败: {st}'
        first_id = data['data']['id']
        print(f"    创建成功 id={first_id}")

    now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
    st, _ = req('PUT', f'/api/materials/{first_id}', token, {'downloadedAt': now})
    assert st == 200, f'PUT downloadedAt 失败: {st}'
    print(f'[5] PUT downloadedAt -> HTTP {st}')

    st, data = req('GET', '/api/materials?status=downloaded&page=1&pageSize=20', token)
    hit = None
    if st == 200 and isinstance(data.get('data'), dict):
        hit = next((x for x in data['data'].get('list', []) if x['id'] == first_id), None)
    print(f"[6] downloaded 筛选回查: {hit.get('downloadedAt') if hit else 'NOT FOUND'}")
    assert hit and hit.get('downloadedAt'), 'downloadedAt 未写入'

    st, data = req('GET', '/api/materials?status=undownloaded&page=1&pageSize=20', token)
    miss = True
    if st == 200 and isinstance(data.get('data'), dict):
        miss = not any(x['id'] == first_id for x in data['data'].get('list', []))
    print(f'[7] undownloaded 筛选排除: {"已排除" if miss else "未排除(异常)"}')
    assert miss, '已下载素材不应出现在 undownloaded 筛选'

    # 清理测试数据
    st, _ = req('DELETE', f'/api/materials/{first_id}', token)
    print(f'[8] 清理测试素材 -> HTTP {st}')

    print('ALL MATERIALS API CHECKS PASSED')


if __name__ == '__main__':
    main()
