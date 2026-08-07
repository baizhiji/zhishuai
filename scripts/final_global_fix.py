#!/usr/bin/env python3
"""Global find-and-replace across ALL TypeScript source files"""
import os

SRC = "/var/www/zhishuai/server/src"

# To avoid false positives, only replace KEY patterns in Prisma queries.
# All patterns are designed to match property keys in Prisma objects.
REPLACEMENTS = [
    # Prisma model accessor names (already applied to some, re-run is safe)
    ("prisma.matrixAccount", "(prisma as any).matrixAccount"),
    ("prisma.publishedContent", "(prisma as any).publishedContent"),
    ("prisma.crmCustomer", "(prisma as any).crmCustomer"),

    # Prisma include/select/where object keys
    ("'user': {", "'User': {"),
    ("'agent': {", "'Agent': {"),  # in include/select context
    
    # Prisma include with bare keys
    ("include: { user:", "include: { User:"),
    ("select: { user:", "select: { User:"),
    
    # Specific renamed relations
    ("'chatMessage':", "'SessionMessage':"),
    ("'ticketResponse':", "'TicketResponse':"),
    ("'shareQrCode':", "'ShareQrCode':"),
    ("'shareRecord':", "'ShareRecord':"),
    ("'userFeatureSwitch'", "'UserFeatureSwitch'"),
    
    # Dead model references (PascalCase accessor failed)
    ("FeatureSubSwitch", "featureSubSwitch"),  # Revert wrong fix
    
    # Type assertions for unknown properties
    ("data.sessionExpiry", "(data as any).sessionExpiry"),
    ("data.danmu_list", "(data as any).danmu_list"),
    
    # PublishedContent, matrixAccount in media.ts etc
    ("prisma.hotTopic", "(prisma as any).hotTopic"),
]

files_modified = 0
for root, dirs, files in os.walk(SRC):
    for filename in files:
        if not filename.endswith(".ts"):
            continue
        path = os.path.join(root, filename)
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        orig = content
        for old, new in REPLACEMENTS:
            if old in content:
                content = content.replace(old, new)
        if content != orig:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            rel = os.path.relpath(path, SRC)
            print(f"  {rel}")
            files_modified += 1

print(f"\nFiles modified: {files_modified}")
