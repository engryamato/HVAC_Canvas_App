from PIL import Image
import base64, re
from io import BytesIO

# Extract PNG from reference SVG
svg_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\docs\Pencil\Asset\Logo\sizewize_exact copy.svg"
with open(svg_path, "r", encoding="utf-8") as f:
    svg_content = f.read()

match = re.search(r'xlink:href="data:image/png;base64,(.+?)"', svg_content, re.DOTALL)
img_bytes = base64.b64decode(match.group(1))
img = Image.open(BytesIO(img_bytes)).convert("RGBA")
w, h = img.size

brand_dir = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand"

# Hard crop values.
# Left edge of icon starts around x=46.
# We will cut the icon off aggressively at x=265
# We will start the text conservatively at x=298
# Y bounds can be generous.

icon = img.crop((40, 220, 265, 420))
icon.save(f"{brand_dir}\\sizewise-icon.png")

text = img.crop((298, 290, 600, 350))
text.save(f"{brand_dir}\\sizewise-wordmark.png")

lockup = img.crop((40, 220, 600, 420))
lockup.save(f"{brand_dir}\\sizewise-lockup.png")

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

print("Aggressive crop finished.")
