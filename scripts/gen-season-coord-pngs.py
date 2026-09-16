#!/usr/bin/env python3
"""DEPRECATED: flat season-*-corner-*.png leftovers.

Canon paths are nested assets/seasons/<id>/<slot>.png (see SEASON-OVERLAY.md).
Do not wire these flat files in CSS. Corners 96×96, banners ≤320×64.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "seasons"

# Approved palette (ASSET-STYLE + attached pumpkin/tree)
ORANGE = (255, 152, 48, 255)
ORANGE_D = (230, 120, 24, 255)
STEM = (90, 58, 24, 255)
FACE = (32, 24, 16, 255)
GREEN = (48, 196, 72, 255)
GREEN_D = (28, 140, 48, 255)
TRUNK = (28, 28, 28, 255)
CLEAR = (0, 0, 0, 0)


def png_bytes(w: int, h: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        row = y * w
        for x in range(w):
            raw.extend(pixels[row + x])

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def canvas(w: int, h: int) -> list[tuple[int, int, int, int]]:
    return [CLEAR] * (w * h)


def blit(dst, dw, dh, src, sw, sh, ox, oy) -> None:
    for y in range(sh):
        for x in range(sw):
            px = src[y * sw + x]
            if px[3] == 0:
                continue
            tx, ty = ox + x, oy + y
            if 0 <= tx < dw and 0 <= ty < dh:
                dst[ty * dw + tx] = px


def flip_h(src, w, h):
    out = canvas(w, h)
    for y in range(h):
        for x in range(w):
            out[y * w + (w - 1 - x)] = src[y * w + x]
    return out


def scale_nn(src, w, h, s):
    nw, nh = w * s, h * s
    out = canvas(nw, nh)
    for y in range(h):
        for x in range(w):
            px = src[y * w + x]
            if px[3] == 0:
                continue
            for dy in range(s):
                for dx in range(s):
                    out[(y * s + dy) * nw + (x * s + dx)] = px
    return nw, nh, out


def pumpkin(w=16, h=16) -> list[tuple[int, int, int, int]]:
    """Single pumpkin matching the attached tl ref."""
    p = canvas(w, h)
    def put(x, y, c):
        if 0 <= x < w and 0 <= y < h:
            p[y * w + x] = c
    # stem
    put(7, 1, STEM)
    put(8, 1, STEM)
    put(7, 2, STEM)
    put(8, 2, STEM)
    # body
    for y, xs in (
        (3, range(5, 11)),
        (4, range(4, 12)),
        (5, range(3, 13)),
        (6, range(3, 13)),
        (7, range(3, 13)),
        (8, range(3, 13)),
        (9, range(3, 13)),
        (10, range(4, 12)),
        (11, range(5, 11)),
        (12, range(6, 10)),
    ):
        for x in xs:
            put(x, y, ORANGE if (x + y) % 5 else ORANGE_D)
    # face
    put(6, 6, FACE)
    put(6, 7, FACE)
    put(9, 6, FACE)
    put(9, 7, FACE)
    put(7, 9, FACE)
    put(8, 9, FACE)
    return p


def tree(w=16, h=16) -> list[tuple[int, int, int, int]]:
    """Pine matching the attached jungle tl ref."""
    p = canvas(w, h)
    def put(x, y, c):
        if 0 <= x < w and 0 <= y < h:
            p[y * w + x] = c
    # layers
    for y, half in ((2, 1), (3, 2), (4, 3), (5, 4), (6, 5), (7, 4), (8, 5), (9, 6)):
        for x in range(8 - half, 8 + half):
            put(x, y, GREEN if y < 6 else GREEN_D)
    put(7, 10, TRUNK)
    put(8, 10, TRUNK)
    put(7, 11, TRUNK)
    put(8, 11, TRUNK)
    put(7, 12, TRUNK)
    put(8, 12, TRUNK)
    return p


def write(name: str, w: int, h: int, pixels) -> None:
    dest = OUT / name
    dest.write_bytes(png_bytes(w, h, pixels))
    print("wrote", dest.relative_to(ROOT), f"{w}x{h}")


def corner_from_sprite(sprite, sw, sh, scale, anchor: str):
    nw, nh, scaled = scale_nn(sprite, sw, sh, scale)
    out = canvas(96, 96)
    ox = 4 if "l" in anchor else (96 - nw - 4 if "r" in anchor else (96 - nw) // 2)
    oy = 4 if "t" in anchor else (96 - nh - 4 if "b" in anchor else (96 - nh) // 2)
    blit(out, 96, 96, scaled, nw, nh, ox, oy)
    return out


def two_pumpkins(anchor: str):
    pk = pumpkin()
    s = 4
    nw, nh, a = scale_nn(pk, 16, 16, s)
    out = canvas(96, 96)
    if "l" in anchor:
        blit(out, 96, 96, a, nw, nh, 2, 96 - nh - 4)
        blit(out, 96, 96, a, nw, nh, 30, 96 - nh - 10)
    else:
        blit(out, 96, 96, a, nw, nh, 96 - nw - 2, 96 - nh - 4)
        blit(out, 96, 96, a, nw, nh, 96 - nw - 30, 96 - nh - 10)
    return out


def banner_pumpkins():
    pk = pumpkin()
    nw, nh, a = scale_nn(pk, 16, 16, 3)
    w, h = 320, 64
    out = canvas(w, h)
    gap = 68
    start = (w - (nw + gap * 3)) // 2
    for i in range(4):
        blit(out, w, h, a, nw, nh, start + i * gap, (h - nh) // 2)
    return w, h, out


def banner_trees():
    tr = tree()
    nw, nh, a = scale_nn(tr, 16, 16, 3)
    w, h = 320, 64
    out = canvas(w, h)
    gap = 90
    start = (w - (nw + gap * 2)) // 2
    for i in range(3):
        blit(out, w, h, a, nw, nh, start + i * gap, (h - nh) // 2)
    return w, h, out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    pk = pumpkin()
    tr = tree()
    write("season-halloween-corner-tl.png", 96, 96, corner_from_sprite(pk, 16, 16, 5, "tl"))
    write("season-halloween-corner-tr.png", 96, 96, corner_from_sprite(flip_h(pk, 16, 16), 16, 16, 5, "tr"))
    write("season-halloween-corner-bl.png", 96, 96, two_pumpkins("l"))
    write("season-halloween-corner-br.png", 96, 96, two_pumpkins("r"))
    bw, bh, bp = banner_pumpkins()
    write("season-halloween-banner.png", bw, bh, bp)

    write("season-jungle-corner-tl.png", 96, 96, corner_from_sprite(tr, 16, 16, 5, "tl"))
    write("season-jungle-corner-tr.png", 96, 96, corner_from_sprite(flip_h(tr, 16, 16), 16, 16, 5, "tr"))
    write("season-jungle-corner-bl.png", 96, 96, corner_from_sprite(tr, 16, 16, 5, "bl"))
    write("season-jungle-corner-br.png", 96, 96, corner_from_sprite(flip_h(tr, 16, 16), 16, 16, 5, "br"))
    tw, th, tb = banner_trees()
    write("season-jungle-banner.png", tw, th, tb)


if __name__ == "__main__":
    main()
