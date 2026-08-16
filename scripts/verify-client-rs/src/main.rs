// 用 minisign-verify crate（与 tauri 客户端完全相同的库）验证真实 exe 签名
// 完全复刻 tauri-plugin-updater/src/updater.rs 的 verify_signature 流程：
//   1. base64_to_string(pubkey)        -> 公钥文本 -> PublicKey::decode
//   2. base64_to_string(signature)     -> 签名文本 -> Signature::decode
//   3. public_key.verify(data, sig, true)  (allow_legacy=true)
//
// 用法: verify-client <exe路径> <sig文件路径>
//   sig 文件内容是 base64 编码的 minisign 签名文本（即 tauri 配置的 signature 字段）

use std::env;
use std::fs;

// 对应 tauri.conf.json 中 updater.pubkey 的值（base64 编码的公钥文本）
const PUBKEY_B64: &str = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEIzMTBDODQ0Qzg4RkVBRDgKUldUWTZvL0lSTWdRczRMN3YwcHpoT1YxZDJvem5hNk1tZVVSdXgzaEt2ZVhDUVBNeHhrbHQwMksK";

// 零依赖 base64 解码（标准字母表 + padding）
fn b64_decode(s: &str) -> Result<Vec<u8>, String> {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut lut = [255u8; 256];
    for (i, &c) in TABLE.iter().enumerate() {
        lut[c as usize] = i as u8;
    }
    let s = s.trim();
    let mut out: Vec<u8> = Vec::new();
    let mut acc: u32 = 0;
    let mut nbits: u32 = 0;
    for &c in s.as_bytes() {
        if c == b'=' {
            break;
        }
        let v = lut[c as usize];
        if v == 255 {
            return Err(format!("invalid base64 char: {}", c as char));
        }
        acc = (acc << 6) | v as u32;
        nbits += 6;
        if nbits >= 8 {
            nbits -= 8;
            out.push((acc >> nbits) as u8);
        }
    }
    Ok(out)
}

fn base64_to_string(b64: &str) -> Result<String, String> {
    let bytes = b64_decode(b64)?;
    String::from_utf8(bytes).map_err(|e| format!("utf8 error: {}", e))
}

// 官方向量自检：minisign-verify tests.rs 中的 verify_prehashed 向量
// 若此测试通过而真实签名失败 -> 库正常，签名本身有问题
// 若此测试也失败 -> 说明库或环境有问题
fn self_test() -> Result<(), String> {
    use minisign_verify::PublicKey;
    use minisign_verify::Signature;

    let public_key = PublicKey::from_base64("RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3")
        .map_err(|e| format!("selftest pubkey decode: {}", e))?;
    let signature = Signature::decode(
        "untrusted comment: signature from minisign secret key
RUQf6LRCGA9i559r3g7V1qNyJDApGip8MfqcadIgT9CuhV3EMhHoN1mGTkUidF/z7SrlQgXdy8ofjb7bNJJylDOocrCo8KLzZwo=
trusted comment: timestamp:1556193335\tfile:test
y/rUw2y8/hOUYjZU71eHp/Wo1KZ40fGy2VJEDl34XMJM+TX48Ss/17u3IvIfbVR1FkZZSNCisQbuQY+bHwhEBg==",
    )
    .map_err(|e| format!("selftest sig decode: {}", e))?;
    let bin = b"test";
    public_key
        .verify(&bin[..], &signature, false)
        .map_err(|e| format!("selftest verify: {}", e))?;
    println!("[SELF-TEST] official minisign vector verified OK");
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("usage: verify-client <exe_path> <sig_file>");
        std::process::exit(2);
    }
    let exe_path = &args[1];
    let sig_path = &args[2];

    // 0. 自检库本身工作正常
    if let Err(e) = self_test() {
        eprintln!("[SELF-TEST] FAILED: {} -> 库或环境有问题，结果不可信", e);
        std::process::exit(3);
    }

    // 1. 解码公钥（与 tauri verify_signature 完全一致）
    let pub_key_decoded = match base64_to_string(PUBKEY_B64) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[1] pubkey base64 decode FAILED: {}", e);
            std::process::exit(1);
        }
    };
    println!("[1] decoded pubkey text:\n{}\n", pub_key_decoded);
    let public_key = match minisign_verify::PublicKey::decode(&pub_key_decoded) {
        Ok(pk) => {
            println!("[2] public key parsed OK");
            pk
        }
        Err(e) => {
            eprintln!("[2] public key decode FAILED: {}", e);
            std::process::exit(1);
        }
    };

    // 2. 读取签名文件（base64 文本）并解码
    let sig_b64 = match fs::read_to_string(sig_path) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[3] cannot read sig file {}: {}", sig_path, e);
            std::process::exit(1);
        }
    };
    let signature_decoded = match base64_to_string(&sig_b64) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[3] sig base64 decode FAILED: {}", e);
            std::process::exit(1);
        }
    };
    println!("[3] decoded signature text:\n{}\n", signature_decoded);
    let signature = match minisign_verify::Signature::decode(&signature_decoded) {
        Ok(sig) => {
            println!("[4] signature parsed OK");
            println!("[4] trusted comment: {}", sig.trusted_comment());
            println!("[4] untrusted comment: {}", sig.untrusted_comment());
            sig
        }
        Err(e) => {
            eprintln!("[4] signature decode FAILED: {}", e);
            std::process::exit(1);
        }
    };

    // 3. 读取 exe 字节
    let data = match fs::read(exe_path) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("[5] cannot read exe {}: {}", exe_path, e);
            std::process::exit(1);
        }
    };
    println!("[5] read {} bytes from {}", data.len(), exe_path);

    // 4. 验证（tauri 传 allow_legacy=true）
    match public_key.verify(&data, &signature, true) {
        Ok(()) => {
            println!("==================================================");
            println!("  SIGNATURE VERIFIED OK - 签名真实有效");
            println!("  该 exe 可用 tauri 客户端公钥验证通过");
            println!("==================================================");
            std::process::exit(0);
        }
        Err(e) => {
            eprintln!("==================================================");
            eprintln!("  SIGNATURE VERIFICATION FAILED: {}", e);
            eprintln!("  签名无效或与 exe/公钥不匹配");
            eprintln!("==================================================");
            std::process::exit(1);
        }
    }
}
