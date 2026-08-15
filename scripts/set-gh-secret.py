#!/usr/bin/env python3
"""通用 GitHub Actions Secret 设置工具（libsodium sealed-box 加密）。

用法:
    python scripts/set-gh-secret.py <SECRET_NAME> <SECRET_VALUE>

依赖 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量 + pynacl。
"""
import json
import os
import sys
import base64
import urllib.request
import urllib.error

import nacl.public
import nacl.encoding

OWNER = "baizhiji"
REPO = "zhishuai"


def main():
    if len(sys.argv) != 3:
        sys.exit("用法: python scripts/set-gh-secret.py <SECRET_NAME> <SECRET_VALUE>")
    name = sys.argv[1]
    value = sys.argv[2].strip()
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not token:
        sys.exit("缺少 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量")

    req = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "set-gh-secret",
        },
    )
    pub = json.loads(urllib.request.urlopen(req).read())
    key_id, pub_key = pub["key_id"], pub["key"]

    pk = nacl.public.PublicKey(pub_key, encoder=nacl.encoding.Base64Encoder)
    sealed = nacl.public.SealedBox(pk).encrypt(value.encode())
    body = json.dumps(
        {"encrypted_value": base64.b64encode(sealed).decode(), "key_id": key_id}
    ).encode()
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{name}",
        data=body,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "set-gh-secret",
        },
    )
    try:
        urllib.request.urlopen(req2)
        print(f"Secret {name} 已更新")
    except urllib.error.HTTPError as e:
        sys.exit(f"更新 Secret 失败: {e.code} {e.read().decode()[:500]}")


if __name__ == "__main__":
    main()
