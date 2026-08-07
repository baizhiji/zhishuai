line = '        action: log.status || "login",'
with open("/var/www/zhishuai/server/src/services/auth.service.ts", "r") as f:
    lines = f.readlines()
lines[483] = line + "\n"
with open("/var/www/zhishuai/server/src/services/auth.service.ts", "w") as f:
    f.writelines(lines)
print("Line 484 fixed")
