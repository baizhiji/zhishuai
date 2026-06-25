#!/usr/bin/env python3
"""检查 API 可达性"""
import urllib.request
import ssl

# 忽略 SSL 证书验证
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    url = "https://api.baizhiji.net/api/health"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
        print(f"API 状态: {resp.status}")
        print(f"响应: {resp.read().decode('utf-8')[:500]}")
except Exception as e:
    print(f"API 不可达: {e}")
