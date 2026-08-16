#!/bin/bash
# 对比冲突文件 HEAD vs stash@{0} 版本是否一致
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
  if cmp -s /tmp/conflict/a.ts /tmp/conflict/b.ts; then
    echo "SAME  $f"
  else
    echo "DIFF  $f"
  fi
done
