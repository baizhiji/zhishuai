#!/bin/bash
# 禁用外键检查后删除
mysql -h 172.19.0.13 -u root -p'Hao-20061218' --default-character-set=utf8mb4 zhishuai --execute="
SET FOREIGN_KEY_CHECKS=0;
DELETE FROM User WHERE phone != '18601655222';
SET FOREIGN_KEY_CHECKS=1;
SELECT 'After cleanup:' as msg;
SELECT phone, name, role, status FROM User;
" 2>/dev/null
