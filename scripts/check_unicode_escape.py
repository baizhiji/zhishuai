# -*- coding: utf-8 -*-
path = "C:/temp/zhishuai_ci_install/zhishuai-desktop.exe"
data = open(path, "rb").read()

terms = {
    "智能剪辑": [b'\\u667A\\u80FD\\u526A\\u8F91'],
    "小红书图文": [b'\\u5C0F\\u7EA2\\u4E66\\u56FE\\u6587'],
    "SMART_EDIT": [b'SMART_EDIT'],
    "XIAOHONGSHU": [b'XIAOHONGSHU'],
    "ai-factory": [b'ai-factory'],
}

for name, patterns in terms.items():
    found = [p in data for p in patterns]
    print(f"{name}: {found}")
