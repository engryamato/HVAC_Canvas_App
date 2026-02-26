from PIL import Image

img_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand\sizewise-icon.png"
img = Image.open(img_path).convert("RGBA")
w, h = img.size
pixels = img.load()

col_sums = [0]*w
for y in range(h):
    for x in range(w):
        r,g,b,a = pixels[x,y]
        if a > 10 and not (r>240 and g>240 and b>240):
            col_sums[x] += 1

# Find contiguous components
components = []
in_comp = False
start = 0
for x in range(w):
    if col_sums[x] > 0 and not in_comp:
        in_comp = True
        start = x
    elif col_sums[x] == 0 and in_comp:
        in_comp = False
        components.append((start, x-1))
if in_comp:
    components.append((start, w-1))

print("X-axis components:", components)

# Let's crop into logo and wordmark based on the largest gap
if len(components) >= 2:
    # First component is icon, the rest is wordmark
    icon_x1, icon_x2 = components[0]
    wordmark_x1, wordmark_x2 = components[1][0], components[-1][1]
    
    # Let's do a bounding box on y for icon
    icon_y1, icon_y2 = h, -1
    for x in range(icon_x1, icon_x2+1):
        for y in range(h):
            r,g,b,a = pixels[x,y]
            if a > 10 and not (r>240 and g>240 and b>240):
                icon_y1 = min(icon_y1, y)
                icon_y2 = max(icon_y2, y)
                
    # Bounding box on y for wordmark
    wordmark_y1, wordmark_y2 = h, -1
    for x in range(wordmark_x1, wordmark_x2+1):
        for y in range(h):
            r,g,b,a = pixels[x,y]
            if a > 10 and not (r>240 and g>240 and b>240):
                wordmark_y1 = min(wordmark_y1, y)
                wordmark_y2 = max(wordmark_y2, y)

    # Let's add padding
    p = 10
    icon_crop = img.crop((max(0, icon_x1-p), max(0, icon_y1-p), min(w, icon_x2+p), min(h, icon_y2+p)))
    wordmark_crop = img.crop((max(0, wordmark_x1-p), max(0, wordmark_y1-p), min(w, wordmark_x2+p), min(h, wordmark_y2+p)))
    lockup_crop = img.crop((max(0, icon_x1-p), max(0, min(icon_y1, wordmark_y1)-p), min(w, wordmark_x2+p), min(h, max(icon_y2, wordmark_y2)+p)))
    
    icon_crop.save(r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand\sizewise-icon.png")
    wordmark_crop.save(r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand\sizewise-wordmark.png")
    lockup_crop.save(r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand\sizewise-lockup.png")
    print("Successfully cropped!")
else:
    print("Could not separate components. Len =", len(components))

