# -*- coding: utf-8 -*-
"""Generate ip-data.js with PNG data URLs (preserve transparency)."""
from pathlib import Path
import io
import base64

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Please install Pillow: pip install Pillow")

ip_dir = Path(__file__).resolve().parent
files = ["IP.png", "Omu.png"]
out = {}

for name in files:
    p = ip_dir / name
    if not p.exists():
        print("MISSING", name)
        continue
    img = Image.open(p).convert("RGBA")
    w, h = img.size
    long = max(w, h)
    max_edge = 1200
    if long > max_edge:
        scale = max_edge / long
        img = img.resize(
            (max(1, round(w * scale)), max(1, round(h * scale))),
            Image.Resampling.LANCZOS,
        )
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    out["IP/" + name] = b64
    print(name, img.size, len(b64))

js_path = ip_dir / "ip-data.js"
parts = [
    "/** 預載 IP 圖（PNG data URL，保留去背透明） */",
    "window.IP_DATA_URLS = {",
]
for k, v in out.items():
    parts.append(f'  "{k}": "data:image/png;base64,{v}",')
parts.append("};")
js_path.write_text("\n".join(parts) + "\n", encoding="utf-8")
print("wrote", js_path, "bytes", js_path.stat().st_size)
