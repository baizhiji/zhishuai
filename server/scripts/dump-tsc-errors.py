# -*- coding: utf-8 -*-
"""运行 tsc --noEmit 并将错误输出写入文件（处理 GBK 编码）"""
import subprocess, sys

r = subprocess.run(["npx", "tsc", "--noEmit"], capture_output=True, shell=True)
stdout = r.stdout.decode("utf-8", errors="replace")
stderr = r.stderr.decode("utf-8", errors="replace")
full = stdout + stderr
with open("tsc-errors.txt", "w", encoding="utf-8") as f:
    f.write(full)
n = len([l for l in full.splitlines() if "error TS" in l])
print(f"TS errors: {n}")
