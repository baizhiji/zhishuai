#!/usr/bin/env python3
"""通过 GitHub Git Data API 推送本地提交（绕过 github.com:443 被阻断的问题）。

用法:
    python scripts/push-via-api.py "commit message" file1 file2 ...

依赖 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量。
"""
import base64
import json
import os
import subprocess
import sys
import urllib.request

OWNER = "baizhiji"
REPO = "zhishuai"
BRANCH = "main"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"


def api(method, path, body=None):
    token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN")
    if not token:
        sys.exit("缺少 GITHUB_PERSONAL_ACCESS_TOKEN 环境变量")
    req = urllib.request.Request(
        f"{API}{path}",
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "push-via-api",
        },
    )
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"API {method} {path} 失败: {e.code} {e.read().decode()[:500]}")


def git(*args):
    out = subprocess.run(["git", *args], capture_output=True, text=True)
    if out.returncode != 0:
        sys.exit(f"git {' '.join(args)} 失败: {out.stderr.strip()}")
    return out.stdout.strip()


def main():
    if len(sys.argv) < 3:
        sys.exit("用法: python scripts/push-via-api.py \"message\" file...")
    message, files = sys.argv[1], sys.argv[2:]

    # 1. 获取远程 main 当前 commit
    ref = api("GET", f"/git/ref/heads/{BRANCH}")
    parent_sha = ref["object"]["sha"]
    parent_tree = api("GET", f"/git/commits/{parent_sha}")["tree"]["sha"]
    print(f"父提交: {parent_sha[:12]}")

    # 2. 为每个文件创建 blob
    blobs = []
    for path in files:
        with open(path, "rb") as f:
            content = f.read()
        blob = api("POST", "/git/blobs", {"content": base64.b64encode(content).decode(), "encoding": "base64"})
        blobs.append({"path": path.replace("\\", "/"), "mode": "100644", "type": "blob", "sha": blob["sha"]})
        print(f"blob {path}: {blob['sha'][:12]}")

    # 3. 基于父 tree 创建新 tree
    tree = api("POST", "/git/trees", {"base_tree": parent_tree, "tree": blobs})
    print(f"新 tree: {tree['sha'][:12]}")

    # 4. 创建 commit
    commit = api("POST", "/git/commits", {"message": message, "tree": tree["sha"], "parents": [parent_sha]})
    print(f"新 commit: {commit['sha'][:12]}")

    # 5. 更新 main 分支
    api("PATCH", f"/git/refs/heads/{BRANCH}", {"sha": commit["sha"], "force": False})
    print(f"已推送 {commit['sha']} -> {OWNER}/{REPO}:{BRANCH}")


if __name__ == "__main__":
    main()
