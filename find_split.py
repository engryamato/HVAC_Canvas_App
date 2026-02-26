from PIL import Image

img_path = r"C:\Users\User\.gemini\antigravity\brain\51634cf2-8630-47d0-8e13-12af6335f42c\sizewize_logo_v2_1771894016390.png"
img = Image.open(img_path).convert("RGBA")
w, h = img.size
pixels = img.load()

# Background is basically white/off-white. Let's find real content.
col_sums = [0]*w
for y in range(h):
    for x in range(w):
        r,g,b,a = pixels[x,y]
        # Ignore solid whites and transparent
        if a > 50 and (r < 240 or g < 240 or b < 240):
            col_sums[x] += 1

print("Columns (scaled down by 10):")
for b in range(0, w, 10):
    val = sum(col_sums[b:b+10])
    if val > 5:
        print(f"{b:4d}: {'*' * min(40, int(val/20))}")

# Automatically find split
# 1. Skip leading empty
start_x = 0
while start_x < w and sum(col_sums[start_x:start_x+5]) == 0:
    start_x += 1

# 2. Skip icon body (look for local minimum after a peak)
# Let's say icon takes at least 150 pixels (based on 1024x1024)
peak_found = False
split_x = -1
for x in range(start_x, w):
    if col_sums[x] > 50:
        peak_found = True
    # If we are past the peak and hit a sudden drop of density
    if peak_found and x > start_x + 150:
        # Check an average over a small window
        window_sum = sum(col_sums[x:x+10])
        if window_sum < 30: # 10 columns have almost nothing
            split_x = x
            break

print(f"Start X: {start_x}, Split X: {split_x}")
