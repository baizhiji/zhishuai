# -*- coding: utf-8 -*-
import os, hashlib, sys
base = sys.argv[1] if len(sys.argv) > 1 else 'C:/Users/Administrator/Downloads/zhishuai_installer_extracted2'
for f in os.listdir(base):
    p = os.path.join(base, f)
    if os.path.isfile(p):
        print(f, hashlib.sha256(open(p, 'rb').read()).hexdigest())
