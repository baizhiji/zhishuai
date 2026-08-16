#!/bin/bash
# 解决全部冲突文件（HEAD 与 stash 内容实质相同，仅行尾差异，采用 HEAD 版本）
set -e
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
for f in "${FILES[@]}"; do
  git checkout --ours -- "$f"
  git add "$f"
  echo "resolved: $f"
done
git commit -m "resolve conflict: HEAD 与 stash 内容实质一致（仅行尾差异），采用 HEAD 版本" || echo "nothing to commit"
echo "=== status ==="
git status --short | head -10
echo "=== stash list ==="
git stash list
