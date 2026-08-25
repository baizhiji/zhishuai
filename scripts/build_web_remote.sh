#!/bin/bash
cd /var/www/zhishuai/desktop-ui
export NEXT_PUBLIC_API_BASE_URL=https://baizhiji.net
npx next build 2>&1 | tee /var/www/zhishuai/build-desktop-ui-remote.log
