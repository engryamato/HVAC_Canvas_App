from PIL import Image
import base64, re
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

# Let's find the first occurrence of the letter "S".
# "Size" is a very specific dark blue. Let's find the bounding box of the dark blue.
# The dark blue has low red, medium green, high blue. E.g. (79, 134, 166) or similar.
# The arrow is light blue (156, 163, 175) maybe? Let's just print the colors along a horizontal line 
# through the middle of the text.

mid_y = h // 2
colors_found = []
for x in range(100, 400):
    r, g, b, a = pixels[x, mid_y]
    if a > 50 and not (r > 240 and g > 240 and b > 240):
        # We found a non-white pixel
        colors_found.append((x, r, g, b))

print("Colors across the middle y-line:")
last_x = -1
for c in colors_found:
    x, r, g, b = c
    if x > last_x + 5: # only print when there's a jump in x (new feature)
        print(f"Jump to x={x}: RGB({r},{g},{b})")
    last_x = x

# Walk specifically backwards from right to left to find the arrow and the 'S'
print("\nScanning from right edge of suspected icon (x=300) to left:")
icon_max_x = 0
for x in range(300, 100, -1):
    for y in range(h):
        r, g, b, a = pixels[x, y]
        # Ignore white/transparent
        if a > 50 and not (r > 240 and g > 240 and b > 240):
            # Check if this could be the tip of the arrow
            # Arrow is lighter. S is darker.
            # But let's just find where the content breaks.
            pass

# Better approach: Just print every column from 140 to 350, showing the minimum and maximum brightness
print("\nColumn brightness profiles (min/max):")
for x in range(140, 300):
    min_b = 255
    max_b = 0
    has_content = False
    for y in range(h):
        r, g, b, a = pixels[x, y]
        if a > 100:
            brightness = (r + g + b) // 3
            if brightness < 240:
                has_content = True
                min_b = min(min_b, brightness)
                max_b = max(max_b, brightness)
    if has_content:
        # Print a simple visual bar for the position
        # A jump in min_b might indicate a color change (arrow vs text)
        print(f"x={x:3d}: min={min_b:3d} max={max_b:3d}")
    else:
        print(f"x={x:3d}: [GAP]")

