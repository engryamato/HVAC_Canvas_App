from PIL import Image, ImageDraw
import base64, re
from io import BytesIO

# Extract PNG from reference SVG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
img_bytes = base64.b64decode(match.group(1))
img = Image.open(BytesIO(img_bytes)).convert("RGBA")

# Draw vertical lines every 10 pixels to make a ruler
draw = ImageDraw.Draw(img)
for x in range(0, img.width, 10):
    color = (255, 0, 0, 128) if x % 50 != 0 else (0, 255, 0, 128)
    draw.line([(x, 0), (x, img.height)], fill=color, width=1)

img.save("ruler_debug.png")
print("Saved ruler_debug.png")
