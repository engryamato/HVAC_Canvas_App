from PIL import Image
import base64, re

# Step 1: Extract the PNG from the reference SVG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
if not match:
    print("ERROR: No base64 image found")
    exit(1)

img_bytes = base64.b64decode(match.group(1))
with open("_ref_logo.png", "wb") as f:
    f.write(img_bytes)

img = Image.open("_ref_logo.png").convert("RGBA")
w, h = img.size
pixels = img.load()
print(f"Reference image size: {w}x{h}")

# Step 2: Detailed column analysis to find precise icon/text boundary
# We define "content" as non-white, non-transparent pixels
col_counts = [0] * w
for x in range(w):
    for y in range(h):
        r, g, b, a = pixels[x, y]
        if a > 30 and not (r > 245 and g > 245 and b > 245):
            col_counts[x] += 1

# Find first content, last content
first_x = next((x for x in range(w) if col_counts[x] > 0), 0)
last_x = next((x for x in range(w-1, -1, -1) if col_counts[x] > 0), w-1)
print(f"Content range: x={first_x} to x={last_x}")

# Find the GAP between icon and text
# The gap is where col_counts drops to 0 for several consecutive columns
# after some significant content
gap_start = -1
gap_end = -1
in_content = False
min_gap_width = 5  # At least 5 empty columns to be a real gap

for x in range(first_x, last_x):
    if col_counts[x] > 5:
        in_content = True
    if in_content and col_counts[x] == 0:
        # Start of potential gap
        gap_s = x
        gap_e = x
        while gap_e < last_x and col_counts[gap_e] == 0:
            gap_e += 1
        gap_width = gap_e - gap_s
        if gap_width >= min_gap_width:
            gap_start = gap_s
            gap_end = gap_e
            print(f"Found gap: x={gap_start} to x={gap_end} (width={gap_width})")
            break

if gap_start == -1:
    print("WARNING: No clear gap found between icon and text")
    # Try with threshold of 2 instead of 0
    in_content = False
    for x in range(first_x, last_x):
        if col_counts[x] > 10:
            in_content = True
        if in_content and col_counts[x] <= 2:
            gap_s = x
            gap_e = x
            while gap_e < last_x and col_counts[gap_e] <= 2:
                gap_e += 1
            gap_width = gap_e - gap_s
            if gap_width >= min_gap_width:
                gap_start = gap_s
                gap_end = gap_e
                print(f"Found gap (threshold 2): x={gap_start} to x={gap_end} (width={gap_width})")
                break

# Find vertical bounds for each region
def find_y_bounds(x_start, x_end):
    min_y, max_y = h, 0
    for x in range(x_start, x_end):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            if a > 30 and not (r > 245 and g > 245 and b > 245):
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    return min_y, max_y

icon_y1, icon_y2 = find_y_bounds(first_x, gap_start)
text_y1, text_y2 = find_y_bounds(gap_end, last_x + 1)
full_y1 = min(icon_y1, text_y1)
full_y2 = max(icon_y2, text_y2)

print(f"Icon bounds: x=[{first_x},{gap_start}] y=[{icon_y1},{icon_y2}]")
print(f"Text bounds: x=[{gap_end},{last_x}] y=[{text_y1},{text_y2}]")
print(f"Full bounds: x=[{first_x},{last_x}] y=[{full_y1},{full_y2}]")

# Step 3: Crop with padding
pad = 8
brand_dir = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand"

# Icon only
icon = img.crop((max(0, first_x - pad), max(0, icon_y1 - pad),
                 min(w, gap_start + pad), min(h, icon_y2 + pad)))
icon.save(f"{brand_dir}\\sizewise-icon.png")
print(f"Saved icon: {icon.size}")

# Wordmark only
text = img.crop((max(0, gap_end - pad), max(0, text_y1 - pad),
                 min(w, last_x + pad), min(h, text_y2 + pad)))
text.save(f"{brand_dir}\\sizewise-wordmark.png")
print(f"Saved wordmark: {text.size}")

# Full lockup
full = img.crop((max(0, first_x - pad), max(0, full_y1 - pad),
                 min(w, last_x + pad), min(h, full_y2 + pad)))
full.save(f"{brand_dir}\\sizewise-lockup.png")
print(f"Saved lockup: {full.size}")

# Step 4: Create SVG wrappers for each PNG
def png_to_svg(png_path, svg_path):
    img2 = Image.open(png_path)
    pw, ph = img2.size
    from io import BytesIO
    buf = BytesIO()
    img2.save(buf, format="PNG")
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

# Also copy the exact original as-is
import shutil
shutil.copy2(svg_path, f"{brand_dir}\\sizewise-exact.svg")

print("\nDone! All files saved.")
