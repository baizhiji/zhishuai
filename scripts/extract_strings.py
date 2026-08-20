# -*- coding: utf-8 -*-
path = 'C:/Users/Administrator/zhishuai/desktop-ui/out/_next/static/chunks/app/customer/ai-factory/page-b8c3b7b630a31056.js'
data = open(path, 'rb').read()

# Extract UTF-8 strings (printable ascii + CJK)
import re

# ASCII printable
ascii_strings = re.findall(rb'[\x20-\x7e]{4,}', data)
print('ASCII strings containing relevant terms:')
for s in ascii_strings:
    try:
        text = s.decode('ascii')
        if any(t in text for t in ['XIAOHONGSHU', 'SMART', 'EDIT', 'xiaohongshu', 'smart', 'edit', 'AI_SKETCH', 'AI_COMIC']):
            print(text[:200])
    except:
        pass

# Try UTF-16LE strings
print('\nUTF-16LE strings:')
i = 0
while i < len(data) - 1:
    s = []
    j = i
    while j < len(data) - 1:
        c = data[j] | (data[j+1] << 8)
        if 0x20 <= c <= 0x7E or 0x4E00 <= c <= 0x9FFF:
            s.append(chr(c))
            j += 2
        else:
            break
    if len(s) >= 3:
        text = ''.join(s)
        if any(t in text for t in ['智能剪辑', '小红书', 'SMART_EDIT', 'XIAOHONGSHU']):
            print(text[:200])
        i = j
    else:
        i += 1

# Check for unicode escapes
print('\nUnicode escapes found:')
for m in re.finditer(rb'\\u[0-9a-fA-F]{4}', data):
    # collect consecutive
    start = m.start()
    seq = bytearray()
    j = start
    while j < len(data) - 5 and data[j:j+2] == b'\\u':
        seq.extend(data[j:j+6])
        j += 6
    if len(seq) >= 24:
        try:
            # decode \uXXXX escapes
            decoded = seq.decode('unicode_escape')
            if any(t in decoded for t in ['智能', '剪辑', '小红书']):
                print('found at', start, decoded[:100])
        except:
            pass
        i = j
    else:
        i = start + 1
