#!/bin/bash
TKEY="sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
curl -s -H "Authorization: Bearer ${TKEY}" https://tokenhub.tencentmaas.com/v1/models | python3 -c "
import sys, json
d = json.load(sys.stdin)
for m in d.get('data', []):
    mid = m.get('id', '')
    obj = m.get('object', '')
    owner = m.get('owned_by', '')
    if any(k in mid.lower() for k in ['human', 'video', 'actor', 'yt', 'kling', 'kl']):
        print(mid, obj, owner)
"
