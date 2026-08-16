#!/bin/bash
# 导出指定冲突文件的两个版本并显示 diff 行数
cd /var/www/zhishuai || exit 1
F="$1"
mkdir -p /tmp/conflict
git show "HEAD:$F" > /tmp/conflict/a.ts 2>/dev/null
git show "stash@{0}:$F" > /tmp/conflict/b.ts 2>/dev/null
echo "=== $F ==="
echo "HEAD lines: $(wc -l < /tmp/conflict/a.ts)"
echo "STASH lines: $(wc -l < /tmp/conflict/b.ts)"
# 去除行尾空白后对比
tr -d '\r' < /tmp/conflict/a.ts > /tmp/conflict/a.norm
tr -d '\r' < /tmp/conflict/b.ts > /tmp/conflict/b.norm
if cmp -s /tmp/conflict/a.norm /tmp/conflict/b.norm; then
  echo "NORMALIZED: SAME (仅行尾差异)"
else
  echo "NORMALIZED: DIFF"
  diff /tmp/conflict/a.norm /tmp/conflict/b.norm | grep -c '^[<>]'
fi
