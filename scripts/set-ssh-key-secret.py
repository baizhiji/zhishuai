#!/usr/bin/env python3
"""通过 SSH 从服务器获取 CI 私钥并更新 GitHub Secret SERVER_SSH_KEY。

用法:
    python scripts/set-ssh-key-secret.py

依赖 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量 + 本地可免密 ssh ubuntu@<SERVER_IP>。
"""
import json
import os
import subprocess
import sys
import base64
import urllib.request
import urllib.error

import nacl.public
import nacl.encoding

OWNER = "baizhiji"
REPO = "zhishuai"
SERVER_IP = "150.109.60.130"
SERVER_USER = "ubuntu"
SECRET_NAME = "SERVER_SSH_KEY"


def main():
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not token:
        sys.exit("缺少 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量")

    # 1. 通过 ssh 直接获取服务器上的私钥（不经 shell 文本处理，避免转义问题）
    out = subprocess.run(
        ["ssh", f"{SERVER_USER}@{SERVER_IP}", "cat /home/ubuntu/.ssh/zhishuai_ci"],
        capture_output=True,
        text=True,
    )
    if out.returncode != 0:
        sys.exit(f"ssh 获取私钥失败: {out.stderr.strip()}")
    key = out.stdout.replace("\r\n", "\n").replace("\r", "\n").strip() + "\n"
    print(f"私钥长度: {len(key)}")
    print(f"私钥首行: {key.splitlines()[0]}")

    # 2. 获取 GitHub 仓库公钥（用于 sealed-box 加密）
    req = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "set-ssh-key-secret",
        },
    )
    pub = json.loads(urllib.request.urlopen(req).read())
    key_id, pub_key = pub["key_id"], pub["key"]

    # 3. 加密并更新 Secret
    pk = nacl.public.PublicKey(pub_key, encoder=nacl.encoding.Base64Encoder)
    sealed = nacl.public.SealedBox(pk).encrypt(key.encode())
    body = json.dumps(
        {
            "encrypted_value": base64.b64encode(sealed).decode(),
            "key_id": key_id,
        }
    ).encode()
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{SECRET_NAME}",
        data=body,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "set-ssh-key-secret",
        },
    )
    try:
        urllib.request.urlopen(req2)
        print(f"Secret {SECRET_NAME} 已更新")
    except urllib.error.HTTPError as e:
        sys.exit(f"更新 Secret 失败: {e.code} {e.read().decode()[:500]}")


if __name__ == "__main__":
    main()
