#!/bin/bash
cd /var/www/zhishuai/desktop-ui
npx next build 2>&1 | tee /var/www/zhishuai/build-desktop-ui-remote.log
