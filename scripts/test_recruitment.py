#!/usr/bin/env python3
"""智能招聘 API 全流程测试"""

import json
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:3001/api"

def api(method, path, token=None, body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        try:
            return json.loads(err), e.code
        except:
            return {"error": err}, e.code

def ok(r):
    return r[1] == 200

def show(r, label=""):
    result = r[0]
    status = r[1]
    if status == 200:
        print(f"  [{label}] OK (HTTP 200)")
        d = result.get("data", result)
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, list):
                    print(f"    {k}: [{len(v)} items]")
                elif isinstance(v, dict):
                    print(f"    {k}: {{...{len(v)} keys...}}")
                else:
                    print(f"    {k}: {v}")
        elif isinstance(d, list):
            print(f"    [{len(d)} items]")
        else:
            print(f"    {d}")
    else:
        msg = json.dumps(result, ensure_ascii=False)[:300]
        print(f"  [{label}] FAIL (HTTP {status}): {msg}")
    return result

print("=== 智能招聘 API 全流程测试 ===\n")

# Step 1: Login (admin)
print("Step 1: 管理员登录")
r = api("POST", "/auth/login", body={"phone": "18601655222", "password": "123456", "loginType": "admin"})
login = show(r, "Login")
if r[1] != 200:
    print("FAIL: Cannot login")
    sys.exit(1)
token = login.get("data", {}).get("token", "")
print(f"  Token: {token[:20]}...\n")

# Step 2: Get stats
print("Step 2: 获取招聘统计")
r = api("GET", "/recruitment/stats", token=token)
stats = show(r, "Stats")
print()

# Step 3: List jobs
print("Step 3: 获取岗位列表")
r = api("GET", "/recruitment/posts", token=token)
jobs = show(r, "Posts")
job_data = r[0].get("data", {})
existing_jobs = job_data.get("jobs", []) if job_data.get("jobs") else []
print(f"  现有岗位数: {len(existing_jobs)}\n")

# Step 4: Create job
print("Step 4: 创建测试岗位")
r = api("POST", "/recruitment/jobs", token=token, body={
    "title": "前端开发工程师",
    "department": "技术部",
    "location": "北京",
    "salaryMin": 15000,
    "salaryMax": 30000,
    "experience": "3-5年",
    "education": "本科",
    "description": "负责前端页面开发与维护",
    "requirements": "熟悉React/Hooks/Next.js/TypeScript",
    "headcount": 2
})
job_result = show(r, "Create Job")
job_id = job_result.get("data", {}).get("id", "") if r[1] == 200 else ""
print(f"  Job ID: {job_id}\n")

# Step 5: List jobs again
print("Step 5: 再次获取岗位列表 (含 candidateCount)")
r = api("GET", "/recruitment/posts", token=token)
jobs_after = show(r, "Posts After Create")
print()

# Step 6: Match candidates
if job_id:
    print(f"Step 6: AI 匹配候选人 (job={job_id})")
    r = api("POST", "/recruitment/jobs/" + job_id + "/match", token=token, body={})
    match = show(r, "Match")
    print()

    # Step 7: List candidates
    print("Step 7: 获取候选人列表")
    r = api("GET", "/recruitment/candidates", token=token)
    candidates_data = show(r, "Candidates")
    print()

    # Step 8: Update candidate status
    cart_data = candidates_data if r[1] == 200 else {}
    cart_items = cart_data.get("data", cart_data)
    cands = cart_items.get("candidates", cart_items) if isinstance(cart_items, dict) else []
    if isinstance(cands, list) and cands:
        cand_id = cands[0]["id"]
        print(f"Step 8: 更新候选人状态 -> contacted (candidate={cand_id})")
        r = api("PUT", "/recruitment/candidates/" + cand_id + "/status", token=token, body={
            "status": "contacted",
            "notes": "测试-联系候选人"
        })
        show(r, "Update Status")
        print()

        # Step 9: Verify
        print("Step 9: 验证候选人状态已更新")
        r = api("GET", "/recruitment/candidates", token=token)
        show(r, "Candidates After Update")
        print()

# Step 10: Get interviews
print("Step 10: 获取面试列表")
r = api("GET", "/recruitment/interviews", token=token)
show(r, "Interviews")
print()

# Step 11: Get pipeline stats
print("Step 11: 获取管线统计")
r = api("GET", "/recruitment/pipeline/stats", token=token)
show(r, "Pipeline Stats")
print()

# Step 12: Final posts list
print("Step 12: 最终岗位列表 (含候选人计数)")
r = api("GET", "/recruitment/posts", token=token)
jobs_final = show(r, "Posts Final")
print()

print("=== 测试完成 ===")
