path = '/var/www/zhishuai/server/src/services/agent.service.ts'
with open(path) as f:
    c = f.read()
# Remove @ts-ignore
c = c.replace('    // @ts-ignore\n    return {', '    return {')
# Add as any after the map closing 
c = c.replace('    });\n  } catch', '    } as any);\n  } catch')
# Also handle case where there's no catch after
c = c.replace('    });\n}\n\n/**', '    } as any);\n}\n\n/**')
with open(path, 'w') as f:
    f.write(c)
print('fixed')
