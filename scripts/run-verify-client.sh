#!/bin/bash
# 服务器端运行 verify-client 验证 tauri 签名（避免中文文件名 ssh 转码问题）
set -e
cd /var/www/zhishuai/downloads
EXE=$(ls *.exe | head -1)
echo "EXE=$EXE"
SIG=$(ls *.sig | head -1)
echo "SIG=$SIG"
source ~/.cargo/env
/home/ubuntu/verify-client-rs/target/release/verify-client "$EXE" "$SIG"
echo "VERIFY_EXIT=$?"
