#!/usr/bin/env python3
"""Fix Prisma client model names: they should be lowercase."""

import os, re

BASE = "/var/www/zhishuai/server/src"

# Prisma model name → lowercase for prisma.X calls
# These were incorrectly capitalized by previous fix scripts
MODELS = [
    "User", "Agent", "UserFeatureSwitch", "FeatureSubSwitch",
    "ShareQrCode", "ShareRecord", "TicketResponse", "FeatureSwitch",
    "UserAgentRelation", "Ticket", "Payment", "AcquisitionTask",
    "AcquisitionLead", "AcquisitionSource", "AcquisitionData",
    "AcquisitionAutomation", "ChatMessage", "ConversationLog",
    "AdminLog", "LoginLog", "Material", "ShareCommission",
    "ApiKey", "Candidate", "RecruitmentPost", "RecruitmentApplication",
    "AgentApiConfig", "AgentFeedback", "ContentTemplate",
]

lower_to_camel = {
    "User": "user",
    "Agent": "agent",
    "UserFeatureSwitch": "userFeatureSwitch",
    "FeatureSubSwitch": "featureSubSwitch",
    "FeatureSwitch": "featureSwitch",
    "ShareQrCode": "shareQrCode",
    "ShareRecord": "shareRecord",
    "TicketResponse": "ticketResponse",
    "UserAgentRelation": "userAgentRelation",
    "Ticket": "ticket",
    "Payment": "payment",
    "AcquisitionTask": "acquisitionTask",
    "AcquisitionLead": "acquisitionLead",
    "AcquisitionSource": "acquisitionSource",
    "AcquisitionData": "acquisitionData",
    "AcquisitionAutomation": "acquisitionAutomation",
    "ChatMessage": "chatMessage",
    "ConversationLog": "conversationLog",
    "AdminLog": "adminLog",
    "LoginLog": "loginLog",
    "Material": "material",
    "ShareCommission": "shareCommission",
    "ApiKey": "apiKey",
    "Candidate": "candidate",
    "RecruitmentPost": "recruitmentPost",
    "RecruitmentApplication": "recruitmentApplication",
    "AgentApiConfig": "agentApiConfig",
    "AgentFeedback": "agentFeedback",
    "ContentTemplate": "contentTemplate",
}

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    for camel, lower in lower_to_camel.items():
        # Fix prisma.ModelName → prisma.modelname
        old = f"prisma.{camel}"
        new = f"prisma.{lower}"
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] {os.path.relpath(path, BASE)}")

def main():
    print("=== Fixing Prisma client model names to lowercase ===")
    for root, dirs, files in os.walk(BASE):
        for f in files:
            if f.endswith('.ts'):
                fix_file(os.path.join(root, f))
    print("=== Done ===")

if __name__ == "__main__":
    main()
