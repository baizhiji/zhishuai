# -*- coding: utf-8 -*-
path = "C:/temp/zhishuai_ci_install/zhishuai-desktop.exe"
data = open(path, "rb").read()

terms = [
    ("智能剪辑", "utf-8"),
    ("智能剪辑", "utf-16le"),
    ("小红书图文", "utf-8"),
    ("小红书图文", "utf-16le"),
    ("smartEdit", "ascii"),
    ("SMART_EDIT", "ascii"),
    ("XIAOHONGSHU", "ascii"),
    ("AI_SKETCH", "ascii"),
    ("AI_COMIC", "ascii"),
]

for term, enc in terms:
    try:
        found = term.encode(enc) in data
        print(f"{term} ({enc}): {found}")
    except Exception as e:
        print(f"{term} ({enc}): error {e}")
