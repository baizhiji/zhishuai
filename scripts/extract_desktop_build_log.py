# -*- coding: utf-8 -*-
import zipfile

zip_path = "C:/Users/Administrator/Downloads/ci_logs.zip"
out_path = "C:/Users/Administrator/Downloads/desktop_build_log_extract.txt"
with zipfile.ZipFile(zip_path, 'r') as z:
    target = None
    for name in z.namelist():
        if "Desktop Build (Windows Installer)" in name and name.endswith('.txt'):
            target = name
            break
    if not target:
        print("Desktop build log not found")
        exit(1)
    content = z.read(target).decode('utf-8', errors='replace')
    lines = content.split('\n')
    out = [f"{i}: {line[:500]}" for i, line in enumerate(lines) if 348 <= i <= 420]
    open(out_path, 'w', encoding='utf-8').write('\n'.join(out))
    print(f"Wrote {len(out)} lines to {out_path}")
