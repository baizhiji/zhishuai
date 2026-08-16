# -*- coding: utf-8 -*-
"""将服务器 nginx 主站 location / 替换为「网页版已下线」引导页，并移除 /_next/static 块。

基于行的精确替换，避免跨行正则贪婪匹配导致误删。
"""
import sys

P = '/etc/nginx/sites-enabled/baizhiji.net'

OFFLINE_BLOCK = [
    '    # 在线网页版已下线（产品形态：桌面安装版 + APK），根路径返回下载引导页\n',
    '    location / {\n',
    '        default_type text/html;\n',
    "        return 200 '<!DOCTYPE html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>智枢AI</title></head><body style=\"font-family:sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\"><div style=\"text-align:center;padding:40px\"><h1 style=\"color:#1677ff;margin-bottom:12px\">智枢AI</h1><p style=\"color:#666\">在线网页版已下线，请下载桌面安装版使用。</p><p><a href=\"/downloads/\" style=\"color:#1677ff\">前往下载中心</a></p></div></body></html>';\n",
    '    }\n',
]

LOCATION_OPEN = '    location / {\n'
NEXT_OPEN = '    location /_next/static/ {\n'
BLOCK_CLOSE = '    }\n'


def find_block(lines: list, open_line: str) -> int | None:
    """返回 open_line 所在行号；若其后若干行含 proxy_pass 到 3000 则确认，否则继续找。"""
    for i, ln in enumerate(lines):
        if ln == open_line:
            # 确认该块内是否有 proxy_pass 3000（区分主站块与 IP 段 3001 块）
            j = i + 1
            while j < len(lines) and lines[j] != BLOCK_CLOSE:
                if 'proxy_pass http://127.0.0.1:3000' in lines[j]:
                    return i
                j += 1
    return None


def block_end(lines: list, start: int) -> int:
    """返回从 start 开始的第一个 4 空格缩进块结束行号。"""
    for k in range(start + 1, len(lines)):
        if lines[k] == BLOCK_CLOSE:
            return k
    raise SystemExit(f'ERROR: no closing line after {start}')


def main() -> int:
    with open(P, encoding='utf-8') as f:
        lines = f.readlines()

    start = find_block(lines, LOCATION_OPEN)
    if start is None:
        print('ERROR: main location / block not found', file=sys.stderr)
        return 1
    end = block_end(lines, start)
    lines[start:end + 1] = OFFLINE_BLOCK

    nstart = find_block(lines, NEXT_OPEN)
    if nstart is not None:
        nend = block_end(lines, nstart)
        del lines[nstart:nend + 1]
    else:
        print('WARN: _next/static block not found', file=sys.stderr)

    with open(P, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print('PATCH_OK')
    return 0


if __name__ == '__main__':
    sys.exit(main())
