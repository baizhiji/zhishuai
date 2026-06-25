#!/usr/bin/env python3
"""本地编译 server TypeScript"""
import subprocess
import os

os.chdir("c:/Users/Administrator/zhishuai/server")
# Windows 上 npm 是 npm.cmd
result = subprocess.run("npm.cmd run build", shell=True, capture_output=True, text=True, timeout=120)
print("STDOUT:", result.stdout[-3000:])
print("STDERR:", result.stderr[-2000:])
print("Return code:", result.returncode)
