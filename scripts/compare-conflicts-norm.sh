#!/bin/bash
# 行尾归一化后对比所有冲突文件 HEAD vs stash@{0}
cd /var/www/zhishuai || exit 1
FILES=(
  "server/src/routes/comment-delivery.ts"
  "server/src/routes/playwright-bridge.ts"
  "server/src/services/comment-delivery.service.ts"
  "server/src/services/comment-safety.service.ts"
  "server/src/services/playwright.service.ts"
  "web/app/customer/acquisition/accounts/page.tsx"
  "web/app/customer/acquisition/comment/page.tsx"
)
mkdir -p /tmp/conflict
for f in "${FILES[@]}"; do
  git show "HEAD:$f" > /tmp/conflict/a.ts 2>/dev/null
  git show "stash@{0}:$f" > /tmp/conflict/b.ts 2>/dev/null
  tr -d '\r' < /tmp/conflict/a.ts > /tmp/conflict/a.norm
  tr -d '\r' < /tmp/conflict/b.ts > /tmp/conflict/b.norm
  if cmp -s /tmp/conflict/a.norm /tmp/conflict/b.norm; then
    echo "SAME(行尾差异)  $f"
  else
    echo "REAL-DIFF       $f  (head=$(wc -l < /tmp/conflict/a.norm) stash=$(wc -l < /tmp/conflict/b.norm))"
  fi
done
