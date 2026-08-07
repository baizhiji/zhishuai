#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZhishuAI Customer Terminal Full Test Script
Tests: All Customer WEB pages + API endpoints + APK-dependent endpoints
"""

import requests
import urllib3
import json
import time
import sys
from collections import OrderedDict

urllib3.disable_warnings()

BASE = "https://baizhiji.net"
TOKEN = None
HEADERS = None
RESULTS = OrderedDict()
PAGE_RESULTS = OrderedDict()

def login():
    global TOKEN, HEADERS
    r = requests.post(f"{BASE}/api/auth/login", json={
        "phone": "13800000001", "password": "123456", "loginType": "user"
    }, verify=False)
    d = r.json()
    TOKEN = d['data']['token']
    HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    print(f"[LOGIN] OK, userId={d['data']['user']['id']}")
    return True

def test_api(method, path, name, category=""):
    try:
        if method == "GET":
            r = requests.get(f"{BASE}{path}", headers=HEADERS, timeout=15, verify=False)
        elif method == "POST":
            r = requests.post(f"{BASE}{path}", headers=HEADERS, json={}, timeout=15, verify=False)
        elif method == "PUT":
            r = requests.put(f"{BASE}{path}", headers=HEADERS, json={}, timeout=15, verify=False)
        else:
            r = requests.delete(f"{BASE}{path}", headers=HEADERS, timeout=15, verify=False)

        code = r.status_code
        try:
            body = r.json()
            has_data = body.get("data") is not None or body.get("success") in (True, "true")
        except:
            has_data = False
            body = None

        status = "PASS" if code in (200, 201, 204) and has_data else \
                 "WARN" if code in (200, 201) else "FAIL"

        RESULTS[name] = {
            "status": status, "code": code, "has_data": has_data,
            "body_keys": list(body.keys())[:5] if isinstance(body, dict) else str(body)[:80] if body else "empty",
            "category": category
        }
        print(f"  [{status}] [{method}] {path} -> {code}")

    except Exception as e:
        RESULTS[name] = {"status": "ERROR", "code": 0, "error": str(e)[:80], "category": category}
        print(f"  [ERROR] [{method}] {path} -> {str(e)[:80]}")

def test_page(path, name, category=""):
    try:
        s = requests.Session()
        s.verify = False
        s.headers.update(HEADERS)
        r = s.get(f"{BASE}{path}", timeout=20, allow_redirects=True)
        code = r.status_code
        clen = len(r.text)
        is_redirect = "/login" in r.url.lower() if r.url != f"{BASE}{path}" else False

        if code == 200 and not is_redirect:
            status = "PASS"
        elif is_redirect:
            status = "WARN_REDIRECT_LOGIN"
        else:
            status = "FAIL"

        PAGE_RESULTS[name] = {
            "status": status, "code": code, "size": clen,
            "redirected": is_redirect, "category": category
        }
        print(f"  [{status}] [PAGE] {path} -> {code} ({clen//1024}KB)")

    except Exception as e:
        PAGE_RESULTS[name] = {"status": "ERROR", "code": 0, "error": str(e)[:80], "category": category}
        print(f"  [ERROR] [PAGE] {path} -> {str(e)[:80]}")

# ====== MAIN ======

print("=" * 70)
print("ZhishuAI Customer Terminal - Full Functional Test")
print("=" * 70)

if not login():
    print("FATAL: Login failed")
    sys.exit(1)

# --- 1. Dashboard ---
print("\n--- 1. Dashboard ---")
test_api("GET", "/api/dashboard-stats/customer-summary", "Dashboard: Customer Summary", "Dashboard")
test_api("GET", "/api/token-stats/stats", "Dashboard: Token Stats", "Dashboard")
test_api("GET", "/api/dashboard-stats/business-lines", "Dashboard: Business Lines", "Dashboard")
test_page("/customer/dashboard", "Dashboard Page", "Dashboard")

# --- 2. AI Factory ---
print("\n--- 2. AI Factory ---")
test_page("/customer/ai-factory", "AI Factory Page", "AI Factory")
test_page("/customer/ai-chat", "AI Chat Page", "AI Factory")
test_api("POST", "/api/ai-factory/generate-text", "AI: Generate Text (proxy)", "AI Factory")
test_api("POST", "/api/ai-chat/chat", "AI: Chat", "AI Factory")
test_api("POST", "/api/ai-chat/image", "AI: Image", "AI Factory")
test_api("POST", "/api/ai-chat/video", "AI: Video Analysis", "AI Factory")
test_api("GET", "/api/ai-enhanced/history", "AI: History", "AI Factory")
test_api("POST", "/api/ai-enhanced/post", "AI: Post", "AI Factory")
test_api("POST", "/api/ai-enhanced/title", "AI: Title", "AI Factory")
test_api("POST", "/api/ai-enhanced/hashtags", "AI: Hashtags", "AI Factory")

# --- 3. Recruitment ---
print("\n--- 3. Recruitment ---")
test_page("/customer/recruitment", "Recruitment Main Page", "Recruitment")
test_page("/customer/recruitment/publish", "Publish Jobs Page", "Recruitment")
test_page("/customer/recruitment/auto", "Auto Recruitment Page", "Recruitment")
test_page("/customer/recruitment/platforms", "Recruitment Platforms Page", "Recruitment")
test_api("GET", "/recruitment/jobs", "Recruitment: Job List", "Recruitment")
test_api("GET", "/recruitment/pipeline/stats", "Recruitment: Pipeline Stats", "Recruitment")
test_api("GET", "/recruitment/search-config", "Recruitment: Search Config", "Recruitment")

# --- 4. Acquisition ---
print("\n--- 4. Acquisition ---")
test_page("/customer/acquisition/discover", "Discover Leads Page", "Acquisition")
test_page("/customer/acquisition/task", "Acquisition Tasks Page", "Acquisition")
test_page("/customer/acquisition/board", "Acquisition Board Page", "Acquisition")
test_api("GET", "/acquisition/leads", "Acquisition: Leads", "Acquisition")
test_api("GET", "/acquisition/tasks", "Acquisition: Tasks", "Acquisition")
test_api("GET", "/acquisition/dashboard", "Acquisition: Dashboard", "Acquisition")

# --- 5. Share ---
print("\n--- 5. Share ---")
test_page("/customer/share/board", "Share Board Page", "Share")
test_page("/customer/share/code", "Share Code Page", "Share")
test_page("/customer/share/track", "Share Track Page", "Share")
test_api("GET", "/share/dashboard", "Share: Dashboard", "Share")
test_api("GET", "/api/share/codes", "Share: Codes", "Share")
test_api("GET", "/api/share/records", "Share: Track Records", "Share")

# --- 6. Materials ---
print("\n--- 6. Materials ---")
test_page("/customer/materials", "Materials Page", "Materials")
test_api("GET", "/api/materials", "Materials: List", "Materials")

# --- 7. Tickets ---
print("\n--- 7. Tickets ---")
test_page("/customer/tickets", "Tickets Page", "Tickets")
test_api("GET", "/api/tickets", "Tickets: List", "Tickets")

# --- 8. Support ---
print("\n--- 8. Support ---")
test_page("/customer/support", "Support Page", "Support")
test_api("GET", "/api/support/qrcode", "Support: QR Code", "Support")

# --- 9. API Keys ---
print("\n--- 9. API Keys ---")
test_page("/customer/api-keys", "API Keys Page", "API Keys")
test_api("GET", "/api/ai-config/keys", "API Keys: List", "API Keys")

# --- 10. Security ---
print("\n--- 10. Security ---")
test_page("/customer/settings/security", "Security Settings Page", "Security")

# --- 11. App Download ---
print("\n--- 11. App Download ---")
test_page("/customer/settings/app-download", "App Download Page", "App Download")
test_api("GET", "/api/version", "App: Version", "App Download")

# --- 12. Digital Human ---
print("\n--- 12. Digital Human ---")
test_page("/customer/digital-human", "Digital Human Page", "Digital Human")
test_api("GET", "/enhancement/digital-human/avatars", "DH: Avatars", "Digital Human")
test_api("GET", "/api/voice-clone/voices", "DH: Voices", "Digital Human")

# --- 13. Login Logs ---
print("\n--- 13. Login Logs ---")
test_page("/customer/login-logs", "Login Logs Page", "Login Logs")
test_api("GET", "/api/auth/login-logs", "Login Logs: List", "Login Logs")

# --- 14. Account ---
print("\n--- 14. Account ---")
test_api("GET", "/api/account/", "Account: Info", "Account")
test_api("GET", "/api/account/usage-stats", "Account: Usage Stats", "Account")
test_api("GET", "/api/account/packages", "Account: Packages", "Account")

# --- 15. Announcements ---
print("\n--- 15. Announcements ---")
test_api("GET", "/api/announcements", "Announcements: List", "Announcements")

# --- 16. Notifications ---
print("\n--- 16. Notifications ---")
test_api("GET", "/api/notifications", "Notifications: List", "Notifications")

# --- 17. Messages ---
print("\n--- 17. Messages ---")
test_api("GET", "/api/messages", "Messages: List", "Messages")

# --- 18. Feedback ---
print("\n--- 18. Feedback ---")
test_api("POST", "/api/feedback", "Feedback: Submit", "Feedback")

# --- 19. Referral ---
print("\n--- 19. Referral ---")
test_api("GET", "/api/referral/codes", "Referral: Codes", "Referral")
test_api("GET", "/api/referral/records", "Referral: Records", "Referral")

# --- 20. Publish ---
print("\n--- 20. Publish ---")
test_api("GET", "/api/content-publish/tasks", "Publish: Tasks", "Publish")

# --- 21. Social Account ---
print("\n--- 21. Social Account ---")
test_api("GET", "/api/social-account/list", "Social: Account List", "Social")

# --- 22. Statistics (APK) ---
print("\n--- 22. Statistics ---")
test_api("GET", "/api/statistics/overview", "Statistics: Overview", "Statistics")

# --- 23. Template/Tool endpoints ---
print("\n--- 23. Template/Tool ---")
test_api("GET", "/api/ai-workflow/templates", "Workflow: Templates", "Workflow")
test_api("GET", "/api/enhancement/supported-tasks", "Enhancement: Tasks", "Enhancement")
test_api("GET", "/api/hotspot/trending", "Hotspot: Trending", "Hotspot")

# --- 24. Employee ---
print("\n--- 24. Employee ---")
test_api("GET", "/api/employee/list", "Employee: List", "Employee")

# --- 25. Auto Reply ---
print("\n--- 25. Auto Reply ---")
test_api("GET", "/api/auto-reply/config", "AutoReply: Config", "AutoReply")

# ====== REPORT ======
print("\n" + "=" * 70)
print("TEST REPORT")
print("=" * 70)

api_pass = sum(1 for v in RESULTS.values() if v["status"] == "PASS")
api_warn = sum(1 for v in RESULTS.values() if v["status"] == "WARN")
api_fail = sum(1 for v in RESULTS.values() if v["status"] == "FAIL")
api_error = sum(1 for v in RESULTS.values() if v["status"] == "ERROR")
api_total = len(RESULTS)

page_pass = sum(1 for v in PAGE_RESULTS.values() if v["status"] == "PASS")
page_warn = sum(1 for v in PAGE_RESULTS.values() if "WARN" in v["status"])
page_fail = sum(1 for v in PAGE_RESULTS.values() if v["status"] == "FAIL")
page_error = sum(1 for v in PAGE_RESULTS.values() if v["status"] == "ERROR")
page_total = len(PAGE_RESULTS)

print(f"\n[API] Total: {api_total}")
print(f"  PASS: {api_pass}  WARN: {api_warn}  FAIL: {api_fail}  ERROR: {api_error}")
if api_total > 0:
    print(f"  Rate: {api_pass}/{api_total} = {api_pass*100//api_total}%")

print(f"\n[PAGE] Total: {page_total}")
print(f"  PASS: {page_pass}  WARN: {page_warn}  FAIL: {page_fail}  ERROR: {page_error}")
if page_total > 0:
    print(f"  Rate: {page_pass}/{page_total} = {page_pass*100//page_total}%")

# Category summary
categories = OrderedDict()
for name, result in RESULTS.items():
    cat = result.get("category", "Other")
    if cat not in categories:
        categories[cat] = {"pass": 0, "fail": 0, "warn": 0, "error": 0}
    if result["status"] == "PASS":
        categories[cat]["pass"] += 1
    elif result["status"] == "FAIL":
        categories[cat]["fail"] += 1
    elif result["status"] == "WARN":
        categories[cat]["warn"] += 1
    else:
        categories[cat]["error"] += 1

print("\n[MODULE] By Category:")
for cat, stats in categories.items():
    total = sum(stats.values())
    good = stats["pass"]
    sym = "[OK]" if good == total else "[WARN]" if stats["fail"] + stats["error"] == 0 else "[FAIL]"
    print(f"  {sym} {cat}: {good}/{total}")

# Failures
fails = [(k, v) for k, v in RESULTS.items() if v["status"] not in ("PASS",)]
page_fails_list = [(k, v) for k, v in PAGE_RESULTS.items() if v["status"] != "PASS"]

if fails:
    print(f"\n[API-FAIL] ({len(fails)} items):")
    for name, result in fails:
        detail = result.get('error', '') or result.get('body_keys', '')
        print(f"  - {name}: [{result['status']}] code={result['code']} {detail}")

if page_fails_list:
    print(f"\n[PAGE-FAIL] ({len(page_fails_list)} items):")
    for name, result in page_fails_list:
        print(f"  - {name}: [{result['status']}] code={result.get('code','?')}")

# Save JSON report
report = {
    "test_time": time.strftime("%Y-%m-%d %H:%M:%S"),
    "summary": {
        "api_total": api_total, "api_pass": api_pass, "api_warn": api_warn,
        "api_fail": api_fail, "api_error": api_error,
        "api_rate": f"{api_pass*100//api_total if api_total else 0}%",
        "page_total": page_total, "page_pass": page_pass, "page_warn": page_warn,
        "page_fail": page_fail, "page_error": page_error,
        "page_rate": f"{page_pass*100//page_total if page_total else 0}%"
    },
    "api_results": {k: v for k, v in RESULTS.items()},
    "page_results": {k: v for k, v in PAGE_RESULTS.items()}
}

report_path = "docs/test_reports/customer_terminal_full_test_2026-08-07.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n[FILE] Report saved: {report_path}")

# Final verdict
total_issues = api_fail + api_error + page_fail + page_error
if total_issues == 0:
    print("\n[VERDICT] ALL PASS - Customer terminal is fully functional!")
else:
    print(f"\n[VERDICT] {total_issues} issues found (API: {api_fail+api_error}, PAGE: {page_fail+page_error})")
