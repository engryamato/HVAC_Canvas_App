from PIL import Image
import base64, re, shutil
from io import BytesIO

# Extract PNG from reference SVG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
img_bytes = base64.b64decode(match.group(1))
img = Image.open(BytesIO(img_bytes)).convert("RGBA")
w, h = img.size
pixels = img.load()

brand_dir = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand"

# Split point at x=285 (middle of the visual gap based on ruler overlay)
split_x = 285

# Find vertical bounds
def y_bounds(x1, x2):
    min_y, max_y = h, 0
    for x in range(x1, x2):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            brightness = (r + g + b) / 3
            if a > 30 and brightness < 235: # Be a bit more permissive on white
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    return min_y, max_y

icon_y1, icon_y2 = y_bounds(40, split_x)
text_y1, text_y2 = y_bounds(split_x, 600)

outer_pad = 0  # Let's do 0 padding to ensure strictly tight crops.

# 1. Icon only
icon = img.crop((46, icon_y1, split_x, icon_y2+1))
# We can find the exact right bound of the icon
ix2 = split_x
for x in range(split_x-1, 46, -1):
    has_pixel = False
    for y in range(icon_y1, icon_y2+1):
        r, g, b, a = pixels[x, y]
        b = (r+g+b)/3
        if a > 30 and b < 235:
            has_pixel = True
            break
    if has_pixel:
        ix2 = x
        break

icon = img.crop((46, icon_y1, ix2+1, icon_y2+1))
icon.save(f"{brand_dir}\\sizewise-icon.png")

# 2. Text only
tx1 = split_x
for x in range(split_x, 600):
    has_pixel = False
    for y in range(text_y1, text_y2+1):
        r, g, b, a = pixels[x, y]
        br = (r+g+b)/3
        if a > 30 and br < 235:
            has_pixel = True
            break
    if has_pixel:
        tx1 = x
        break

text = img.crop((tx1, text_y1, 592, text_y2+1))
text.save(f"{brand_dir}\\sizewise-wordmark.png")

# 3. Lockup
lockup = img.crop((46, min(icon_y1, text_y1), 592, max(icon_y2, text_y2)+1))
lockup.save(f"{brand_dir}\\sizewise-lockup.png")

print(f"Icon: {icon.size}, Wordmark: {text.size}, Lockup: {lockup.size}")

# Create SVG wrappers for each
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

print("\nCropping successful and SVGs generated.")
