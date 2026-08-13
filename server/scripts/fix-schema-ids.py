# -*- coding: utf-8 -*-
"""为 schema.prisma 中所有 String 主键添加 @default(uuid())（先备份）"""
import re, shutil, sys

path = "prisma/schema.prisma"
bak = path + ".bak"
shutil.copy2(path, bak)

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 匹配形如 `id        String   @id` 的行（缩进 + id + String + @id）
pattern = re.compile(r"(?m)^(\s*id\s+String\s+)@id\s*$")
updated, n = pattern.subn(r"\1@id @default(uuid())", content)

with open(path, "w", encoding="utf-8", newline="\n") as f:
    f.write(updated)

print(f"已修改 {n} 处 String @id -> @default(uuid())")
