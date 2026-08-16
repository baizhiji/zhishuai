#!/usr/bin/env python3
"""tauri 桌面更新签名真实性验证（rust-minisign prehashed "ED" 格式）

算法依据（rust-minisign src/lib.rs + src/crypto/ed25519.rs）：
- 签名文本 = rust-minisign SignatureBox: [untrusted comment, sig_blob(74B b64), trusted comment, global_sig(64B b64)]
- sig_blob = "ED"(预哈希算法标识, 2B) + keynum(8B) + sig(64B)
- 主签名消息 = BLAKE2b-512(文件内容)，64 字节，直接作为 Ed25519 消息
- 验证 = 标准 Ed25519 验证方程 R == S*B - h*A
- 全局签名消息 = sig(64B) + "timestamp:..\tfile:.."（trusted comment 去除前缀后 trim）

用法: python3 verify-tauri-sig.py <sig-file> <file> <pubkey-b64>
"""
import sys, base64, hashlib

# ---------------------------------------------------------------- 纯Python Ed25519 verify（备用）
p = 2**255 - 19
L = 2**252 + 27742317777372353535851937790883648493
d = (-121665 * pow(121666, p - 2, p)) % p
I = pow(2, (p - 1) // 4, p)
B_y = 46316835694926478169428394003475163141307993866256225615783033603165251855960
B_x = 15112221349535400772501151409588531511454012693041857206046113283949847762202
B = (B_x, B_y)

def inv(x):
    return pow(x % p, p - 2, p)

def xrecover(y):
    xx = (y * y - 1) * inv(d * y * y + 1)
    x = pow(xx, (p + 3) // 8, p)
    if (x * x - xx) % p != 0:
        x = (x * I) % p
    if x % 2 != 0:
        x = p - x
    return x

def ed_add(P, Q):
    x1, y1 = P; x2, y2 = Q
    t = d * x1 * x2 * y1 * y2
    x3 = (x1 * y2 + x2 * y1) * inv(1 + t)
    y3 = (y1 * y2 + x1 * x2) * inv(1 - t)
    return (x3 % p, y3 % p)

def scalarmult(P, e):
    if e == 0:
        return (0, 1)
    Q = scalarmult(P, e // 2)
    Q = ed_add(Q, Q)
    if e & 1:
        Q = ed_add(Q, P)
    return Q

def _decode_point(s):
    """解码 32 字节 Ed25519 点编码 -> (x, y)"""
    y = int.from_bytes(s, "little") & ((1 << 255) - 1)
    sign = (s[31] >> 7) & 1
    x = xrecover(y)
    if (x & 1) != sign:
        x = p - x
    return (x % p, y % p)

def ed25519_verify_pp(sig, msg, pk):
    R = sig[0:32]; S = sig[32:64]
    if int.from_bytes(S, "little") >= L:
        return False
    try:
        A = _decode_point(pk)
        A_neg = (p - A[0], A[1])
        R_pt = _decode_point(R)
    except Exception:
        return False
    h = int.from_bytes(hashlib.sha512(R + pk + msg).digest(), "little") % L
    lhs = ed_add(scalarmult(A_neg, h), scalarmult(B, int.from_bytes(S, "little")))
    return (lhs[0] % p, lhs[1] % p) == R_pt

def self_test_purepy():
    # RFC 8032 Ed25519 TEST 1 (msg="")
    pk = bytes.fromhex("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a")
    sig = bytes.fromhex("e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e0652249015555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100")
    try:
        return ed25519_verify_pp(sig, b"", pk)
    except Exception:
        return False

# ---------------------------------------------------------------- 解析
def parse_sig(sig_file_bytes):
    text = base64.b64decode(sig_file_bytes.strip()).decode("utf8")
    lines = [l for l in text.splitlines() if l.strip()]
    assert lines[0].startswith("untrusted comment"), "L0 not untrusted comment: " + lines[0]
    blob = base64.b64decode(lines[1])
    idx = 1
    if len(blob) == 42:  # 公钥行存在（minisign 标准格式）→ 下移
        blob = base64.b64decode(lines[2])
        idx = 2
    assert len(blob) == 74, "sig blob len=%d" % len(blob)
    sig_alg, keynum, sig = blob[0:2], blob[2:10], blob[10:74]
    tc = None; gsig = None
    if len(lines) > idx + 1 and lines[idx + 1].startswith("trusted comment: "):
        tc = lines[idx + 1][len("trusted comment: "):].strip()
        if len(lines) > idx + 2:
            gsig = base64.b64decode(lines[idx + 2])
    return {"text": text, "sig_alg": sig_alg, "keynum": keynum, "sig": sig, "tc": tc, "gsig": gsig}

def get_pk(pub_b64):
    blob = base64.b64decode(pub_b64)
    assert len(blob) == 42, "pub blob len=%d" % len(blob)
    return blob[10:42], blob[2:10]

def main():
    if len(sys.argv) < 4:
        print("usage: verify-tauri-sig.py <sig-file> <file> <pubkey-b64>")
        return 2
    sig_path, exe_path, pub_b64 = sys.argv[1], sys.argv[2], sys.argv[3]

    parsed = parse_sig(open(sig_path, "rb").read())
    pk, pub_keynum = get_pk(pub_b64)
    print("sig_alg:", parsed["sig_alg"].decode("latin1"), "is_prehashed:", parsed["sig_alg"] == b"ED")
    print("keynum match:", parsed["keynum"] == pub_keynum, parsed["keynum"].hex(), pub_keynum.hex())
    print("trusted comment:", parsed["tc"])

    data = open(exe_path, "rb").read()
    h = hashlib.blake2b(data, digest_size=64).digest()
    print("file bytes:", len(data))
    print("sha256:", hashlib.sha256(data).hexdigest())
    print("blake2b-512:", h.hex())

    # 主签名验证：Ed25519 over BLAKE2b-512(file)
    ok = False; backend = None
    try:
        from nacl.signing import VerifyKey
        VerifyKey(pk).verify(parsed["sig"], h)
        ok, backend = True, "PyNaCl"
    except Exception as e1:
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
            Ed25519PublicKey.from_public_bytes(pk).verify(parsed["sig"], h)
            ok, backend = True, "cryptography"
        except Exception as e2:
            if self_test_purepy():
                try:
                    if ed25519_verify_pp(parsed["sig"], h, pk):
                        ok, backend = True, "pure-python"
                    else:
                        print("pure-python: verify rejected")
                except Exception as e3:
                    print("pure-python error:", e3)
            else:
                print("pure-python self-test FAILED, skipping fallback")
    print("MAIN SIGNATURE VERIFY:", "OK via " + backend if ok else "FAILED")

    # 全局签名验证：Ed25519 over sig(64) + trusted_comment
    if parsed["gsig"] is not None and parsed["tc"] is not None:
        gmsg = parsed["sig"] + parsed["tc"].encode("utf8")
        gok = False
        try:
            from nacl.signing import VerifyKey
            VerifyKey(pk).verify(parsed["gsig"], gmsg)
            gok = True
        except Exception:
            try:
                from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
                Ed25519PublicKey.from_public_bytes(pk).verify(parsed["gsig"], gmsg)
                gok = True
            except Exception:
                pass
        print("GLOBAL SIGNATURE VERIFY:", "OK" if gok else "FAILED")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
