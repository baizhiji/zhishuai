# -*- coding: utf-8 -*-
import hashlib
paths = [
    'C:/temp/zhishuai_ci_install/zhishuai-desktop.exe',
    'D:/智枢AI/zhishuai-desktop.exe'
]
for p in paths:
    try:
        h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        print(p, h)
    except Exception as e:
        print(p, 'ERROR', e)
