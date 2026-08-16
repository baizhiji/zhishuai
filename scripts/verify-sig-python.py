#!/usr/bin/env python3
"""用 PyNaCl + blake3 手动验证 rsign/tauri 签名真实性
用法: python verify-sig-python.py <文件> <签名文件(base64格式, tauri signer输出)>
"""
import base64
import hashlib
import sys

from nacl.signing import VerifyKey

PUB_B64 = "RWTY6o/IRMgQs4L7v0phzOV1d2ozna6MmeURux3hKveXCQPMxxklt02K"


def main():
    if len(sys.argv) < 3:
        print("usage: verify-sig-python.py <file> <sig-file>")
        return 2
    exe_path = sys.argv[1]
    sig_path = sys.argv[2]

    # 签名文件整体是 base64，解码得到标准 minisign/rsign 签名文本
    sig_b64_all = open(sig_path, "rb").read().decode("utf8").strip()
    sig_text = base64.b64decode(sig_b64_all).decode("utf8")
    lines = [l for l in sig_text.splitlines() if l.strip()]
    sig_b64 = lines[1].strip()  # 第二行是签名 blob base64
    print("sig text lines:", len(lines))

    pub_blob = base64.b64decode(PUB_B64)
    # 标准 minisign 公钥: 'ED'(2) + keyid(8) + pubkey(32) = 42 bytes
    pubkey = pub_blob[10:42]

    sig_blob = base64.b64decode(sig_b64)
    # 标准签名 blob: 'ED'(2) + keyid(8) + sig(64) = 74 bytes
    if len(sig_blob) != 74:
        print("unexpected sig blob len:", len(sig_blob))
        return 3
    sig = sig_blob[10:74]
    sig_keyid = sig_blob[2:10]
    pub_keyid = pub_blob[2:10]
    print("sig blob len:", len(sig_blob), "pub blob len:", len(pub_blob))
    print("keyid match:", sig_keyid == pub_keyid, sig_keyid.hex(), pub_keyid.hex())

    msg = open(exe_path, "rb").read()
    print("file bytes:", len(msg))

    vk = VerifyKey(pubkey)

    import blake3
    h3 = blake3.blake3(msg).digest()
    try:
        vk.verify(h3, sig)
        print("VERIFY blake3(file) -> Ed25519: OK")
    except Exception as e:
        print("VERIFY blake3(file) -> Ed25519: FAILED ->", e)

    # 尝试对 base64(整个签名文件) 的原始内容验证（一些实现签的是文件内容）
    try:
        vk.verify(msg, sig)
        print("VERIFY raw(file): OK")
    except Exception as e:
        print("VERIFY raw(file): FAILED ->", e)

    # 尝试 blake2b-512
    h2 = hashlib.blake2b(msg, digest_size=64).digest()
    try:
        vk.verify(h2, sig)
        print("VERIFY blake2b-512(file): OK")
    except Exception as e:
        print("VERIFY blake2b-512(file): FAILED ->", e)


if __name__ == "__main__":
    sys.exit(main())
