#!/usr/bin/env python3
"""
AI创作工厂 - 10通道综合诊断测试
测试所有唯一模型API (文本/图片/视频/TTS/数字人)
"""
import json, time, os, urllib.request, urllib.error, ssl

# 忽略SSL
ssl._create_default_https_context = ssl._create_unverified_context

ALIBABA_KEY = "sk-ws-H.RPMYEYE.dzw3.MEYCIQDumxWPlxxNkZe2Uhs75oaS-ltlVQoCjBLOfjcD0gVXhAIhAKbRSABq0MMots4ZkSlXRg2tcDnB-66pCr75p6maCiZg"
TENCENT_KEY = "sk-5U3470t0hXEI6T6rYleZsDt30drktwfd6PpKR4h5JDDA9b7h"
TENCENT_KEY_ID = "ak-20260511-a9a1ca7404955688482124b0af60cb24"

ALIBABA_BASE = "https://dashscope.aliyuncs.com"
TENCENT_BASE = "https://api.tokenhub.ai"

results = []

def post(url, headers, body, timeout=60):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method='POST')
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

def get(url, headers, timeout=30):
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

def report(name, channel, status, detail=""):
    results.append({"name": name, "channel": channel, "status": status, "detail": detail})
    icon = "✓" if status == "PASS" else "✗"
    print(f"  {icon} [{name}] ({channel}) - {status}")
    if detail:
        print(f"    {detail[:200]}")

print("=" * 70)
print("  AI创作工厂 - 10通道关键模型诊断测试")
print("=" * 70)

# ─── 通道1: 小红书图文 ────
print("\n## 通道1: 小红书图文 (xiaohongshu)")
print("  关键模型: deepseek-v4-pro (文本) + qwen-image-max (图片)")

# 1a. deepseek text (Tencent OpenAI-compatible)
try:
    status, body = post(
        f"{TENCENT_BASE}/v1/chat/completions",
        {"Content-Type": "application/json", "Authorization": f"Bearer {TENCENT_KEY}"},
        {"model": "deepseek-v4-pro", "messages": [{"role": "user", "content": "Hello"}], "max_tokens": 20}
    )
    ok = status == 200 and "choices" in body
    report("deepseek-v4-pro 文本", "小红书图文", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("deepseek-v4-pro 文本", "小红书图文", "FAIL", str(e))

# 1b. qwen-image-max (Alibaba multimodal)
try:
    status, body = post(
        f"{ALIBABA_BASE}/api/v1/services/aigc/multimodal-generation/generation",
        {"Content-Type": "application/json", "Authorization": f"Bearer {ALIBABA_KEY}"},
        {"model": "qwen-image-max", "input": {"messages": [{"role": "user", "content": [{"text": "a red apple"}]}]},
         "parameters": {"size": "1024*1024", "n": 1}}
    )
    ok = status == 200 and "output" in body
    report("qwen-image-max 图片", "小红书图文", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("qwen-image-max 图片", "小红书图文", "FAIL", str(e))

# ─── 通道2: 图片生成 ────
print("\n## 通道2: 图片生成 (image)")
print("  关键模型: hy-image-v3 (腾讯) + z-image-turbo (阿里)")

# 2a. z-image-turbo (Alibaba)
try:
    status, body = post(
        f"{ALIBABA_BASE}/api/v1/services/aigc/multimodal-generation/generation",
        {"Content-Type": "application/json", "Authorization": f"Bearer {ALIBABA_KEY}"},
        {"model": "z-image-turbo", "input": {"messages": [{"role": "user", "content": [{"text": "a cat"}]}]},
         "parameters": {"size": "1024*1024", "n": 1}}
    )
    ok = status == 200 and "output" in body
    report("z-image-turbo 图片", "图片生成", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("z-image-turbo 图片", "图片生成", "FAIL", str(e))

# 2b. hy-image-v3 (Tencent)
try:
    status, body = post(
        f"{TENCENT_BASE}/v1/images/generations",
        {"Content-Type": "application/json", "Authorization": f"Bearer {TENCENT_KEY}"},
        {"model": "hy-image-v3.0", "prompt": "a cute cat", "n": 1, "size": "1024x1024"}
    )
    ok = status == 200
    report("hy-image-v3.0 图片", "图片生成", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("hy-image-v3.0 图片", "图片生成", "FAIL", str(e))

# ─── 通道3: 电商详情页 ────
print("\n## 通道3: 电商详情页 (ecommerce)")
print("  关键模型: wan2.7-image-pro (阿里异步)")

# 3a. wan2.7-image-pro (Alibaba async)
try:
    status, body = post(
        f"{ALIBABA_BASE}/api/v1/services/aigc/image-generation/generation",
        {"Content-Type": "application/json", "Authorization": f"Bearer {ALIBABA_KEY}",
         "X-DashScope-Async": "enable"},
        {"model": "wan2.7-image-pro", "input": {"prompt": "a white product on white background, product photography"},
         "parameters": {"size": "1024*1024", "n": 1}}
    )
    ok = status == 200 and "output" in body
    report("wan2.7-image-pro 图片(异步)", "电商详情页", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("wan2.7-image-pro 图片(异步)", "电商详情页", "FAIL", str(e))

# ─── 通道4: 短视频脚本 ────
print("\n## 通道4: 短视频脚本 (shortVideo)")
print("  关键模型: kling-video (腾讯视频) + qwen-tts (阿里TTS)")

# 4a. kling-video-v3 submit (Tencent native API)
try:
    status, body = post(
        f"{TENCENT_BASE}/v1/api/video/submit",
        {"Content-Type": "application/json", "Authorization": f"Bearer {TENCENT_KEY}"},
        {"model": "kl-video-v3", "prompt": "一只猫在草地上奔跑", "duration": 5}
    )
    ok = status == 200 and "id" in body
    report("kl-video-v3 视频提交", "短视频脚本", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("kl-video-v3 视频提交", "短视频脚本", "FAIL", str(e))

# 4b. qwen-tts (Alibaba multimodal)
try:
    status, body = post(
        f"{ALIBABA_BASE}/api/v1/services/aigc/multimodal-generation/generation",
        {"Content-Type": "application/json", "Authorization": f"Bearer {ALIBABA_KEY}"},
        {"model": "qwen-tts", "input": {"text": "你好，这是测试配音"}, "parameters": {"voice": "zhixiaobai", "language_type": "Chinese"}}
    )
    ok = status == 200 and "output" in body
    report("qwen-tts 配音", "短视频脚本", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("qwen-tts 配音", "短视频脚本", "FAIL", str(e))

# ─── 通道5: 企业宣传视频 ────
print("\n## 通道5: 企业宣传视频 (enterpriseVideo)")
print("  模型同上(channel4), 跳过重复测试 → 查看通道4结果")

# ─── 通道6: 产品宣传视频 ────
print("\n## 通道6: 产品宣传视频 (productVideo)")
print("  模型同通道3+4, 跳过重复测试")

# ─── 通道7: 探店视频 ────
print("\n## 通道7: 探店视频 (storeTour)")
print("  模型同通道4, 跳过重复测试")

# ─── 通道8: 真人MV视频 ────
print("\n## 通道8: 真人MV视频 (personMv)")
print("  模型同通道1+4, 跳过重复测试")

# ─── 通道9: 萌宠卡通短视频 ────
print("\n## 通道9: 萌宠卡通短视频 (cartoonVideo)")
print("  模型同通道1+4, 跳过重复测试")

# ─── 通道10: 数字人 ────
print("\n## 通道10: 数字人 (digitalHuman)")
print("  关键模型: yt-video-humanactor (腾讯原生API)")

# 10a. yt-video-humanactor (Tencent native, uses text param)
try:
    status, body = post(
        f"{TENCENT_BASE}/v1/api/video/submit",
        {"Content-Type": "application/json", "Authorization": f"Bearer {TENCENT_KEY}"},
        {"model": "yt-video-humanactor", "text": "欢迎来到智枢AI，我是你的数字人助手", "duration": 10}
    )
    ok = status == 200 and "id" in body
    report("yt-video-humanactor 数字人", "数字人", "PASS" if ok else "FAIL",
           f"HTTP {status}" + ("" if ok else f": {body[:150]}"))
except Exception as e:
    report("yt-video-humanactor 数字人", "数字人", "FAIL", str(e))

# ─── 汇总 ───
print("\n" + "=" * 70)
print("  汇总结果")
print("=" * 70)

unique_models = {}
for r in results:
    if r["name"] not in unique_models:
        unique_models[r["name"]] = r

pass_count = sum(1 for r in results if r["status"] == "PASS")
fail_count = sum(1 for r in results if r["status"] == "FAIL")
total = len(results)

print(f"\n总测试: {total}  通过: {pass_count}  失败: {fail_count}")
print(f"通过率: {pass_count/total*100:.0f}%\n")

channel_status = {}
for r in results:
    if r["channel"] not in channel_status:
        channel_status[r["channel"]] = True
    if r["status"] == "FAIL":
        channel_status[r["channel"]] = False

print("通道状态:")
for ch in ["小红书图文", "图片生成", "电商详情页", "短视频脚本", "企业宣传视频",
            "产品宣传视频", "探店视频", "真人MV视频", "萌宠卡通短视频", "数字人"]:
    st = channel_status.get(ch)
    if st is None:
        print(f"  ↻ [{ch}] - 无独立测试项 (使用其他通道模型)")
    elif st:
        print(f"  ✓ [{ch}] - 全部通过")
    else:
        print(f"  ✗ [{ch}] - 存在失败项")

if fail_count > 0:
    print("\n失败详情:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"  [{r['name']}] ({r['channel']}) - {r['detail']}")

print("\n" + "=" * 70)
print(f"测试完成 - {pass_count}/{total} 通过")
print("=" * 70)
