from PIL import Image
import base64, re
from io import BytesIO

# Step 1: Extract the PNG from the reference SVG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
img_bytes = base64.b64decode(match.group(1))
with open("_ref_logo.png", "wb") as f:
    f.write(img_bytes)

img = Image.open("_ref_logo.png").convert("RGBA")
w, h = img.size
pixels = img.load()
print(f"Image size: {w}x{h}")

# Use a higher threshold for "content" since JPEG has artifacts
# Count pixels that are clearly NOT white/near-white
col_counts = [0] * w
for x in range(w):
    for y in range(h):
        r, g, b, a = pixels[x, y]
        # A pixel is "content" if it's noticeably non-white
        brightness = (r + g + b) / 3
        if a > 30 and brightness < 220:
            col_counts[x] += 1

# Print columns with significant content to find the gap
print("\nColumn density (only showing cols with count > 3):")
for x in range(w):
    if col_counts[x] > 3:
        print(f"  x={x}: {col_counts[x]}")

# Find the minimum density gap in the middle region
# Icon is on the left, text on right. Look for the valley.
min_density = 999
min_x = -1
# Search in a reasonable zone (between 20% and 60% of width)
search_start = int(w * 0.15)
search_end = int(w * 0.55)

# Use a sliding window of 10 columns
window = 10
for x in range(search_start, search_end - window):
    density = sum(col_counts[x:x+window])
    if density < min_density:
        min_density = density
        min_x = x + window // 2

print(f"\nMinimum density gap center: x={min_x} (density={min_density})")
