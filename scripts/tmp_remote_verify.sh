#!/bin/bash
# 拉取百炼完整模型清单并保存到本地
KEY=$(grep '^ALIYUN_DASHSCOPE_API_KEY=' /var/www/zhishuai/server/.env | cut -d'=' -f2- | tr -d '"')
curl -s --max-time 30 'https://dashscope.aliyuncs.com/compatible-mode/v1/models' -H "Authorization: Bearer $KEY" -o /tmp/bailian_full.json
echo "SIZE:$(wc -c < /tmp/bailian_full.json)"
# 输出所有模型 id
python3 -c "
import json
d = json.load(open('/tmp/bailian_full.json'))
ids = [m['id'] for m in d.get('data', [])]
for i in ids: print(i)
" 2>/dev/null || grep -o '"id":"[^"]*"' /tmp/bailian_full.json | cut -d'"' -f4
