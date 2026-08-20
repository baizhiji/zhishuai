# -*- coding: utf-8 -*-
"""Generate production-ready app icons for 智枢AI (Scheme B).

Strategy:
- Large  (>=144px): vertical layout   "智枢 / AI"
- Medium (48~128px): horizontal layout "智枢AI" side by side
- Small  (<48px):    single "智" glyph

Outputs:
- desktop/src-tauri/icons/*           Windows / Tauri icons
- desktop/src-tauri/icons/android/*   Android mipmap icons
- apk/assets/icon.png                 Expo main icon
- apk/assets/adaptive-icon.png        Expo adaptive foreground
- docs/logo-designs/app-icons/*       preview assets
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "c:/Users/Administrator/zhishuai"
FONT_PATH = "C:/Windows/Fonts/simhei.ttf"

# 方案 B 配色
COLORS = {
    "bg_top": "#4C1D95",
    "bg_bottom": "#2563EB",
    "ai": "#22D3EE",
    "white": "#FFFFFF",
}


def hex_to_rgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def interpolate_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def linear_gradient(size, c1, c2):
    w, h = size
    img = Image.new("RGB", (w, h))
    pixels = img.load()
    c1 = hex_to_rgb(c1)
    c2 = hex_to_rgb(c2)
    for y in range(h):
        for x in range(w):
            t = (x + y) / max(w + h - 2, 1)
            pixels[x, y] = interpolate_color(c1, c2, t)
    return img


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def load_font(size):
    try:
        return ImageFont.truetype(FONT_PATH, max(1, int(size)))
    except Exception:
        return ImageFont.load_default()


def create_base_canvas(size, corner_ratio=0.22, transparent=False):
    """Create a square canvas. If transparent, background is empty; otherwise gradient + rounded corners."""
    if transparent:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg = linear_gradient((size, size), COLORS["bg_top"], COLORS["bg_bottom"])
    radius = int(size * corner_ratio)
    mask = rounded_mask((size, size), radius)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), mask)
    return canvas


def draw_nodes(draw, size, alpha=50):
    """Subtle neural-node decorations, kept away from rounded corners."""
    node_color = (255, 255, 255, alpha)
    nodes = [
        (size * 0.25, size * 0.30), (size * 0.35, size * 0.25),
        (size * 0.70, size * 0.28), (size * 0.75, size * 0.45),
        (size * 0.65, size * 0.70), (size * 0.30, size * 0.75),
    ]
    r_node = int(size * 0.012)
    for i, (nx, ny) in enumerate(nodes):
        draw.ellipse([nx - r_node, ny - r_node, nx + r_node, ny + r_node], fill=node_color)
        if i < len(nodes) - 1:
            nx2, ny2 = nodes[i + 1]
            draw.line([(nx, ny), (nx2, ny2)], fill=node_color, width=int(size * 0.004))


def draw_text_with_fallback(draw, xy, text, font_size, fill, anchor="mm"):
    font = load_font(font_size)
    draw.text(xy, text, font=font, fill=fill, anchor=anchor)
    return font


def create_vertical(size, transparent=False, safe_scale=1.0):
    """智枢 (top) + AI (bottom). Content kept inside the rounded-corner safe area."""
    s = int(size / safe_scale)
    canvas = create_base_canvas(s, transparent=transparent)
    draw = ImageDraw.Draw(canvas)
    if not transparent:
        draw_nodes(draw, s, alpha=50)

    # 智枢 top: smaller and moved inward so strokes never touch rounded corners
    fs_zhishu = int(s * 0.24)
    y_zhishu = int(s * 0.35)
    draw_text_with_fallback(draw, (s / 2, y_zhishu), "智枢", fs_zhishu, COLORS["white"], anchor="mm")

    # AI bottom
    fs_ai = int(s * 0.34)
    y_ai = int(s * 0.65)
    draw_text_with_fallback(draw, (s / 2, y_ai), "AI", fs_ai, COLORS["ai"], anchor="mm")

    if abs(safe_scale - 1.0) < 1e-6:
        return canvas
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def create_horizontal(size, transparent=False, safe_scale=1.0):
    """智枢AI side by side, max width usage."""
    s = int(size / safe_scale)
    canvas = create_base_canvas(s, transparent=transparent)
    draw = ImageDraw.Draw(canvas)
    if not transparent:
        draw_nodes(draw, s, alpha=40)

    # Size: Chinese chars bigger, AI slightly smaller but bold-looking
    fs_zhishu = int(s * 0.34)
    fs_ai = int(s * 0.38)

    zhishu_font = load_font(fs_zhishu)
    ai_font = load_font(fs_ai)

    # Measure widths roughly via textbbox
    def text_width(font, text):
        bbox = draw.textbbox((0, 0), text, font=font)
        return bbox[2] - bbox[0]

    gap = int(s * 0.04)
    w_zhishu = text_width(zhishu_font, "智枢")
    w_ai = text_width(ai_font, "AI")
    total_w = w_zhishu + gap + w_ai
    cx = s / 2
    baseline = s / 2

    x_zhishu = cx - total_w / 2 + w_zhishu / 2
    x_ai = cx + total_w / 2 - w_ai / 2

    draw.text((x_zhishu, baseline), "智枢", font=zhishu_font, fill=COLORS["white"], anchor="mm")
    draw.text((x_ai, baseline), "AI", font=ai_font, fill=COLORS["ai"], anchor="mm")

    if abs(safe_scale - 1.0) < 1e-6:
        return canvas
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def create_glyph(size, transparent=False, safe_scale=1.0):
    """Single 智 character."""
    s = int(size / safe_scale)
    canvas = create_base_canvas(s, transparent=transparent)
    draw = ImageDraw.Draw(canvas)

    fs = int(s * 0.58)
    draw_text_with_fallback(draw, (s / 2, s / 2), "智", fs, COLORS["white"], anchor="mm")

    if abs(safe_scale - 1.0) < 1e-6:
        return canvas
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def make_icon(size, kind, transparent=False, safe_scale=1.0):
    if kind == "vertical":
        return create_vertical(size, transparent=transparent, safe_scale=safe_scale)
    if kind == "horizontal":
        return create_horizontal(size, transparent=transparent, safe_scale=safe_scale)
    if kind == "glyph":
        return create_glyph(size, transparent=transparent, safe_scale=safe_scale)
    raise ValueError(f"Unknown kind: {kind}")


def write_png(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


# ---------------------------------------------------------------------------
# Target definitions
# ---------------------------------------------------------------------------
DESKTOP_DIR = os.path.join(BASE_DIR, "desktop", "src-tauri", "icons")
ANDROID_DIR = os.path.join(DESKTOP_DIR, "android")
APK_DIR = os.path.join(BASE_DIR, "apk", "assets")
PREVIEW_DIR = os.path.join(BASE_DIR, "docs", "logo-designs", "app-icons")

# Windows / Tauri square icons: (relative path, size px, kind)
TAURI_TARGETS = [
    ("icon.png", 1024, "vertical"),
    ("128x128.png", 128, "horizontal"),
    ("128x128@2x.png", 256, "horizontal"),
    ("64x64.png", 64, "horizontal"),
    ("32x32.png", 32, "glyph"),
    ("Square310x310Logo.png", 310, "vertical"),
    ("Square284x284Logo.png", 284, "vertical"),
    ("Square150x150Logo.png", 150, "vertical"),
    ("Square142x142Logo.png", 142, "vertical"),
    ("Square107x107Logo.png", 107, "horizontal"),
    ("Square89x89Logo.png", 89, "horizontal"),
    ("Square71x71Logo.png", 71, "horizontal"),
    ("Square44x44Logo.png", 44, "glyph"),
    ("Square30x30Logo.png", 30, "glyph"),
    ("StoreLogo.png", 50, "horizontal"),
]

# Android mipmap definitions: density -> launcher icon px
ANDROID_DENSITIES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}


def android_density_kind(size):
    if size >= 144:
        return "vertical"
    return "horizontal"


def generate():
    generated = []

    # 1. Tauri / Windows square icons
    for rel, size, kind in TAURI_TARGETS:
        out_path = os.path.join(DESKTOP_DIR, rel)
        img = make_icon(size, kind)
        write_png(img, out_path)
        generated.append((rel, size, kind, out_path))

    # 2. Android mipmap icons
    for density, size in ANDROID_DENSITIES.items():
        ddir = os.path.join(ANDROID_DIR, f"mipmap-{density}")

        # square launcher icon
        kind = android_density_kind(size)
        launcher_path = os.path.join(ddir, "ic_launcher.png")
        write_png(make_icon(size, kind), launcher_path)
        generated.append((f"android/{density}/ic_launcher.png", size, kind, launcher_path))

        # round launcher icon: content must fit inside circular mask, use safe 0.72
        round_path = os.path.join(ddir, "ic_launcher_round.png")
        write_png(make_icon(size, kind, safe_scale=0.72), round_path)
        generated.append((f"android/{density}/ic_launcher_round.png", size, kind, round_path))

        # adaptive foreground: transparent, content in safe zone 0.60
        fg_size = {48: 108, 72: 162, 96: 216, 144: 324, 192: 432}[size]
        fg_path = os.path.join(ddir, "ic_launcher_foreground.png")
        write_png(make_icon(fg_size, "vertical", transparent=True, safe_scale=0.60), fg_path)
        generated.append((f"android/{density}/ic_launcher_foreground.png", fg_size, "vertical", fg_path))

    # 3. APK / Expo assets
    write_png(make_icon(1024, "vertical"), os.path.join(APK_DIR, "icon.png"))
    generated.append(("apk/assets/icon.png", 1024, "vertical", os.path.join(APK_DIR, "icon.png")))

    write_png(make_icon(1024, "vertical", transparent=True, safe_scale=0.60), os.path.join(APK_DIR, "adaptive-icon.png"))
    generated.append(("apk/assets/adaptive-icon.png", 1024, "vertical", os.path.join(APK_DIR, "adaptive-icon.png")))

    # 4. ICO multi-resolution for Windows
    # NOTE: Pillow >= 12 requires all append frames to share the same size when
    # combined with the `sizes` list; otherwise only the first frame is written.
    ico_sizes = [16, 24, 32, 48, 64, 128, 256]
    ico_kinds = ["glyph", "glyph", "glyph", "horizontal", "horizontal", "vertical", "vertical"]
    ico_frames = []
    for s, k in zip(ico_sizes, ico_kinds):
        frame = make_icon(s, k)
        if frame.size != (256, 256):
            frame = frame.resize((256, 256), Image.Resampling.LANCZOS)
        ico_frames.append(frame)
    ico_path = os.path.join(DESKTOP_DIR, "icon.ico")
    ico_frames[0].save(
        ico_path, format="ICO",
        append_images=ico_frames[1:],
        sizes=[(s, s) for s in ico_sizes]
    )
    generated.append(("icon.ico", 256, "multi", ico_path))

    # 5. macOS ICNS (best-effort via icnsutil if available)
    try:
        from icnsutil import Icns  # type: ignore
        icns = Icns()
        icns_kinds = {
            "icp4": (16, "glyph"), "icp5": (32, "glyph"), "icp6": (64, "horizontal"),
            "ic07": (128, "horizontal"), "ic08": (256, "vertical"),
            "ic09": (512, "vertical"), "ic10": (1024, "vertical"),
        }
        for key, (s, k) in icns_kinds.items():
            img = make_icon(s, k)
            icns.media[key] = img
        icns_path = os.path.join(DESKTOP_DIR, "icon.icns")
        icns.write(icns_path)
        generated.append(("icon.icns", 1024, "multi", icns_path))
    except Exception as e:
        print(f"Skipping .icns generation ({e}). Windows builds do not require it.")

    # 6. Preview assets for docs
    preview_targets = [
        ("preview_1024_vertical.png", 1024, "vertical"),
        ("preview_192_vertical.png", 192, "vertical"),
        ("preview_128_horizontal.png", 128, "horizontal"),
        ("preview_72_horizontal.png", 72, "horizontal"),
        ("preview_48_horizontal.png", 48, "horizontal"),
        ("preview_32_glyph.png", 32, "glyph"),
        ("preview_16_glyph.png", 16, "glyph"),
    ]
    for rel, size, kind in preview_targets:
        out = os.path.join(PREVIEW_DIR, rel)
        write_png(make_icon(size, kind), out)
        generated.append((rel, size, kind, out))

    generate_preview_html(PREVIEW_DIR)
    return generated


def generate_preview_html(preview_dir):
    sizes = [1024, 192, 128, 72, 48, 32, 16]
    labels = ["1024 (商店/安装包)", "192 (Android xxxhdpi)", "128 (桌面中图标)", "72 (Android hdpi)", "48 (Android mdpi/列表)", "32 (Windows 小图标)", "16 (任务栏最小)"]
    rows = ""
    for s, label in zip(sizes, labels):
        fn = None
        for kind in ["vertical", "horizontal", "glyph"]:
            candidate = f"preview_{s}_{kind}.png"
            if os.path.exists(os.path.join(preview_dir, candidate)):
                fn = candidate
                break
        rows += f'<tr><td>{label}</td><td><img src="{fn}" width="{max(s, 48)}" height="{max(s, 48)}" style="image-rendering:auto"></td><td>{s}×{s}</td></tr>'

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>智枢AI 图标尺寸适配预览</title>
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; background: #f3f4f6; padding: 24px; }}
h1 {{ text-align: center; }}
table {{ margin: 0 auto; border-collapse: collapse; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
th, td {{ padding: 12px 24px; border-bottom: 1px solid #e5e7eb; text-align: left; }}
th {{ background: #4C1D95; color: white; }}
tr:hover {{ background: #f9fafb; }}
img {{ border-radius: 8px; background: #e5e7eb; display: block; }}
.note {{ max-width: 720px; margin: 24px auto; padding: 16px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; }}
</style>
</head>
<body>
<h1>智枢AI 图标尺寸适配预览</h1>
<div class="note"><strong>说明：</strong>大尺寸用纵向「智枢 / AI」，中等尺寸用横向「智枢AI」，极小尺寸用单「智」字保证可辨认。这是文字型 LOGO 在所有尺寸下都清晰的标准做法。</div>
<table>
<tr><th>使用场景</th><th>预览</th><th>尺寸</th></tr>
{rows}
</table>
</body>
</html>"""
    with open(os.path.join(preview_dir, "preview.html"), "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    generated = generate()
    print(f"Generated {len(generated)} icon assets.")
    for rel, size, kind, path in generated[:10]:
        print(f"  {rel}: {size}px ({kind})")
    print("  ...")
