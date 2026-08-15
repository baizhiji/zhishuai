#!/bin/bash
# 验证 /api/version/desktop/latest.json 更新清单完整性
echo "=== old version (2.0.0) ==="
curl -s -o /dev/null -w 'HTTP %{http_code}\n' 'https://baizhiji.net/api/version/desktop/latest.json?currentVersion=2.0.0'
echo "=== same version (3.0.0) ==="
curl -s -o /dev/null -w 'HTTP %{http_code}\n' 'https://baizhiji.net/api/version/desktop/latest.json?currentVersion=3.0.0'
echo "=== payload fields ==="
curl -s 'https://baizhiji.net/api/version/desktop/latest.json' | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('version:', d['version'])
p = d['platforms']['windows-x86_64']
print('url:', p['url'])
print('sig len:', len(p['signature']))
print('sha256 (from db):', p.get('sha256', 'n/a'))
"
echo "=== download URL reachable ==="
curl -s -o /dev/null -w 'HTTP %{http_code}\n' "$(curl -s 'https://baizhiji.net/api/version/desktop/latest.json' | python3 -c 'import sys,json; print(json.load(sys.stdin)["platforms"]["windows-x86_64"]["url"])')"
