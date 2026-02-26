from PIL import Image
import base64, re, shutil
from io import BytesIO

# Extract PNG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
img_bytes = base64.b64decode(match.group(1))
img = Image.open(BytesIO(img_bytes)).convert("RGBA")
w, h = img.size
pixels = img.load()

brand_dir = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand"

# Based on the column analysis:
# Icon (cube + arrow) content: x ~47 to ~306
# Gap: x ~307 to ~313
# Text starts: x ~314

# Split point: x = 310 (middle of the gap)
split_x = 310

# Find vertical bounds
def y_bounds(x1, x2):
    min_y, max_y = h, 0
    for x in range(x1, x2):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            brightness = (r + g + b) / 3
            if a > 30 and brightness < 220:
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    return min_y, max_y

icon_y1, icon_y2 = y_bounds(40, split_x)
text_y1, text_y2 = y_bounds(split_x, 600)
print(f"Icon Y: {icon_y1} to {icon_y2}")
print(f"Text Y: {text_y1} to {text_y2}")

pad = 10

# 1. Icon only
icon = img.crop((max(0, 40 - pad), max(0, icon_y1 - pad),
                 min(w, split_x + pad), min(h, icon_y2 + pad)))
icon.save(f"{brand_dir}\\sizewise-icon.png")
print(f"Icon saved: {icon.size}")

# 2. Wordmark only
text = img.crop((max(0, split_x - pad), max(0, text_y1 - pad),
                 min(w, 598 + pad), min(h, text_y2 + pad)))
text.save(f"{brand_dir}\\sizewise-wordmark.png")
print(f"Wordmark saved: {text.size}")

# 3. Full lockup (icon + text together)
full_y1 = min(icon_y1, text_y1)
full_y2 = max(icon_y2, text_y2)
lockup = img.crop((max(0, 40 - pad), max(0, full_y1 - pad),
                   min(w, 598 + pad), min(h, full_y2 + pad)))
lockup.save(f"{brand_dir}\\sizewise-lockup.png")
print(f"Lockup saved: {lockup.size}")

# Create SVG wrappers
def png_to_svg(png_path, svg_path):
    im = Image.open(png_path)
    pw, ph = im.size
    buf = BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{pw}" height="{ph}" viewBox="0 0 {pw} {ph}">
  <image x="0" y="0" width="{pw}" height="{ph}"
         xlink:href="data:image/png;base64,{b64}" />
</svg>'''
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg)

png_to_svg(f"{brand_dir}\\sizewise-icon.png", f"{brand_dir}\\sizewise-icon.svg")
png_to_svg(f"{brand_dir}\\sizewise-wordmark.png", f"{brand_dir}\\sizewise-wordmark.svg")
png_to_svg(f"{brand_dir}\\sizewise-lockup.png", f"{brand_dir}\\sizewise-lockup.svg")

# Copy the exact reference as-is
shutil.copy2(svg_path, f"{brand_dir}\\sizewise-exact.svg")

print("\nAll files saved successfully.")
