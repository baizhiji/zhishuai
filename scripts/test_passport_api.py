#!/usr/bin/env python3
"""Test passport APIs locally - verify QR code can be obtained"""
import requests
import json
import sys

print("=" * 50)
print("Testing Passport APIs Locally")
print("=" * 50)

# 1. Test Douyin passport API
print("\n[1] Testing Douyin sso.douyin.com/get_qrcode/...")
try:
    resp = requests.get(
        'https://sso.douyin.com/get_qrcode/',
        params={
            'next': 'https:%2F%2Fcreator.douyin.com%2F',
            'aid': '2906',
            'service': 'https:%2F%2Fcreator.douyin.com',
            'is_vcd': '1',
            'fp': 'test_fp_' + str(hash('test'))[-20:],
        },
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': 'https://creator.douyin.com/',
            'Accept': 'application/json',
        },
        timeout=15,
    )
    data = resp.json()
    print(f"  Status code: {resp.status_code}")
    print(f"  error_code: {data.get('error_code')}")
    if data.get('error_code') == 0 and data.get('data'):
        d = data['data']
        has_qrcode = bool(d.get('qrcode'))
        has_token = bool(d.get('token'))
        print(f"  has_qrcode: {has_qrcode}")
        print(f"  has_token: {has_token}")
        print(f"  qrcode length: {len(d.get('qrcode', '')) if has_qrcode else 0}")
        print(f"  token: {d.get('token', '')[:20]}...")
        if has_qrcode:
            print(f"  DOUYIN QR CODE OBTAINED SUCCESSFULLY!")
    else:
        print(f"  Response: {json.dumps(data, ensure_ascii=False)[:300]}")
except Exception as e:
    print(f"  Error: {e}")

# 2. Test Kuaishou passport API
print("\n[2] Testing Kuaishou id.kuaishou.com/rest/c/infra/ks/qr/start...")
try:
    resp = requests.post(
        'https://id.kuaishou.com/rest/c/infra/ks/qr/start',
        json={},
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Referer': 'https://www.kuaishou.com/',
            'Content-Type': 'application/json',
            'Origin': 'https://www.kuaishou.com',
        },
        timeout=15,
    )
    data = resp.json()
    print(f"  Status code: {resp.status_code}")
    has_image = bool(data.get('imageData'))
    has_token = bool(data.get('qrLoginToken'))
    print(f"  has_imageData: {has_image}")
    print(f"  has_qrLoginToken: {has_token}")
    if has_image:
        print(f"  imageData length: {len(data.get('imageData', ''))}")
        print(f"  KUAISHOU QR CODE OBTAINED SUCCESSFULLY!")
    else:
        print(f"  Response: {json.dumps(data, ensure_ascii=False)[:300]}")
except Exception as e:
    print(f"  Error: {e}")

# 3. Test Channels (WeChat Video) passport API
print("\n[3] Testing Channels channels.weixin.qq.com/auth_data...")
try:
    resp = requests.get(
        'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data',
        params={
            'appId': 'wx7865213d8994b326',
            'authType': 1,
            'language': 'zh_CN',
        },
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://channels.weixin.qq.com/platform/login',
            'Origin': 'https://channels.weixin.qq.com',
        },
        timeout=15,
    )
    data = resp.json()
    print(f"  Status code: {resp.status_code}")
    errCode = data.get('errCode')
    print(f"  errCode: {errCode}")
    if errCode == 0 and data.get('data'):
        has_key = bool(data['data'].get('qrcodeKey'))
        print(f"  has_qrcodeKey: {has_key}")
        if has_key:
            print(f"  qrcodeKey: {data['data']['qrcodeKey'][:30]}...")
            qrcode_url = f"https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data_img?qrcodeKey={data['data']['qrcodeKey']}&appId=wx7865213d8994b326"
            print(f"  QR Code URL: {qrcode_url[:80]}...")
            print(f"  CHANNELS QR CODE OBTAINED SUCCESSFULLY!")
    else:
        print(f"  Response: {json.dumps(data, ensure_ascii=False)[:300]}")
except Exception as e:
    print(f"  Error: {e}")

print("\n" + "=" * 50)
print("Test Complete")
print("=" * 50)
