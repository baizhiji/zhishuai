#!/usr/bin/env python3
"""用新公钥验证安装包 minisign 签名真实性"""
import sys
import minisign

PUBKEY = """untrusted comment: minisign public key: B310C844C88FEAD8
RWTY6o/IRMgQs4L7v0phzOV1d2ozna6MmeURux3hKveXCQPMxxklt02K
"""

def main():
    pub_path = "/tmp/zhishuai.pub"
    with open(pub_path, "w") as f:
        f.write(PUBKEY)
    k = minisign.PublicKey(pub_path)
    sig_path = "/var/www/zhishuai/downloads/zhishuai_3.0.0_x64-setup.exe.sig"
    file_path = "/var/www/zhishuai/downloads/智枢AI_3.0.0_x64-setup.exe"
    sig = minisign.Signature.from_file(sig_path)
    ok = k.verify(sig, file_path)
    print("SIGNATURE VERIFY:", "OK" if ok else "FAILED")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
