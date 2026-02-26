from PIL import Image
import base64
from io import BytesIO

def to_base64_svg(img_path, svg_path):
    img = Image.open(img_path)
    w, h = img.size
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <image x="0" y="0" width="{w}" height="{h}" xlink:href="data:image/png;base64,{b64}" />
</svg>"""
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

base_dir = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand"
to_base64_svg(f"{base_dir}\\sizewise-icon.png", f"{base_dir}\\sizewise-icon.svg")
to_base64_svg(f"{base_dir}\\sizewise-wordmark.png", f"{base_dir}\\sizewise-wordmark.svg")
to_base64_svg(f"{base_dir}\\sizewise-lockup.png", f"{base_dir}\\sizewise-lockup.svg")
print("Converted to SVGs.")
