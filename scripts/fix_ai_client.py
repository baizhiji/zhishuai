path = '/var/www/zhishuai/server/src/services/ai-client.ts'
with open(path) as f:
    c = f.read()
c = c.replace('const (model as any).id = params.model || taskAnalysis.(model as any).id;', 'const modelId = params.model || (taskAnalysis as any).modelId;')
c = c.replace('const (model as any).id = (model as any).id', 'const modelId = (model as any).id')
with open(path, 'w') as f:
    f.write(c)
print('fixed')
