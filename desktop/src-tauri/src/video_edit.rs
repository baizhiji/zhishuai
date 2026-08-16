//! 智枢AI 桌面版 — 智能剪辑 FFmpeg 合成工作台
//!
//! 职责（蓝皮书 §4.1 智能剪辑产线第 8 阶段）：
//! 1. AI 在云端完成脚本/剪辑点/镜头编排/字幕/BGM/调色指令
//! 2. 本模块在本地执行 FFmpeg 合成：素材归一化 → 拼接/转场 → 调色 →
//!    混入 BGM → 烧录字幕 → 输出成片（素材与成片均不出本机）
//! 3. 不消耗任何视频生成配额（本地合成）

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::{Command, Stdio};

/// FFmpeg 合成请求体（前端 IPC 传入）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposePayload {
    /// 素材绝对路径列表（多段，需已存在）
    pub input_files: Vec<String>,
    /// 目标时长（秒，可选；默认按素材总时长）
    pub target_duration: Option<f64>,
    /// 分辨率（可选；不传则按第一段素材原始分辨率）
    pub width: Option<u32>,
    pub height: Option<u32>,
    /// 帧率（可选；默认 30）
    pub fps: Option<u32>,
    /// 调色滤镜（FFmpeg filter 字符串，如 "colorbalance=rs=.1:gs=.05:bs=-.1,eq=contrast=1.1"）
    pub color_filter: Option<String>,
    /// BGM 文件绝对路径（可选；本地混音，音量 0.25）
    pub bgm_path: Option<String>,
    /// SRT 字幕文件绝对路径（可选；本地烧录）
    pub subtitle_path: Option<String>,
    /// 输出文件绝对路径（如 D:\clips\output.mp4）
    pub output_path: String,
    /// 转场类型（可选；none/交叉淡化，默认 none）
    pub transition: Option<String>,
}

/// FFmpeg 合成结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComposeResult {
    pub success: bool,
    pub output_path: Option<String>,
    pub duration: Option<f64>,
    pub message: String,
    pub log: String,
}

impl ComposeResult {
    fn ok(output: String, duration: f64, log: String) -> Self {
        Self {
            success: true,
            output_path: Some(output),
            duration: Some(duration),
            message: "合成完成".to_string(),
            log,
        }
    }

    fn err(message: impl Into<String>, log: String) -> Self {
        Self {
            success: false,
            output_path: None,
            duration: None,
            message: message.into(),
            log,
        }
    }
}

/// 检查 FFmpeg 是否可用（IPC：video_edit_probe）
#[tauri::command]
pub async fn video_edit_probe() -> Result<serde_json::Value, String> {
    let path = which_ffmpeg();
    let Ok(ffmpeg) = path else {
        return Ok(serde_json::json!({
            "available": false,
            "message": "未检测到 FFmpeg。请安装 FFmpeg 并加入系统 PATH（下载: https://www.gyan.dev/ffmpeg/builds/）",
        }));
    };

    let output = Command::new(&ffmpeg)
        .arg("-version")
        .output()
        .map_err(|e| format!("执行 ffmpeg -version 失败: {e}"))?;
    let version = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .unwrap_or("ffmpeg version unknown")
        .to_string();

    Ok(serde_json::json!({
        "available": true,
        "path": ffmpeg,
        "version": version,
    }))
}

/// 定位 ffmpeg 可执行文件（优先 PATH，其次常见安装路径）
fn which_ffmpeg() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let candidates = [
            "ffmpeg.exe".to_string(),
            "C:\\ffmpeg\\bin\\ffmpeg.exe".to_string(),
            "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe".to_string(),
            dirs::home_dir()
                .map(|h| h.join("ffmpeg\\bin\\ffmpeg.exe").to_string_lossy().to_string())
                .unwrap_or_default(),
        ];
        for c in candidates.iter().filter(|c| !c.is_empty()) {
            if Path::new(c).is_file() {
                return Ok(c.clone());
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        if Path::new("/usr/bin/ffmpeg").is_file() {
            return Ok("/usr/bin/ffmpeg".to_string());
        }
        if Path::new("/usr/local/bin/ffmpeg").is_file() {
            return Ok("/usr/local/bin/ffmpeg".to_string());
        }
    }
    // PATH 兜底
    let output = Command::new(if cfg!(target_os = "windows") { "where" } else { "which" })
        .arg(if cfg!(target_os = "windows") { "ffmpeg" } else { "ffmpeg" })
        .output()
        .map_err(|e| format!("无法定位 ffmpeg: {e}"))?;
    if output.status.success() {
        let first = String::from_utf8_lossy(&output.stdout)
            .lines()
            .next()
            .unwrap_or_default()
            .trim()
            .to_string();
        if !first.is_empty() {
            return Ok(first);
        }
    }
    Err("未找到 ffmpeg 可执行文件".to_string())
}

/// SRT 文件转为 FFmpeg subtitles 滤镜可用的转义路径
fn escape_filter_path(path: &str) -> String {
    // FFmpeg filter 参数中：反斜杠转义为 \\，冒号转义为 \:
    path.replace('\\', "\\\\").replace(':', "\\:")
}

/// FFmpeg 合成主命令（IPC：video_edit_compose）
///
/// 流程：素材归一化（scale/pad/fps）→ concat 拼接 → 调色 → BGM 混音 →
/// 字幕烧录 → libx264 输出成片
#[tauri::command]
pub async fn video_edit_compose(payload: ComposePayload) -> Result<ComposeResult, String> {
    // 校验输入
    if payload.input_files.is_empty() {
        return Ok(ComposeResult::err("未提供任何视频素材", String::new()));
    }
    for f in &payload.input_files {
        if !Path::new(f).is_file() {
            return Ok(ComposeResult::err(
                format!("素材文件不存在: {f}"),
                String::new(),
            ));
        }
    }
    let out_dir = Path::new(&payload.output_path)
        .parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| "输出路径无效".to_string())?;
    if !out_dir.is_dir() {
        return Ok(ComposeResult::err(
            format!("输出目录不存在: {}", out_dir.display()),
            String::new(),
        ));
    }

    let ffmpeg = which_ffmpeg()?;
    let n = payload.input_files.len();

    // 目标分辨率：默认 1080x1920（竖屏短视频），可被覆盖
    let (width, height) = match (payload.width, payload.height) {
        (Some(w), Some(h)) if w > 0 && h > 0 => (w, h),
        _ => (1080, 1920),
    };
    let fps = payload.fps.unwrap_or(30).clamp(15, 60);

    // 构建 filter_complex：每段素材归一化后 concat
    // 例（3段）：
    // [0:v]trim=...,scale=1080:1920:force_original_aspect_ratio=decrease,
    //      pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,setsar=1,setpts=PTS-STARTPTS[v0];
    // [1:v]...[v1];[2:v]...[v2];
    // [v0][v1][v2]concat=n=3:v=1:a=0[vcat];
    // 音频：拼接各素材音轨（前提：素材均含音轨；无音轨素材需先转码加轨）
    let mut filters = Vec::new();
    let mut vlabels = Vec::new();
    let mut alabels = Vec::new();

    for (i, _f) in payload.input_files.iter().enumerate() {
        let scale_pad = format!(
            "scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2"
        );
        // 视频链
        let vf = format!(
            "[{i}:v:0]trim=start=0:duration=,setpts=PTS-STARTPTS,{scale_pad},fps={fps},setsar=1[v{i}];"
        );
        filters.push(vf);
        vlabels.push(format!("[v{i}]"));
        // 音频链（trim + 采样率统一）
        let af = format!(
            "[{i}:a:0]atrim=start=0:duration=,asetpts=PTS-STARTPTS,aresample=44100[a{i}];"
        );
        filters.push(af);
        alabels.push(format!("[a{i}]"));
    }

    let vconcat = format!("{}concat=n={n}:v=1:a=0[vcat];", vlabels.join(""));
    filters.push(vconcat);

    let aconcat = format!("{}concat=n={n}:v=0:a=1,apad[aout];", alabels.join(""));
    filters.push(aconcat);

    // 调色滤镜
    let color_filter = payload
        .color_filter
        .clone()
        .filter(|f| !f.trim().is_empty())
        .map(|f| format!("[vcat]{f}[vcolor];"))
        .unwrap_or_default();
    let has_color_filter = !color_filter.is_empty();
    if has_color_filter {
        filters.push(color_filter);
    }
    let vmain = if has_color_filter { "[vcolor]" } else { "[vcat]" };

    // BGM 混音（本地文件，循环播放，音量 0.25）
    let mut bgm_filter = String::new();
    let mut final_audio = "[aout]".to_string();
    let bgm_exists = payload
        .bgm_path
        .as_ref()
        .map(|p| Path::new(p.as_str()).is_file())
        .unwrap_or(false);
    if bgm_exists {
        let bgm = payload.bgm_path.as_ref().expect("bgm_path 已校验非空");
        let bgm_esc = escape_filter_path(bgm.as_str());
        bgm_filter = format!(
            "[{n}:a:0]volume=0.25,aloop=loop=-1:size=2e9,atrim=start=0:duration=,asetpts=PTS-STARTPTS[bgm];[aout][bgm]amix=inputs=2:duration=first:dropout_transition=2,apad[aoutmix];"
        );
        filters.push(bgm_filter);
        final_audio = "[aoutmix]".to_string();
    }

    // 字幕烧录
    let mut sub_filter = String::new();
    let mut vfinal = vmain.to_string();
    if let Some(srt) = payload.subtitle_path.filter(|p| Path::new(p).is_file()) {
        let srt_esc = escape_filter_path(&srt);
        sub_filter = format!(
            "{vfinal}subtitles='{srt_esc}':force_style='FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=1,Alignment=2,MarginV=40'[vsub];"
        );
        filters.push(sub_filter);
        vfinal = "[vsub]".to_string();
    }

    let filter_complex = filters.join("");
    let map_v = vfinal;
    let map_a = final_audio;

    // 组装命令：多输入 + filter_complex + 双流输出
    let mut cmd = Command::new(&ffmpeg);
    cmd.arg("-y")
        .args(["-hide_banner", "-loglevel", "error"]);
    for f in &payload.input_files {
        cmd.arg("-i").arg(f);
    }
    if bgm_exists {
        let bgm = payload.bgm_path.as_ref().expect("bgm_path 已校验非空");
        cmd.arg("-i").arg(bgm.as_str());
    }
    cmd.arg("-filter_complex").arg(&filter_complex)
        .arg("-map").arg(map_v)
        .arg("-map").arg(map_a)
        .args([
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-c:a", "aac", "-b:a", "192k", "-shortest",
            "-movflags", "+faststart",
        ])
        .arg(&payload.output_path)
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    // 后台执行：ffmpeg 可能耗时较长，用 spawn_blocking 避免阻塞主进程
    let (ffmpeg_bin, output_path) = (ffmpeg.clone(), payload.output_path.clone());
    let result = tokio::task::spawn_blocking(move || -> Result<ComposeResult, String> {
        let child = cmd
            .spawn()
            .map_err(|e| format!("启动 FFmpeg 失败（{ffmpeg_bin}）: {e}"))?;
        let output = child.wait_with_output().map_err(|e| format!("等待 FFmpeg 失败: {e}"))?;
        let log = String::from_utf8_lossy(&output.stderr).to_string();
        if !output.status.success() {
            return Ok(ComposeResult::err(
                format!("FFmpeg 合成失败（exit {:?}）", output.status.code()),
                log,
            ));
        }
        let duration = probe_duration(&ffmpeg_bin, &output_path);
        Ok(ComposeResult::ok(output_path, duration.unwrap_or(0.0), log))
    })
    .await
    .map_err(|e| format!("合成任务异常: {e}"))?;

    result
}

/// 用 ffprobe 探测成片时长
fn probe_duration(ffmpeg_bin: &str, path: &str) -> Option<f64> {
    let probe = if cfg!(target_os = "windows") {
        ffmpeg_bin.replace("ffmpeg", "ffprobe")
    } else {
        "ffprobe".to_string()
    };
    let output = Command::new(&probe)
        .args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()?
        .trim()
        .parse::<f64>()
        .ok()
}
