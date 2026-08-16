"""决定性实验：用 PyNaCl 验证 rust-minisign 官方预哈希 test vector"""
import base64, hashlib
from nacl.signing import VerifyKey

pub_b64 = "RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3"
sig_text = (
    "untrusted comment: signature from minisign secret key\n"
    "RUQf6LRCGA9i559r3g7V1qNyJDApGip8MfqcadIgT9CuhV3EMhHoN1mGTkUidF/"
    "z7SrlQgXdy8ofjb7bNJJylDOocrCo8KLzZwo=\n"
    "trusted comment: timestamp:1556193335\tfile:test\n"
    "y/rUw2y8/hOUYjZU71eHp/Wo1KZ40fGy2VJEDl34XMJM+TX48Ss/17u3IvIfbVR1FkZZSNCisQbuQY+bHwhEBg=="
)
lines = sig_text.splitlines()
blob = base64.b64decode(lines[1])
print("sig blob len:", len(blob), "alg:", blob[0:2], "keynum:", blob[2:10].hex())
sig = blob[10:74]
pub_blob = base64.b64decode(pub_b64)
pk = pub_blob[10:42]
print("pub alg:", pub_blob[0:2], "keynum:", pub_blob[2:10].hex())
print("keynum match:", blob[2:10] == pub_blob[2:10])

msg = b"test"
h_b2_64 = hashlib.blake2b(msg, digest_size=64).digest()
h_b2_32 = hashlib.blake2b(msg, digest_size=32).digest()
h_sha512 = hashlib.sha512(msg).digest()

def try_msg(name, m):
    try:
        VerifyKey(pk).verify(sig, m)
        print("VERIFY OK:", name)
    except Exception as e:
        print("FAIL:", name, "->", type(e).__name__)

try_msg("blake2b-512(test)", h_b2_64)
try_msg("blake2b-256(test)", h_b2_32)
try_msg("sha512(test)", h_sha512)
try_msg("raw test", msg)
