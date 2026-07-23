#!/usr/bin/env python3
"""Procedural PWA icons — arcade stickman VS (rechtenvrij)."""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "icons"


def load_font(size: int):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    im = Image.new("RGBA", (size, size), (10, 8, 22, 255))
    d = ImageDraw.Draw(im)
    s = size / 512.0
    cx, cy = int(256 * s), int(132 * s)
    for i in range(14):
        ang = i * math.pi / 7
        x2 = cx + int(230 * s * math.cos(ang))
        y2 = cy + int(230 * s * math.sin(ang))
        d.line([(cx, cy), (x2, y2)], fill=(255, 70, 50, 85), width=max(2, int(7 * s)))
    r = int(88 * s)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 205, 55, 255))
    d.polygon(
        [(0, int(418 * s)), (size, int(418 * s)), (size, size), (0, size)],
        fill=(35, 32, 52, 255),
    )
    lw = max(3, int(13 * s))

    def stick(x, face, col):
        bx, by = int(x * s), int(338 * s)
        d.line([(bx, by), (bx, by - int(78 * s))], fill=col, width=lw)
        d.line(
            [(bx, by - int(78 * s)), (bx + face * int(48 * s), by - int(108 * s))],
            fill=col,
            width=lw,
        )
        hr = int(20 * s)
        d.ellipse([bx - hr, by - int(128 * s), bx + hr, by - int(88 * s)], fill=col)
        fx = bx + face * int(68 * s)
        fy = by - int(98 * s)
        fr = int(17 * s)
        d.ellipse([fx - fr, fy - fr, fx + fr, fy + fr], fill=(255, 215, 90, 255))

    stick(138, 1, (235, 242, 255, 255))
    stick(374, -1, (255, 110, 130, 255))
    vx, vy = int(256 * s), int(296 * s)
    pad = int(54 * s)
    d.rounded_rectangle(
        [vx - pad, vy - int(34 * s), vx + pad, vy + int(34 * s)],
        radius=int(14 * s),
        fill=(190, 28, 42, 255),
        outline=(255, 220, 80, 255),
        width=max(2, int(5 * s)),
    )
    font = load_font(max(22, int(52 * s)))
    d.text((vx - int(pad * 0.62), vy - int(34 * s)), "VS", fill=(255, 255, 255, 255), font=font)
    return im


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, sz in [("icon-180.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)]:
        draw_icon(sz).save(ROOT / name)
    print("OK icons ->", ROOT)


if __name__ == "__main__":
    main()
