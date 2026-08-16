# -*- coding: utf-8 -*-
"""检查桌面自动更新清单：URL、签名、文件是否匹配。"""
import json
import os
import urllib.request

URL = 'https://baizhiji.net/api/version/desktop/latest.json'
DOWNLOADS = '/var/www/zhishuai/downloads'


def main() -> int:
    with urllib.request.urlopen(URL, timeout=15) as r:
        d = json.loads(r.read().decode('utf-8'))
    print('version :', d.get('version'))
    print('pub_date:', d.get('pub_date'))
    platforms = d.get('platforms') or {}
    for key, info in platforms.items():
        print(f'platform[{key}]')
        print('  signature_head:', (info.get('signature') or '')[:80])
        print('  url          :', info.get('url'))
        sig_file = info.get('url', '').split('/')[-1].replace('.exe', '.exe.sig')
        exe_path = os.path.join(DOWNLOADS, os.path.basename(info.get('url', '')))
        sig_path = os.path.join(DOWNLOADS, sig_file)
        print('  exe_exists   :', os.path.exists(exe_path), os.path.basename(info.get('url', '')))
        print('  sig_exists   :', os.path.exists(sig_path), sig_file)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
