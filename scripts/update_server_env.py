import re

p = 'server/.env'
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()

aliyun_key = 'sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg'
tencent_key = 'sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h'
tencent_key_id = 'ak-20260511-a9a1ca7404955688482124b0af60cb24'

s = re.sub(r'ALIYUN_DASHSCOPE_API_KEY=.*', f'ALIYUN_DASHSCOPE_API_KEY="{aliyun_key}"', s)

if 'TENCENT_API_KEY=' not in s:
    s += f'\nTENCENT_API_KEY="{tencent_key}"\n'
else:
    s = re.sub(r'TENCENT_API_KEY=.*', f'TENCENT_API_KEY="{tencent_key}"', s)

if 'TENCENT_API_KEY_ID=' not in s:
    s += f'TENCENT_API_KEY_ID="{tencent_key_id}"\n'
else:
    s = re.sub(r'TENCENT_API_KEY_ID=.*', f'TENCENT_API_KEY_ID="{tencent_key_id}"', s)

# 兼容 ai-chat.ts 中使用的环境变量名
if 'DASHSCOPE_API_KEY=' not in s:
    s += f'\nDASHSCOPE_API_KEY="{aliyun_key}"\n'
else:
    s = re.sub(r'DASHSCOPE_API_KEY=.*', f'DASHSCOPE_API_KEY="{aliyun_key}"', s)

if 'TENCENT_TOKENHUB_API_KEY=' not in s:
    s += f'\nTENCENT_TOKENHUB_API_KEY="{tencent_key}"\n'
else:
    s = re.sub(r'TENCENT_TOKENHUB_API_KEY=.*', f'TENCENT_TOKENHUB_API_KEY="{tencent_key}"', s)

with open(p, 'w', encoding='utf-8') as f:
    f.write(s)

print('env updated with aliases')
