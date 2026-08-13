# -*- coding: utf-8 -*-
"""给 schema 中所有无默认值的 updatedAt DateTime 添加 @default(now())"""
import re

path = "prisma/schema.prisma"
with open(path, encoding="utf-8") as f:
    s = f.read()

no_default = re.findall(r"(?m)^(\s*updatedAt\s+DateTime)\s*$", s)
print("updatedAt without default:", len(no_default))

updated = re.sub(r"(?m)^(\s*updatedAt\s+DateTime)\s*$", r"\1 @default(now())", s)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(updated)

# 验证
with open(path, encoding="utf-8") as f:
    s2 = f.read()
remaining = re.findall(r"(?m)^(\s*updatedAt\s+DateTime)\s*$", s2)
print("updatedAt still without default:", len(remaining))
