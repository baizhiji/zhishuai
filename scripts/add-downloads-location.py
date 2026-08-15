import sys

path = '/etc/nginx/sites-available/baizhiji.net'
if len(sys.argv) > 1:
    path = sys.argv[1]

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

block = '''    # 桌面安装包下载目录
    location /downloads/ {
        alias /var/www/zhishuai/downloads/;
        autoindex on;
        autoindex_exact_size off;
        autoindex_localtime on;
        add_header Cache-Control "public, max-age=3600";
        add_header Content-Disposition "attachment";

        location ~* \\.(exe|msi)$ {
            add_header Cache-Control "public, max-age=86400";
            add_header Content-Disposition "attachment";
        }

        location = /downloads/latest.json {
            add_header Access-Control-Allow-Origin *;
            add_header Cache-Control "no-cache";
        }
    }
'''

# 只在 HTTPS 的 server 块（第一个 "=== API 路由" 注释）前插入，避免污染 api 子域名块
anchor = '    # === API 路由 (含限流) ==='
if anchor not in content:
    raise SystemExit('未找到 "=== API 路由 (含限流) ===" 锚点，请手动检查 nginx 配置')

if 'location /downloads/' in content:
    print('/downloads/ location 已存在，跳过插入')
else:
    content = content.replace(anchor, block + anchor, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('已插入 /downloads/ location')
