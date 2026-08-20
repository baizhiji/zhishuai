# -*- coding: utf-8 -*-
import os
base = 'C:/Users/Administrator/zhishuai/desktop-ui/out/customer/ai-factory'
for f in os.listdir(base):
    path = os.path.join(base, f)
    if os.path.isfile(path):
        try:
            text = open(path, 'r', encoding='utf-8', errors='ignore').read()
            for t in ['智能剪辑', 'SMART_EDIT', '小红书图文', 'XIAOHONGSHU']:
                if t in text:
                    print(f'{f}: contains {t}')
            # check for unicode escapes
            if 'u667A' in text or 'u80FD' in text or 'u526A' in text or 'u8F91' in text:
                print(f'{f}: contains unicode escape for 智能剪辑')
            if 'u5C0F' in text and 'u7EA2' in text:
                print(f'{f}: contains unicode escape for 小红书')
        except Exception as e:
            print('error', f, e)
