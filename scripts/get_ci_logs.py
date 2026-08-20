# -*- coding: utf-8 -*-
import os, json, urllib.request, zipfile

token = os.environ.get("GITHUB_PERSONAL_ACCESS_TOKEN", "")
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
}

# Get run logs URL
run_url = "https://api.github.com/repos/baizhiji/zhishuai/actions/runs/31957244596"
req = urllib.request.Request(run_url, headers=headers)
with urllib.request.urlopen(req) as resp:
    run_data = json.loads(resp.read())
print("Run status:", run_data.get("status"), run_data.get("conclusion"))

logs_url = run_data.get("logs_url")
print("Logs URL:", logs_url)

# Download logs
req2 = urllib.request.Request(logs_url, headers=headers)
with urllib.request.urlopen(req2) as resp:
    with open("C:/Users/Administrator/Downloads/ci_logs.zip", "wb") as f:
        f.write(resp.read())
print("Downloaded logs")

# Extract and show relevant files
with zipfile.ZipFile("C:/Users/Administrator/Downloads/ci_logs.zip", 'r') as z:
    for name in z.namelist():
        print(name)
        if "desktop" in name.lower() or "build" in name.lower():
            print("===", name, "===")
            try:
                content = z.read(name).decode('utf-8', errors='ignore')
                # Show lines mentioning desktop-ui build
                for line in content.split('\n'):
                    if any(k in line.lower() for k in ['desktop-ui', 'build', 'copy', 'smart', 'error', 'warning', 'out']):
                        print(line[:200])
            except Exception as e:
                print("error reading", e)
