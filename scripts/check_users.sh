#!/bin/bash
DB_PASS=$(grep DATABASE_URL /var/www/zhishuai/server/.env | sed 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/')
echo "=== Users ==="
mysql -h 172.19.0.13 -u root -p"$DB_PASS" -e "SELECT id, phone, name, role, status FROM zhishuai.User LIMIT 10;" 2>/dev/null
