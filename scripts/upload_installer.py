# -*- coding: utf-8 -*-
import os
import subprocess
import hashlib

src_dir = 'C:/Users/Administrator/Downloads/zhishuai_installer_extracted2'
files = os.listdir(src_dir)
setup_file = [f for f in files if f.endswith('-setup.exe')][0]
src_path = os.path.join(src_dir, setup_file)
temp_local = 'C:/Users/Administrator/Downloads/new_setup.exe'

# Copy to temp english path
with open(src_path, 'rb') as fsrc:
    data = fsrc.read()
with open(temp_local, 'wb') as fdst:
    fdst.write(data)
print(f"Copied {setup_file} -> {temp_local} ({len(data)} bytes)")
print(f"SHA256: {hashlib.sha256(data).hexdigest()}")

# Upload to server temp path
key = os.path.expandvars(r'%USERPROFILE%\.ssh\id_rsa')
cmd = [
    'scp',
    '-i', key,
    '-o', 'StrictHostKeyChecking=no',
    temp_local,
    'ubuntu@150.109.60.130:/tmp/new_setup.exe'
]
print("Running:", ' '.join(cmd))
result = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)
