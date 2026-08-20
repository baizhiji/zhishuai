# -*- coding: utf-8 -*-
path = "C:/temp/zhishuai_ci_install/zhishuai-desktop.exe"

def find_unicode_strings(data, min_len=4):
    results = []
    i = 0
    while i < len(data) - 1:
        # UTF-16LE: each char is 2 bytes, ASCII range
        s = []
        j = i
        while j < len(data) - 1:
            c = data[j] | (data[j+1] << 8)
            if 0x20 <= c <= 0x7E or 0x4E00 <= c <= 0x9FFF:
                s.append(chr(c))
                j += 2
            else:
                break
        if len(s) >= min_len:
            results.append((i, ''.join(s)))
            i = j
        else:
            i += 1
    return results

def find_utf8_strings(data, min_len=4):
    import re
    # crude: find valid utf-8 byte sequences of printable chars or CJK
    pattern = re.compile(rb'[\x20-\x7E\xE0-\xEF]{4,}')
    results = []
    for m in pattern.finditer(data):
        try:
            s = m.group().decode('utf-8')
            results.append((m.start(), s))
        except:
            pass
    return results

data = open(path, "rb").read()
terms = ["智能剪辑", "小红书图文", "SMART_EDIT", "smartEdit", "XIAOHONGSHU", "AI创作工厂"]

for term in terms:
    encodings = ["utf-8", "utf-16le", "utf-16be"]
    found = []
    for enc in encodings:
        try:
            if term.encode(enc) in data:
                found.append(enc)
        except:
            pass
    print(f"{term}: {found}")

# Also extract all unicode strings and check
print("\nExtracting unicode strings...")
strings = find_unicode_strings(data, 8)
for offset, s in strings:
    if any(t in s for t in terms):
        print(f"@{offset}: {s[:100]}")
