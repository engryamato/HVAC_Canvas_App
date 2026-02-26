import sys
try:
    from PIL import Image, ImageOps
except ImportError:
    print("PIL not found")
    sys.exit(0)

img_path = r"c:\Users\User\Downloads\GitHub\HVAC_Canvas_App\public\assets\images\brand\sizewise-icon.png"
try:
    img = Image.open(img_path).convert("RGBA")
    print(f"Image size: {img.size}")
    
    # Simple naive component finding: just scan rows/cols for non-white/non-transparent pixels
    w, h = img.size
    pixels = img.load()
    
    # Let's just find the bounding box of everything non-white/transparent
    min_x, min_y, max_x, max_y = w, h, -1, -1
    
    col_sums = [0]*w
    row_sums = [0]*h
    
    for y in range(h):
        for x in range(w):
            r,g,b,a = pixels[x,y]
            if a > 10 and not (r>240 and g>240 and b>240):
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
                col_sums[x] += 1
                row_sums[y] += 1
                
    print(f"Overall bounding box: ({min_x}, {min_y}) to ({max_x}, {max_y})")
    
    # Print a tiny ascii histogram of columns to find the gap between logo and text
    print("Col histogram (scaled to 100 bins):")
    bin_size = w / 100
    bins = [0]*100
    for x in range(w):
        b = int(x / bin_size)
        if b >= 100: b = 99
        bins[b] += col_sums[x]
        
    for i, val in enumerate(bins):
        if val > 0:
            print(f"{i*bin_size:.0f}: {'*' * min(10, int(val/10))}")
            
except Exception as e:
    print(f"Error: {e}")
