#!/bin/bash
cd /var/www/zhishuai/web
npx next build 2>&1 | tee /var/www/zhishuai/build-web-remote.log
