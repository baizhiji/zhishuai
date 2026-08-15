#!/usr/bin/env python3
"""从本地文件读取 Tauri 签名私钥，设置 GitHub Secrets。

用法:
    python scripts/set-tauri-signing-secrets.py <PRIVATE_KEY_PATH> <PASSWORD>
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

import nacl.encoding
import nacl.public

OWNER = "baizhiji"
REPO = "zhishuai"


def put_secret(name, value, token):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "set-tauri-secrets",
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
            "User-Agent": "set-tauri-secrets",
        },
    )
    try:
        urllib.request.urlopen(req2)
        print(f"Secret {name} 已更新")
    except urllib.error.HTTPError as e:
        sys.exit(f"更新 Secret {name} 失败: {e.code} {e.read().decode()[:500]}")


def main():
    if len(sys.argv) != 3:
        sys.exit("用法: python scripts/set-tauri-signing-secrets.py <PRIVATE_KEY_PATH> <PASSWORD>")
    key_path, password = sys.argv[1], sys.argv[2]
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not token:
        sys.exit("缺少 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量")

    with open(key_path, "r", encoding="utf-8") as f:
        priv_key = f.read().strip()

    put_secret("TAURI_SIGNING_PRIVATE_KEY", priv_key, token)
    put_secret("TAURI_SIGNING_PRIVATE_KEY_PASSWORD", password, token)


if __name__ == "__main__":
    main()
