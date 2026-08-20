# -*- coding: utf-8 -*-
"""Generate three LOGO proposals for 智枢AI.

Outputs:
- docs/logo-designs/v1_zhizhi_1024.png  (智核 Blue)
- docs/logo-designs/v2_zhishuai_1024.png (智枢AI Purple)
- docs/logo-designs/v3_zhishu_1024.png   (智枢 Dark)
- docs/logo-designs/preview.html

Also exports scaled PNGs (512, 256, 192, 144, 72, 48) for each version.
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT_DIR = "c:/Users/Administrator/zhishuai/docs/logo-designs"
FONT_PATH = "C:/Windows/Fonts/simhei.ttf"
SIZES = [1024, 512, 256, 192, 144, 72, 48]


def hex_to_rgb(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def interpolate_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def linear_gradient(size, c1, c2, direction="diag"):
    """direction: horizontal, vertical, diag"""
    w, h = size
    img = Image.new("RGB", size)
    pixels = img.load()
    c1 = hex_to_rgb(c1)
    c2 = hex_to_rgb(c2)
    for y in range(h):
        for x in range(w):
            if direction == "horizontal":
                t = x / max(w - 1, 1)
            elif direction == "vertical":
                t = y / max(h - 1, 1)
            else:  # diag
                t = (x + y) / max(w + h - 2, 1)
            pixels[x, y] = interpolate_color(c1, c2, t)
    return img


def radial_gradient(size, center_c, edge_c):
    w, h = size
    img = Image.new("RGB", size)
    pixels = img.load()
    c1 = hex_to_rgb(center_c)
    c2 = hex_to_rgb(edge_c)
    cx, cy = w / 2, h / 2
    max_dist = math.sqrt(cx ** 2 + cy ** 2)
    for y in range(h):
        for x in range(w):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            t = min(dist / max_dist, 1.0)
            pixels[x, y] = interpolate_color(c1, c2, t)
    return img


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def draw_text_centered(draw, text, font, xy, fill, anchor="mm"):
    draw.text(xy, text, font=font, fill=fill, anchor=anchor)


def create_v1(size=1024):
    """版本A：智核 — 商务蓝，中心大"智"，底部"枢AI"，外圈光环."""
    bg = radial_gradient((size, size), "#2563EB", "#0B1220")
    radius = int(size * 0.22)
    mask = rounded_mask((size, size), radius)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)

    # 外圈光环
    pad = int(size * 0.08)
    bbox = [pad, pad, size - pad, size - pad]
    draw.arc(bbox, start=0, end=360, fill="#38BDF8", width=int(size * 0.012))

    # 中心大"智"
    font_size = int(size * 0.50)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()
    draw.text((size / 2, size * 0.45), "智", font=font, fill="white", anchor="mm")

    # 底部 "枢AI"
    sub_font_size = int(size * 0.13)
    try:
        sub_font = ImageFont.truetype(FONT_PATH, sub_font_size)
    except Exception:
        sub_font = ImageFont.load_default()
    draw.text((size / 2, size * 0.78), "枢AI", font=sub_font, fill="#22D3EE", anchor="mm")

    # 顶部小字 智枢AI（若隐若现）
    tiny_font_size = int(size * 0.055)
    try:
        tiny_font = ImageFont.truetype(FONT_PATH, tiny_font_size)
    except Exception:
        tiny_font = ImageFont.load_default()
    draw.text((size / 2, size * 0.16), "智枢AI", font=tiny_font, fill=(255, 255, 255, 160), anchor="mm")

    return canvas


def create_v2(size=1024):
    """版本B：智枢AI — 科技紫，"智枢"+"AI"上下排布，背景节点."""
    bg = linear_gradient((size, size), "#4C1D95", "#2563EB", "diag")
    radius = int(size * 0.22)
    mask = rounded_mask((size, size), radius)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)

    # 背景节点点缀
    node_color = (255, 255, 255, 50)
    nodes = [
        (size * 0.18, size * 0.25), (size * 0.30, size * 0.18),
        (size * 0.75, size * 0.30), (size * 0.82, size * 0.45),
        (size * 0.70, size * 0.75), (size * 0.25, size * 0.80),
    ]
    r_node = int(size * 0.018)
    for i, (nx, ny) in enumerate(nodes):
        draw.ellipse([nx - r_node, ny - r_node, nx + r_node, ny + r_node], fill=node_color)
        if i < len(nodes) - 1:
            nx2, ny2 = nodes[i + 1]
            draw.line([(nx, ny), (nx2, ny2)], fill=node_color, width=int(size * 0.005))

    # "智枢"（上）
    font_size = int(size * 0.28)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()
    draw.text((size / 2, size * 0.32), "智枢", font=font, fill="white", anchor="mm")

    # "AI" 大号科技字（下，与"智枢"保持协调间距）
    ai_font_size = int(size * 0.42)
    try:
        ai_font = ImageFont.truetype(FONT_PATH, ai_font_size)
    except Exception:
        ai_font = ImageFont.load_default()
    draw.text((size / 2, size * 0.68), "AI", font=ai_font, fill="#22D3EE", anchor="mm")

    return canvas


def create_v3(size=1024):
    """版本C：智枢 — 高端深色，六边形枢纽 + "智"字 + "枢AI"."""
    bg = linear_gradient((size, size), "#111827", "#374151", "vertical")
    radius = int(size * 0.22)
    mask = rounded_mask((size, size), radius)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)

    # 六边形枢纽
    cx, cy = size / 2, size * 0.45
    R = size * 0.30
    points = []
    for i in range(6):
        angle = math.radians(60 * i - 30)
        points.append((cx + R * math.cos(angle), cy + R * math.sin(angle)))
    draw.polygon(points, outline="#F97316", width=int(size * 0.018))

    # 六边形内 "智" 字
    font_size = int(size * 0.35)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except Exception:
        font = ImageFont.load_default()
    draw.text((cx, cy), "智", font=font, fill="white", anchor="mm")

    # 底部 "枢AI"
    sub_font_size = int(size * 0.14)
    try:
        sub_font = ImageFont.truetype(FONT_PATH, sub_font_size)
    except Exception:
        sub_font = ImageFont.load_default()
    draw.text((size / 2, size * 0.82), "枢AI", font=sub_font, fill="#F97316", anchor="mm")

    # 顶部 "智枢AI" 小字
    tiny_font_size = int(size * 0.06)
    try:
        tiny_font = ImageFont.truetype(FONT_PATH, tiny_font_size)
    except Exception:
        tiny_font = ImageFont.load_default()
    draw.text((size / 2, size * 0.14), "智枢AI", font=tiny_font, fill=(255, 255, 255, 200), anchor="mm")

    return canvas


def save_all_versions():
    os.makedirs(OUT_DIR, exist_ok=True)
    creators = [("v1_zhizhi", create_v1), ("v2_zhishuai", create_v2), ("v3_zhishu", create_v3)]

    paths = {}
    for name, creator in creators:
        img_1024 = creator(1024)
        main_path = os.path.join(OUT_DIR, f"{name}_1024.png")
        img_1024.save(main_path)
        paths[name] = [main_path]

        for s in [512, 256, 192, 144, 72, 48]:
            thumb = img_1024.resize((s, s), Image.Resampling.LANCZOS)
            p = os.path.join(OUT_DIR, f"{name}_{s}.png")
            thumb.save(p)
            paths[name].append(p)

    print(f"Generated logo proposals in {OUT_DIR}")
    return paths


def generate_preview_html(paths):
    html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>智枢AI LOGO 设计方案</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; background: #f3f4f6; color: #111827; margin: 0; padding: 24px; }
h1 { text-align: center; margin-bottom: 8px; }
.subtitle { text-align: center; color: #6b7280; margin-bottom: 32px; }
.card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.card h2 { margin-top: 0; }
.meta { color: #6b7280; font-size: 14px; margin-bottom: 16px; }
.preview-row { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
.big { width: 256px; height: 256px; border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); object-fit: contain; background: #e5e7eb; }
.sizes { display: flex; flex-direction: column; gap: 16px; }
.size-group { display: flex; align-items: center; gap: 12px; }
.size-group img { border-radius: 8px; background: #e5e7eb; }
.size-label { width: 80px; font-size: 13px; color: #4b5563; }
.choice { margin-top: 16px; padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; }
</style>
</head>
<body>
<h1>智枢AI 专属 LOGO 设计方案</h1>
<p class="subtitle">请从三个方案中挑选确认。下方同时展示了桌面/手机桌面常见尺寸下的显示效果。</p>
"""

    titles = {
        "v1_zhizhi": "方案 A：智核（商务蓝）",
        "v2_zhishuai": "方案 B：智枢AI（科技紫）",
        "v3_zhishu": "方案 C：智枢（高端深色）",
    }
    descs = {
        "v1_zhizhi": "以「智」字为核心识别元素，底部辅以「枢AI」字样，整体采用深蓝渐变，传递稳重、可信的企业服务感。外圈光环呼应「枢」的枢纽概念。",
        "v2_zhishuai": "将「智枢」与「AI」上下排布，突出 AI 科技感；紫色渐变背景搭配神经网络节点纹理，适合年轻化、移动端展示。",
        "v3_zhishu": "采用深色高端质感，六边形枢纽图形内嵌「智」字，象征智能中枢与连接；橙色点缀提升活力，适合品牌主标识。",
    }

    for name in ["v1_zhizhi", "v2_zhishuai", "v3_zhishu"]:
        big = os.path.basename(paths[name][0])
        size_imgs = ""
        for s in [48, 72, 144, 192]:
            fn = f"{name}_{s}.png"
            size_imgs += f'<div class="size-group"><span class="size-label">{s}×{s}</span><img src="{fn}" width="{s}" height="{s}"></div>'
        html += f"""
<div class="card">
  <h2>{titles[name]}</h2>
  <div class="meta">{descs[name]}</div>
  <div class="preview-row">
    <img class="big" src="{big}" alt="{titles[name]}">
    <div class="sizes">{size_imgs}</div>
  </div>
  <div class="choice"><strong>适用建议：</strong>Windows 桌面安装版 / Android APK 端均可使用；小尺寸下「智」字或图形符号仍保持清晰可辨。</div>
</div>
"""

    html += """
<div class="card">
  <h2>设计说明与使用建议</h2>
  <p><strong>识别策略：</strong>三个方案均以「智」字或「智枢AI」作为核心识别，同时保留圆角矩形外轮廓，符合 Windows 与 Android 桌面图标的系统规范。</p>
  <p><strong>尺寸适配：</strong>已按 1024 / 512 / 256 / 192 / 144 / 72 / 48 像素导出 PNG。Windows 桌面端会用到 30×30 ~ 310×310 多种规格；APK 端主要使用 48×48、72×72、144×144、192×192。</p>
  <p><strong>选中后交付：</strong>确认方案后，我会将该方案按 Tauri 图标规范生成全部 Windows 尺寸（Square30x30Logo ~ Square310x310Logo、StoreLogo），并替换 APK 端的 logo.png 与自适应图标资源。</p>
</div>
</body>
</html>
"""
    html_path = os.path.join(OUT_DIR, "preview.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated preview: {html_path}")


if __name__ == "__main__":
    paths = save_all_versions()
    generate_preview_html(paths)
