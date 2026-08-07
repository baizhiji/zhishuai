#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Customer Terminal Corrected Test - v2"""
import requests, urllib3, json
urllib3.disable_warnings()

BASE = "https://baizhiji.net"
PASS, FAIL, WARN, ERR = 0, 0, 0, 0

def login():
    r = requests.post(f"{BASE}/api/auth/login", json={"phone":"13800000001","password":"123456","loginType":"user"}, verify=False)
    return r.json()["data"]["token"]

def test(method, path, body=None, name=""):
    global PASS, FAIL, WARN, ERR
    H = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    try:
        if method == "GET":
            r = requests.get(f"{BASE}{path}", headers=H, timeout=15, verify=False)
        else:
            r = requests.post(f"{BASE}{path}", headers=H, json=body if body else {}, timeout=15, verify=False)

        code = r.status_code
        try:
            resp_preview = json.dumps(r.json(), ensure_ascii=False)[:120]
        except:
            resp_preview = r.text[:80]

        if code in (200, 201):
            s, PASS = "OK", PASS + 1
        elif code >= 500:
            s, FAIL = "FAIL", FAIL + 1
        elif code == 404:
            s, FAIL = "FAIL", FAIL + 1
        else:
            s, WARN = "WARN", WARN + 1

        print(f"  [{s:4s}] {method:4s} {path:50s} -> {code} {resp_preview}")
    except Exception as e:
        ERR += 1
        print(f"  [ERR]  {method:4s} {path:50s} -> {str(e)[:80]}")

TOKEN = login()
print(f"[LOGIN] OK\n")

print("=" * 120)
print("CORRECTED CUSTOMER API TEST (Correct Routes + Proper Parameters)")
print("=" * 120)

# 1. Dashboard
print("\n--- 1. Dashboard ---")
test("GET", "/api/dashboard-stats/customer-summary")
test("GET", "/api/token-stats/stats")
test("GET", "/api/dashboard-stats/overview")
test("GET", "/api/dashboard-stats/business-lines")

# 2. AI Enhanced (with topic param)
print("\n--- 2. AI Enhanced ---")
test("POST", "/api/ai-enhanced/post", {"topic": "How AI changes marketing", "style": "Professional"})
test("POST", "/api/ai-enhanced/title", {"topic": "Summer fashion trends", "count": 3})
test("POST", "/api/ai-enhanced/hashtags", {"topic": "Healthy eating tips", "count": 5})
test("POST", "/api/ai-enhanced/script", {"topic": "Product unboxing review"})
test("GET", "/api/ai-enhanced/tools")

# 3. AI Chat (proper messages format)
print("\n--- 3. AI Chat ---")
test("POST", "/api/ai-chat/chat", {"messages": [{"role": "user", "content": "Say hello"}]})
test("POST", "/api/ai-chat/image", {"prompt": "beautiful sunset over mountains", "size": "1024x1024"})
test("POST", "/api/ai-chat/video", {"videoUrl": "https://example.com/sample.mp4"})

# 4. AI Factory (Next.js proxy - not backend)
print("\n--- 4. AI Factory (WEB Proxy) ---")
test("POST", "/api/ai-factory/generate-text", {"topic": "test"})

# 5. Recruitment (correct paths)
print("\n--- 5. Recruitment ---")
test("GET", "/api/recruitment/jobs")
test("GET", "/api/recruitment/pipeline/stats")
test("GET", "/api/recruitment/search-config")
test("GET", "/api/recruitment/candidates")

# 6. Acquisition (correct paths)
print("\n--- 6. Acquisition ---")
test("GET", "/api/acquisition/tasks")
test("GET", "/api/acquisition/dashboard")
test("GET", "/api/acquisition/leads")

# 7. Share (correct paths)
print("\n--- 7. Share ---")
test("GET", "/api/share/codes")
test("GET", "/api/share/records")
test("GET", "/api/share/dashboard")
test("GET", "/api/share/commission")

# 8. Materials
print("\n--- 8. Materials ---")
test("GET", "/api/materials")

# 9. Tickets
print("\n--- 9. Tickets ---")
test("GET", "/api/tickets")

# 10. Support
print("\n--- 10. Support ---")
test("GET", "/api/support/qrcode")
test("GET", "/api/support/wecom-qr")

# 11. API Keys
print("\n--- 11. API Keys ---")
test("GET", "/api/ai-config/keys")

# 12. Version (correct endpoint)
print("\n--- 12. Version ---")
test("GET", "/api/version/latest")

# 13. Digital Human
print("\n--- 13. Digital Human ---")
test("GET", "/api/digital-human/avatars")
test("GET", "/api/digital-human/voices")

# 14. Voice Clone
print("\n--- 14. Voice Clone ---")
test("GET", "/api/voice-clone/voices")

# 15. Login Logs
print("\n--- 15. Login Logs ---")
test("GET", "/api/auth/login-logs")

# 16. Account
print("\n--- 16. Account ---")
test("GET", "/api/account/")
test("GET", "/api/account/usage-stats")
test("GET", "/api/account/packages")

# 17. Announcements
print("\n--- 17. Announcements ---")
test("GET", "/api/announcements")
test("GET", "/api/announcements?audience=customer")

# 18. Notifications
print("\n--- 18. Notifications ---")
test("GET", "/api/notifications")

# 19. User Features
print("\n--- 19. User Features ---")
test("GET", "/api/features")

# 20. Feedback (correct path)
print("\n--- 20. AI Feedback ---")
test("GET", "/api/ai-feedback")

# 21. Referral (correct endpoints)
print("\n--- 21. Referral ---")
test("GET", "/api/referral/stats")
test("GET", "/api/referral/users")

# 22. Social Account (correct path)
print("\n--- 22. Social Account ---")
test("GET", "/api/social/list")

# 23. Hot Topics
print("\n--- 23. Hot Topics ---")
test("GET", "/api/hot-topics")

# 24. Hotspot
print("\n--- 24. Hotspot ---")
test("GET", "/api/hotspot")

# 25. AI Workflow
print("\n--- 25. AI Workflow ---")
test("GET", "/api/ai-workflow/templates")

# 26. Enhancement
print("\n--- 26. Enhancement ---")
test("GET", "/api/enhancement")

# 27. Business Assistant
print("\n--- 27. Business Assistant ---")
test("GET", "/api/business")

# 28. Scripts
print("\n--- 28. Scripts ---")
test("GET", "/api/scripts")

# 29. Data Acquisition
print("\n--- 29. Data Acquisition ---")
test("GET", "/api/data-acquisition")

# 30. AI Config
print("\n--- 30. AI Config ---")
test("GET", "/api/ai-config/providers")

# 31. Employee (should be 403 for customer)
print("\n--- 31. Employee (Expected 403) ---")
test("GET", "/api/employee/list")

# Report
print("\n" + "=" * 120)
total = PASS + FAIL + WARN + ERR
print(f"REPORT: Total={total}  PASS={PASS}  FAIL={FAIL}  WARN={WARN}  ERROR={ERR}")
if total > 0:
    print(f"Rate: {PASS}/{total} = {PASS*100//total}%")
