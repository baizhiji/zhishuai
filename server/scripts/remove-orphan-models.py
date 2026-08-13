# -*- coding: utf-8 -*-
"""删除 schema 中全项目零引用的孤儿模型定义(先备份)"""
import re, shutil

ORPHANS = [
    'AcquisitionAutomation', 'AgentFeedback', 'AutomationTask',
    'CodeAssistantConversation', 'CodeAssistantMessage', 'CompanyInfo',
    'ComplianceAuditLog', 'HotspotCache', 'MapFavorite', 'PlatformSyncLog',
    'PromptOptimization', 'QualityAuditLog', 'ReferralReward',
    'SupportConversation', 'SupportMessage', 'TaskExecution',
    'TaskExecutionLog', 'UserSettings',
]

path = 'prisma/schema.prisma'
shutil.copyfile(path, path + '.bak-orphans')

with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# 定位顶层 model 起始行
model_starts = []
for i, line in enumerate(lines):
    m = re.match(r'^model (\w+) \{', line)
    if m:
        model_starts.append((i, m.group(1)))

# 计算每个 model 的行范围
ranges = []
for j, (start, name) in enumerate(model_starts):
    end = model_starts[j + 1][0] if j + 1 < len(model_starts) else len(lines)
    ranges.append((start, end, name))

# 收集待删除行
to_remove = set()
removed = []
for start, end, name in ranges:
    if name in ORPHANS:
        to_remove.update(range(start, end))
        removed.append(name)

new_lines = [line for i, line in enumerate(lines) if i not in to_remove]

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print('Removed models:', len(removed))
for m in removed:
    print('  -', m)

with open(path, encoding='utf-8') as f:
    s = f.read()
print('Remaining models:', len(re.findall(r'^model \w+ \{', s, re.M)))
