# -*- coding: utf-8 -*-
import os
import time
import json
import urllib.request

run_id = "31957244596"
token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
url = f"https://api.github.com/repos/baizhiji/zhishuai/actions/runs/{run_id}"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

for _ in range(60):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    status = data.get("status")
    conclusion = data.get("conclusion")
    print(f"{time.strftime('%H:%M:%S')} run {run_id}: status={status} conclusion={conclusion}")
    if status in ("completed", "failure", "cancelled"):
        print("URL:", data.get("html_url"))
        print("DONE")
        break
    time.sleep(30)
