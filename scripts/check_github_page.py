# -*- coding: utf-8 -*-
import os, json, urllib.request

token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
url = "https://api.github.com/repos/baizhiji/zhishuai/contents/desktop-ui/app/customer/ai-factory/page.tsx?ref=main"
req = urllib.request.Request(url, headers={
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github.v3.raw"
})
with urllib.request.urlopen(req) as resp:
    content = resp.read().decode('utf-8')

terms = ['SMART_EDIT', '智能剪辑', 'XIAOHONGSHU', '小红书图文', 'AI_SKETCH']
for t in terms:
    print(f'{t}: {t in content}')
print('length:', len(content))
print('first 500 chars:', content[:500])
