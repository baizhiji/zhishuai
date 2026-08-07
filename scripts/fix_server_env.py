import re

with open('server/.env', 'r', encoding='utf-8') as f:
    lines = f.readlines()

ai_keys = [
    'ALIYUN_DASHSCOPE_API_KEY',
    'TENCENT_API_KEY',
    'TENCENT_API_KEY_ID',
    'TENCENT_TOKENHUB_API_KEY',
    'DASHSCOPE_API_KEY',
]

aliyun_key = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg'
tencent_key = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h'
tencent_key_id = 'ak-20260511-a9a1ca7404955688482124b0af60cb24'

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    if any(stripped.startswith(k + '=') for k in ai_keys):
        # 跳过当前行及可能的续行
        while not stripped.endswith('"') and i + 1 < len(lines):
            i += 1
            stripped = lines[i].strip()
        i += 1
        continue
    new_lines.append(line)
    i += 1

content = ''.join(new_lines)

content = re.sub(
    r'(# 阿里云百炼 API Key（AI 模型服务）)\n',
    rf'\1\nALIYUN_DASHSCOPE_API_KEY="{aliyun_key}"\n',
    content,
)

content = re.sub(
    r'(# 火山引擎 API Key（备用 AI 模型服务）)',
    rf'TENCENT_API_KEY="{tencent_key}"\nTENCENT_API_KEY_ID="{tencent_key_id}"\nTENCENT_TOKENHUB_API_KEY="{tencent_key}"\nDASHSCOPE_API_KEY="{aliyun_key}"\n\n\1',
    content,
)

with open('server/.env', 'w', encoding='utf-8') as f:
    f.write(content)

print('env fixed')
