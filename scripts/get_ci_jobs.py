# -*- coding: utf-8 -*-
import os, json, urllib.request

token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
url = "https://api.github.com/repos/baizhiji/zhishuai/actions/runs/31957244596/jobs"
req = urllib.request.Request(url, headers={
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
for job in data.get("jobs", []):
    print(job["id"], job["name"], job["status"], job.get("conclusion"))
