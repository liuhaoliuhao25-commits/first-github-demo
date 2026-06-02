"""生成应用图标 app_icon.ico — 蓝紫色盾牌+锁"""
from PIL import Image, ImageDraw
import math, os

def build_icon(size=256):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    r = size // 2 - 4

    # 渐变背景圆
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = math.sqrt(dx * dx + dy * dy)
            if d <= r:
                t = d / r
                # 蓝紫渐变 #4F6EF7 → #7C3AED
                rr = int(79 + t * (124 - 79))
                gg = int(110 + t * (58 - 110))
                bb = int(247 - t * (247 - 237))
                img.putpixel((x, y), (rr, gg, bb, 255))

    # 锁图标（白色）
    lock_w = size * 0.35
    lock_h = size * 0.40
    lx = cx - lock_w / 2
    ly = cy - lock_h / 2 + size * 0.05

    # 锁体
    draw.rounded_rectangle(
        [lx, ly + lock_h * 0.3, lx + lock_w, ly + lock_h],
        radius=size * 0.04, fill=(255, 255, 255, 255)
    )
    # 锁环
    ring_w = lock_w * 0.6
    ring_h = lock_h * 0.5
    rx = cx - ring_w / 2
    ry = ly - ring_h * 0.5
    draw.arc(
        [rx, ry, rx + ring_w, ry + ring_h * 2],
        start=180, end=0, fill=(255, 255, 255, 255), width=max(3, size // 40)
    )
    # 钥匙孔
    hole_r = size * 0.03
    draw.ellipse(
        [cx - hole_r, ly + lock_h * 0.55 - hole_r,
         cx + hole_r, ly + lock_h * 0.55 + hole_r],
        fill=(79, 110, 247, 255)
    )
    draw.rectangle(
        [cx - hole_r * 0.5, ly + lock_h * 0.55,
         cx + hole_r * 0.5, ly + lock_h * 0.75],
        fill=(79, 110, 247, 255)
    )

    return img


if __name__ == "__main__":
    img = build_icon(256)
    # 保存多种尺寸
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "app_icon.ico")
    img.save(path, format="ICO", sizes=[(256, 256), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"Icon saved: {path}")
