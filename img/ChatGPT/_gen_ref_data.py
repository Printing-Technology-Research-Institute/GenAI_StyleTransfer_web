# -*- coding: utf-8 -*-
"""Generate ref-data.js with ChatGPT ceramic/frame data URLs."""
from pathlib import Path
import base64
import mimetypes

img_dir = Path(__file__).resolve().parent
files = [
    "ceramics.jpg",
    "Fe.jpg",
    "jade.jpg",
    "clay_idol.jpg",
    "face_pottery.jpg",
    "large_bowl.jpg",
    "storage_urn.jpg",
    "frame1.png",
    "frame2.png",
]
out = {}

for name in files:
    p = img_dir / name
    if not p.exists():
        print("MISSING", name)
        continue
    raw = p.read_bytes()
    mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
    b64 = base64.b64encode(raw).decode("ascii")
    key = "img/ChatGPT/" + name
    out[key] = f"data:{mime};base64,{b64}"
    print(name, len(raw), "->", len(b64))

js_path = img_dir / "ref-data.js"
parts = [
    "/** 預載 ChatGPT 玉器／外框參考圖（data URL） */",
    "window.REF_DATA_URLS = {",
]
for k, v in out.items():
    parts.append(f'  "{k}": "{v}",')
parts.append("};")
js_path.write_text("\n".join(parts) + "\n", encoding="utf-8")
print("wrote", js_path, "bytes", js_path.stat().st_size)
