#!/bin/bash
# 用官方 minisign 工具验证 tauri 签名真实性
set -e
cd /var/www/zhishuai/downloads
SIG=$(ls *3.0.0_x64-setup.exe.sig 2>/dev/null | head -1)
EXE=$(ls *3.0.0_x64-setup.exe 2>/dev/null | head -1)
PUB="RWTY6o/IRMgQs4L7v0phzOV1d2ozna6MmeURux3hKveXCQPMxxklt02K"
echo "SIG=$SIG"
echo "EXE=$EXE"
# 解码 tauri 的 base64 签名文件为原始 minisign 格式
python3 - "$SIG" <<'PYEOF'
import base64, sys
raw = open(sys.argv[1], "rb").read()
dec = base64.b64decode(raw).decode("utf8")
open("/tmp/exe.sig.decoded", "w").write(dec)
print("decoded -> /tmp/exe.sig.decoded")
print(dec)
PYEOF
# 用官方工具验证（-V 验证 -P 内联公钥 -s 签名 -m 消息）
MS=/home/ubuntu/.local/bin/minisign
echo "minisign binary: $MS"
"$MS" -V -P "$PUB" -s /tmp/exe.sig.decoded -m "$EXE"
echo "OFFICIAL_VERIFY_EXIT=$?"
