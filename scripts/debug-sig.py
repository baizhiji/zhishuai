"""调试：字节级检查 tauri 签名，尝试多种消息组合验证"""
import sys, base64, hashlib

sig_path = sys.argv[1]
exe_path = sys.argv[2]
pub_b64 = sys.argv[3]

def parse_sig(raw):
    text = base64.b64decode(raw.strip()).decode("utf8")
    lines = [l for l in text.splitlines() if l.strip()]
    blob = base64.b64decode(lines[1])
    return text, blob

text, blob = parse_sig(open(sig_path, "rb").read())
print("sig blob len:", len(blob), "hex:", blob.hex())
sig = blob[10:74]
keynum = blob[2:10]
print("sig_alg:", blob[0:2], "keynum:", keynum.hex())
print("sig:", sig.hex())

pub_blob = base64.b64decode(pub_b64)
print("pub blob len:", len(pub_blob), "hex:", pub_blob.hex())
pk = pub_blob[10:42]
pub_keynum = pub_blob[2:10]
print("pk:", pk.hex())

data = open(exe_path, "rb").read()
print("file len:", len(data))

h_b2 = hashlib.blake2b(data, digest_size=64).digest()
h_b2_32 = hashlib.blake2b(data, digest_size=32).digest()
h_sha512 = hashlib.sha512(data).digest()
h_sha256 = hashlib.sha256(data).digest()

try:
    from nacl.signing import VerifyKey
    def try_msg(name, msg):
        try:
            VerifyKey(pk).verify(sig, msg)
            print("VERIFY OK:", name)
        except Exception as e:
            print("FAIL:", name, "->", type(e).__name__)
except ImportError:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    def try_msg(name, msg):
        try:
            Ed25519PublicKey.from_public_bytes(pk).verify(sig, msg)
            print("VERIFY OK:", name)
        except Exception as e:
            print("FAIL:", name, "->", type(e).__name__)

try_msg("blake2b-512(file)", h_b2)
try_msg("blake2b-256(file)", h_b2_32)
try_msg("sha512(file)", h_sha512)
try_msg("sha256(file)", h_sha256)
try_msg("ED||keynum||blake2b512", b"ED" + keynum + h_b2)
try_msg("Ed||keynum||blake2b512", b"Ed" + keynum + h_b2)
try_msg("keynum||blake2b512", keynum + h_b2)
try_msg("blake2b512||keynum", h_b2 + keynum)
try_msg("blake2b512||pk", h_b2 + pk)
try_msg("raw file", data)
try_msg("blake2b512(file+pk)", hashlib.blake2b(data + pk, digest_size=64).digest())
try_msg("blake2b512(pk+file)", hashlib.blake2b(pk + data, digest_size=64).digest())
