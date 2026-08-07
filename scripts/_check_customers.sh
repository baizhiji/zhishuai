#!/bin/bash
mysql -h 172.19.0.13 -u root -p'Zhisu@2024#Cloud' zhishuai -e "SELECT id, phone, name, role, status FROM user WHERE role='customer' LIMIT 5;"
