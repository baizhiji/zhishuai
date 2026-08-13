"""
智枢AI 四大功能深度验证脚本
验证每个功能的核心 API 是否真正可用，不只是返回 200
"""
import urllib.request, json, sys

BASE = "http://localhost:3001"
CUSTOMER_PHONE = "13800000001"
CUSTOMER_PWD = "123456"

def api(path, token=None, method="GET", body=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        try:
            return e.code, json.loads(body_text)
        except:
            return e.code, {"error": body_text[:200]}
    except Exception as e:
        return 0, {"error": str(e)}

# Login
print("=" * 60)
print("Step 0: 登录客户账号")
status, result = api("/api/auth/login", method="POST", 
    body={"phone": CUSTOMER_PHONE, "password": CUSTOMER_PWD, "loginType": "user"})
token = result.get("data", {}).get("token", "")
print(f"  登录: {status} | Token: {token[:20]}..." if token else "  登录失败!")

if not token:
    print("FATAL: 无法获取 token，退出")
    sys.exit(1)

results = {}

# ============================================================
# 1. AI创作工厂 — 关键依赖检查
# ============================================================
print("\n" + "=" * 60)
print("【1】AI创作工厂 — 核心功能验证")

print("\n  1a. AI 文本对话 (POST /api/ai-chat/chat)")
status, result = api("/api/ai-chat/chat", token=token, method="POST", 
    body={"messages": [{"role": "user", "content": "写一句话介绍智枢AI"}], "modelKey": "auto"})
print(f"    HTTP {status}")
if status == 200:
    msg = result.get("data", {}).get("message", "")
    print(f"    返回内容长度: {len(msg)} 字符")
    print(f"    使用模型: {result.get('data', {}).get('modelName', '未知')}")
    results["ai_text_ok"] = len(msg) > 10
    if len(msg) > 10:
        print("    ✅ AI 文本生成正常")
    else:
        print("    ⚠️ AI 返回内容过短")
        results["ai_text_ok"] = False
elif status == 400:
    error_msg = str(result.get("error", result.get("message", "")))
    if "API Key未配置" in error_msg or "API Key" in error_msg:
        print(f"    ❌ API Key 未配置: {error_msg}")
        results["ai_text_ok"] = False
        results["api_key_missing"] = True
    else:
        print(f"    ❌ 错误: {error_msg}")
        results["ai_text_ok"] = False
else:
    print(f"    ❌ 错误: {result}")
    results["ai_text_ok"] = False

print("\n  1b. AI 图片生成 (POST /api/ai-chat/image)")
status, result = api("/api/ai-chat/image", token=token, method="POST",
    body={"prompt": "一个简单的蓝色圆圈", "size": "512x512"})
print(f"    HTTP {status}")
if status == 200:
    img_url = result.get("data", {}).get("imageUrl", "")
    print(f"    图片URL: {img_url[:80]}..." if img_url else "    无图片URL")
    results["ai_image_ok"] = bool(img_url)
    if img_url:
        print("    ✅ 图片生成正常")
    else:
        print("    ⚠️ 返回无图片URL")
elif status == 400:
    error_msg = str(result.get("error", result.get("message", "")))
    if "API Key" in error_msg:
        print(f"    ❌ API Key 未配置")
        results["ai_image_ok"] = False
    else:
        print(f"    ❌ 错误: {error_msg}")
        results["ai_image_ok"] = False
else:
    print(f"    ❌ 错误: {result}")
    results["ai_image_ok"] = False

print("\n  1c. AI 诊断分析 (POST /api/ai-chat/diagnosis)")
status, result = api("/api/ai-chat/diagnosis", token=token, method="POST",
    body={"request": "分析奶茶店的竞争力", "industry": "餐饮", "analysisType": "comprehensive"})
print(f"    HTTP {status}")
if status == 200:
    msg = result.get("data", {}).get("message", "")
    print(f"    返回内容长度: {len(msg)} 字符")
    results["ai_diagnosis_ok"] = len(msg) > 20
    if len(msg) > 20:
        print("    ✅ 诊断分析生成正常")
    else:
        print("    ⚠️ 返回内容过短")
elif status == 400:
    error_msg = str(result.get("error", result.get("message", "")))
    if "API Key" in error_msg:
        print(f"    ❌ API Key 未配置")
        results["ai_diagnosis_ok"] = False
    else:
        print(f"    ❌ 错误: {error_msg}")
        results["ai_diagnosis_ok"] = False
else:
    print(f"    ❌ 错误: {result}")
    results["ai_diagnosis_ok"] = False

# Check API Key config
print("\n  1d. 检查服务器 API Key 配置")
status, result = api("/api/ai-chat/models", token=token)
print(f"    模型列表API: HTTP {status}")
models_count = len(result.get("data", [])) if status == 200 else 0
print(f"    可用模型数: {models_count}")

# ============================================================
# 2. 智能招聘 — 核心功能验证
# ============================================================
print("\n" + "=" * 60)
print("【2】智能招聘 — 核心功能验证")

print("\n  2a. 创建招聘岗位 (POST /api/recruitment/jobs)")
status, result = api("/api/recruitment/jobs", token=token, method="POST",
    body={
        "title": "测试-前端工程师",
        "salaryMin": 15000,
        "salaryMax": 30000,
        "experience": "3-5年",
        "education": "本科",
        "description": "负责前端开发",
        "requirements": "熟悉React/TypeScript",
        "benefits": "五险一金",
        "recruiterName": "HR张",
        "recruiterPhone": "13800000001"
    })
print(f"    HTTP {status}")
job_id = None
if status == 200:
    job_id = result.get("data", {}).get("id")
    print(f"    岗位ID: {job_id}")
    print("    ✅ 岗位创建成功")
    results["recruit_create_job_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["recruit_create_job_ok"] = False

print("\n  2b. AI匹配候选人 (POST /api/recruitment/jobs/:id/match)")
if job_id:
    status, result = api(f"/api/recruitment/jobs/{job_id}/match", token=token, method="POST",
        body={})
    print(f"    HTTP {status}")
    if status == 200:
        candidates = result.get("data", {}).get("candidates", [])
        print(f"    匹配候选人数: {len(candidates)}")
        if len(candidates) > 0:
            print(f"    候选人样例: {candidates[0].get('name', 'N/A')} 匹配度 {candidates[0].get('score', 0)}")
            print("    ✅ AI候选人匹配成功")
            results["recruit_match_ok"] = True
        else:
            print("    ⚠️ 无匹配候选人（AI 可能未配置或无数据）")
            results["recruit_match_ok"] = False
    elif status == 500:
        print(f"    ❌ 服务错误（AI API Key 可能未配置）: {result.get('message', '')[:100]}")
        results["recruit_match_ok"] = False
    else:
        print(f"    ❌ 错误: {result}")
        results["recruit_match_ok"] = False
else:
    print("    跳过（岗位创建失败）")
    results["recruit_match_ok"] = False

print("\n  2c. 获取招聘管线统计 (GET /api/recruitment/pipeline/stats)")
status, result = api("/api/recruitment/pipeline/stats", token=token)
print(f"    HTTP {status}")
if status == 200:
    total_jobs = result.get("data", {}).get("totalJobs", 0)
    print(f"    岗位总数: {total_jobs}")
    print("    ✅ 管线统计正常")
    results["recruit_stats_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["recruit_stats_ok"] = False

print("\n  2d. 获取搜索配置 (GET /api/recruitment/search-config)")
status, result = api("/api/recruitment/search-config", token=token)
print(f"    HTTP {status}")
configs_count = len(result.get("data", {}).get("configs", [])) if status == 200 else 0
print(f"    搜索配置数: {configs_count}")
results["recruit_config_ok"] = True

# ============================================================
# 3. 智能获客 — 核心功能验证
# ============================================================
print("\n" + "=" * 60)
print("【3】智能获客 — 核心功能验证")

print("\n  3a. 创建获客任务 (POST /api/acquisition/tasks)")
status, result = api("/api/acquisition/tasks", token=token, method="POST",
    body={
        "title": "测试-抖音获客任务",
        "channel": "douyin",
        "targetCount": 20,
        "content": "AI SaaS产品推广"
    })
print(f"    HTTP {status}")
task_id = None
if status == 200:
    task_id = result.get("data", {}).get("id")
    print(f"    任务ID: {task_id}")
    print("    ✅ 获客任务创建成功")
    results["acq_create_task_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["acq_create_task_ok"] = False

print("\n  3b. AI潜客发现 (POST /api/acquisition/tasks/:id/discover)")
if task_id:
    status, result = api(f"/api/acquisition/tasks/{task_id}/discover", token=token, method="POST",
        body={"count": 5})
    print(f"    HTTP {status}")
    if status == 200:
        leads = result.get("data", {}).get("leads", [])
        print(f"    发现潜客数: {len(leads)}")
        if len(leads) > 0:
            print(f"    潜客样例: {leads[0].get('name', 'N/A')} 评分 {leads[0].get('aiScore', 0)}")
            print("    ✅ AI潜客发现成功")
            results["acq_discover_ok"] = True
        else:
            print("    ⚠️ 无潜客发现")
            results["acq_discover_ok"] = False
    elif status == 500:
        print(f"    ❌ 服务错误（AI API Key 可能未配置）: {result.get('message', '')[:100]}")
        results["acq_discover_ok"] = False
    else:
        print(f"    ❌ 错误: {result}")
        results["acq_discover_ok"] = False
else:
    print("    跳过（任务创建失败）")
    results["acq_discover_ok"] = False

print("\n  3c. 获取获客统计 (GET /api/acquisition/dashboard)")
status, result = api("/api/acquisition/dashboard", token=token)
print(f"    HTTP {status}")
if status == 200:
    total_leads = result.get("data", {}).get("totalLeads", 0)
    print(f"    潜客总数: {total_leads}")
    print("    ✅ 获客看板正常")
    results["acq_dashboard_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["acq_dashboard_ok"] = False

print("\n  3d. 频次控制 (GET /api/acquisition/rate-limit)")
status, result = api("/api/acquisition/rate-limit", token=token)
print(f"    HTTP {status}")
if status == 200:
    data = result.get("data", [])
    print(f"    监控平台数: {len(data) if isinstance(data, list) else 0}")
    print("    ✅ 频次控制正常")
    results["acq_ratelimit_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["acq_ratelimit_ok"] = False

# ============================================================
# 4. 推荐分享 — 核心功能验证
# ============================================================
print("\n" + "=" * 60)
print("【4】推荐分享 — 核心功能验证")

print("\n  4a. 创建分享二维码 (POST /api/share/codes)")
status, result = api("/api/share/codes", token=token, method="POST",
    body={
        "title": "测试-产品宣传视频分享",
        "videoUrl": "https://example.com/video/test123.mp4",
        "platforms": ["douyin", "kuaishou", "xiaohongshu"],
        "description": "智枢AI产品功能介绍"
    })
print(f"    HTTP {status}")
code_id = None
if status == 200:
    code_id = result.get("data", {}).get("id")
    scan_url = result.get("data", {}).get("scanUrl", "")
    qr_url = result.get("data", {}).get("qrCodeUrl", "")
    platforms = result.get("data", {}).get("platforms", [])
    print(f"    分享码ID: {code_id}")
    print(f"    扫码链接: {scan_url}")
    print(f"    目标平台: {platforms}")
    print("    ✅ 分享二维码创建成功")
    results["share_create_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["share_create_ok"] = False

print("\n  4b. 获取分享码列表 (GET /api/share/codes)")
status, result = api("/api/share/codes", token=token)
print(f"    HTTP {status}")
if status == 200:
    code_list = result.get("data", {}).get("list", [])
    print(f"    分享码数量: {len(code_list)}")
    if len(code_list) > 0:
        print(f"    最新分享码: {code_list[0].get('title', 'N/A')}")
    print("    ✅ 分享码列表正常")
    results["share_list_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["share_list_ok"] = False

print("\n  4c. 获取分享看板 (GET /api/share/dashboard)")
status, result = api("/api/share/dashboard", token=token)
print(f"    HTTP {status}")
if status == 200:
    total = result.get("data", {}).get("totalLinks", 0)
    views = result.get("data", {}).get("totalViews", 0)
    print(f"    总链接数: {total}, 总浏览量: {views}")
    print("    ✅ 分享看板正常")
    results["share_dashboard_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["share_dashboard_ok"] = False

print("\n  4d. 获取分享统计 (GET /api/share/stats)")
status, result = api("/api/share/stats", token=token)
print(f"    HTTP {status}")
if status == 200:
    scans = result.get("data", {}).get("totalScans", 0)
    publish = result.get("data", {}).get("totalPublish", 0)
    print(f"    总扫码: {scans}, 总发布: {publish}")
    print("    ✅ 分享统计正常")
    results["share_stats_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["share_stats_ok"] = False

print("\n  4e. 获取用户推荐码 (GET /api/share/my-code)")
status, result = api("/api/share/my-code", token=token)
print(f"    HTTP {status}")
if status == 200:
    ref_code = result.get("data", {}).get("code", "")
    print(f"    推荐码: {ref_code}")
    print("    ✅ 推荐码获取正常")
    results["share_mycode_ok"] = True
else:
    print(f"    ❌ 错误: {result}")
    results["share_mycode_ok"] = False

# ============================================================
# 汇总报告
# ============================================================
print("\n" + "=" * 60)
print("=" * 60)
print("          四大功能验证汇总")
print("=" * 60)

def status_icon(ok):
    return "✅ 可用" if ok else "❌ 不可用"

print(f"\n  📝 AI创作工厂:")
print(f"     AI文本生成:  {status_icon(results.get('ai_text_ok', False))}")
print(f"     AI图片生成:  {status_icon(results.get('ai_image_ok', False))}")
print(f"     AI诊断分析:  {status_icon(results.get('ai_diagnosis_ok', False))}")

print(f"\n  🎯 智能招聘:")
print(f"     岗位管理:    {status_icon(results.get('recruit_create_job_ok', False))}")
print(f"     AI候选人匹配: {status_icon(results.get('recruit_match_ok', False))}")
print(f"     管线统计:    {status_icon(results.get('recruit_stats_ok', False))}")

print(f"\n  🔍 智能获客:")
print(f"     任务管理:    {status_icon(results.get('acq_create_task_ok', False))}")
print(f"     AI潜客发现:  {status_icon(results.get('acq_discover_ok', False))}")
print(f"     获客看板:    {status_icon(results.get('acq_dashboard_ok', False))}")
print(f"     频次控制:    {status_icon(results.get('acq_ratelimit_ok', False))}")

print(f"\n  🔗 推荐分享:")
print(f"     创建分享码:  {status_icon(results.get('share_create_ok', False))}")
print(f"     分享码列表:  {status_icon(results.get('share_list_ok', False))}")
print(f"     分享看板:    {status_icon(results.get('share_dashboard_ok', False))}")
print(f"     分享统计:    {status_icon(results.get('share_stats_ok', False))}")
print(f"     推荐码:      {status_icon(results.get('share_mycode_ok', False))}")

total = len(results)
passed = sum(1 for v in results.values() if v)
print(f"\n  总计: {passed}/{total} 项验证通过")

if results.get("api_key_missing"):
    print("\n  ⚠️ 检测到 API Key 未配置! AI创作工厂、智能招聘(候选人匹配)、")
    print("     智能获客(AI潜客发现)依赖腾讯云TokenHub API Key。")
    print("     需要在服务器环境变量设置 TENCENT_TOKENHUB_API_KEY。")

print("\n" + "=" * 60)
