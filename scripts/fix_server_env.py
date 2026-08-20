"""
清理 server/.env 中的 AI 兜底 Key（无系统兜底，客户只能使用自己配置的 Key）。

用法：python scripts/fix_server_env.py [--path server/.env]
"""
import argparse
import re

# 需要清理的 AI Key 环境变量（原兜底机制）
AI_KEY_VARS = [
    'ALIYUN_DASHSCOPE_API_KEY',
    'TENCENT_API_KEY',
    'TENCENT_API_KEY_ID',
    'TENCENT_TOKENHUB_API_KEY',
    'DASHSCOPE_API_KEY',
    'ARK_API_KEY',
    'VOLCENGINE_API_KEY',
]

KEY_PATTERN = re.compile(r'^\s*(?:export\s+)?(' + '|'.join(AI_KEY_VARS) + r')=')


def clean(path: str) -> int:
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    removed = 0
    kept = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if KEY_PATTERN.match(line):
            # 跳过可能的续行（值带引号跨行）
            stripped = line.strip()
            while not (stripped.endswith('"') or stripped.endswith("'")) and i + 1 < len(lines):
                i += 1
                stripped = lines[i].strip()
            removed += 1
            i += 1
            continue
        kept.append(line)
        i += 1

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(kept)

    return removed


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='清理 AI 兜底 Key')
    parser.add_argument('--path', default='server/.env', help='.env 文件路径')
    args = parser.parse_args()

    n = clean(args.path)
    print(f'cleaned {n} AI fallback key entries from {args.path}')
