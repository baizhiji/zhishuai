#!/usr/bin/env python3
"""将本地 commit 的变更以新 commit 形式推送到远程 main（解决 github.com:443 被阻断 + 历史分叉）。

用法:
    python scripts/push-commit-via-api.py [commit_sha]

默认使用 HEAD。流程：
1. 计算本地 commit 相对其第一父的变更（git diff --name-status）
2. 上传变更文件 blob
3. 基于远程 main tree 创建新 tree
4. 创建 commit（复用本地 commit 的 message/author/committer）
5. 更新 main 分支 ref

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
            "User-Agent": "push-commit-via-api",
        },
    )
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"API {method} {path} 失败: {e.code} {e.read().decode()[:500]}")


def git(*args, text=True):
    out = subprocess.run(["git", *args], capture_output=True, text=text, encoding="utf-8", errors="replace")
    if out.returncode != 0:
        sys.exit(f"git {' '.join(args)} 失败: {out.stderr.strip()}")
    return out.stdout


def main():
    sha = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
    parent = git("rev-parse", f"{sha}^").strip()
    sha_full = git("rev-parse", sha).strip()

    # 1. 变更文件列表（A=新增 M=修改 D=删除）
    diff = git("diff", "--name-status", parent, sha_full)
    changes = []
    for line in diff.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        changes.append((status, path))
    print(f"本地 commit {sha_full[:12]} 相对 parent {parent[:12]} 的变更: {len(changes)} 个文件")
    for status, path in changes:
        print(f"  {status} {path}")

    # 2. 上传变更文件 blob
    remote_ref = api("GET", f"/git/ref/heads/{BRANCH}")
    parent_remote = remote_ref["object"]["sha"]
    parent_tree = api("GET", f"/git/commits/{parent_remote}")["tree"]["sha"]
    print(f"远程 main: {parent_remote[:12]}")

    tree_items = []
    for status, path in changes:
        if status == "D":
            tree_items.append({"path": path.replace("\\", "/"), "mode": "100644", "type": "blob", "sha": None})
            continue
        with open(path, "rb") as f:
            content = f.read()
        blob = api("POST", "/git/blobs", {"content": base64.b64encode(content).decode(), "encoding": "base64"})
        tree_items.append({"path": path.replace("\\", "/"), "mode": "100644", "type": "blob", "sha": blob["sha"]})
        print(f"  blob {path}: {blob['sha'][:12]}")

    # 3. 基于远程 tree 创建新 tree
    tree = api("POST", "/git/trees", {"base_tree": parent_tree, "tree": tree_items})
    print(f"新 tree: {tree['sha'][:12]}")

    # 4. 创建 commit（复用本地 commit 元数据）
    msg = git("log", "-1", "--format=%B", sha_full).rstrip("\n")
    author = git("log", "-1", "--format=%an%x00%ae%x00%aI", sha_full).split("\x00")
    committer = git("log", "-1", "--format=%cn%x00%ce%x00%cI", sha_full).split("\x00")
    body = {
        "message": msg,
        "tree": tree["sha"],
        "parents": [parent_remote],
        "author": {"name": author[0], "email": author[1], "date": author[2]},
        "committer": {"name": committer[0], "email": committer[1], "date": committer[2]},
    }
    commit = api("POST", "/git/commits", body)
    print(f"新 commit: {commit['sha'][:12]}")

    # 5. 更新 ref（非 force）
    api("PATCH", f"/git/refs/heads/{BRANCH}", {"sha": commit["sha"], "force": False})
    print(f"已推送 {commit['sha']} -> {OWNER}/{REPO}:{BRANCH}")
    print("本地 SHA: %s (远程 SHA 因 parent 不同与本地不同，内容一致)" % sha_full[:12])


if __name__ == "__main__":
    main()
