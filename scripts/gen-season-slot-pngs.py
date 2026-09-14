#!/usr/bin/env python3
"""Rasterize stickman pixel props into SEASON-OVERLAY.md slot PNGs."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "seasons"

PAL = {
    ".": (0, 0, 0, 0),
    "K": (26, 32, 48, 255),
    "M": (51, 60, 85, 230),
    "N": (157, 177, 227, 255),
    "W": (232, 240, 255, 255),
    "Y": (255, 215, 94, 255),
    "O": (201, 122, 32, 255),
    "A": (138, 64, 16, 255),
    "S": (74, 52, 32, 255),
    "B": (92, 66, 40, 255),
    "D": (30, 90, 44, 255),
    "G": (42, 112, 64, 255),
    "L": (58, 136, 80, 255),
    "H": (124, 252, 138, 230),
    "P": (255, 176, 184, 255),
    "U": (199, 146, 255, 200),
    "R": (255, 107, 107, 255),
    "C": (124, 245, 255, 200),
    "F": (78, 207, 106, 220),
    "E": (138, 96, 48, 255),
    "Q": (30, 90, 44, 90),
    "J": (201, 122, 32, 70),
    "V": (88, 28, 120, 80),
    "I": (232, 240, 255, 70),
}

SPRITES: dict[str, list[str]] = {
    "jungle/corner-tl": [
        "HHHH............",
        "HDDHH...........",
        ".DGGDH..........",
        "..DGGLH.........",
        "...DGDD..HH.....",
        "....DD..HDDH....",
        ".........DGLH...",
        "..........DGD...",
        "...........DD...",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "jungle/corner-tr": [
        ".............LHH",
        "...........HLGGH",
        "..........HLGLD.",
        ".........HLDGD..",
        "....HH...DGDD...",
        "...HLGH...DD....",
        "...LGDD.........",
        "....DD..........",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "jungle/corner-bl": [
        "................",
        "................",
        ".......H........",
        "......HLH.......",
        "....H.LGL.H.....",
        "...HLGLGLGLH....",
        ".....OOOOO......",
        "....OOWOOWO.....",
        "...OOWOOOOWO....",
        "...OOOOOOOOO....",
        "...AOOOOOOOA....",
        "....AAAAAAAA....",
        "......WWWW......",
        "......WNNW......",
        "......WWWW......",
        ".....EWWWWE.....",
    ],
    "jungle/corner-br": [
        "................",
        "................",
        ".....MMMMMM.....",
        "....MNNNNNNM....",
        "....MNYNNYNM....",
        "....MNNNNNNM....",
        ".....MNNNNM.....",
        "....MMKKKKMM....",
        "....MNKKKKNM....",
        "....MNMMMMNM....",
        "....MNNNNNNM....",
        "....MMNNNNMM....",
        ".....MMMMMM.....",
        ".....E....E.....",
        "................",
        "................",
    ],
    "jungle/banner": [
        "...............................",
        "...H..L..H.....HHHH.....H..L...",
        "..HLHLDHLH....HDDDHH...HLHLDH..",
        "...DGGGD......DGGGDH....DGGGD..",
        "....DDD........DDDD......DDD...",
        "...............................",
    ],
    "jungle/motif": [
        "........",
        "..H.....",
        ".HLH....",
        "..D.....",
        "........",
        ".....H..",
        "....HL..",
        ".....D..",
    ],
    "halloween/corner-tl": [
        "NNNNNNNNN.......",
        "N...N...N.......",
        "N.N.N.N.........",
        "N...N...N.......",
        "NNNN.N..N.......",
        "N...N.N.........",
        "N.N.N...N.......",
        "N...N...........",
        "N...............",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "halloween/corner-tr": [
        ".......NNNNNNNNN",
        ".......N...N...N",
        ".........N.N.N.N",
        ".......N...N...N",
        ".......N..N.NNNN",
        "..KK........N..N",
        "KKKK.KKKK...N.N.",
        "KKKKKKKKKK...N..",
        ".KK.KYKKYK......",
        "....KKKK........",
        ".....KK.........",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "halloween/corner-bl": [
        "................",
        ".......SS.......",
        "......SSSS......",
        "....OOOOOOOO....",
        "...OOYOOOOYOO...",
        "..OOYOOOOOOYOO..",
        "..OOOOOOOOOOOO..",
        "..OOKKOOOOOKKO..",
        "..OOOOOKKOOOOO..",
        "..OOYOOOOOOYOO..",
        "...OYOOOOOOYO...",
        "....OOOOOOOO....",
        ".....AAAAAA.....",
        "................",
        "................",
        "................",
    ],
    "halloween/corner-br": [
        "................",
        ".....MMMMMM.....",
        "....MNNNNNNM....",
        "....MNYYYYNM....",
        "....MNNNNNNM....",
        "....MN.KK.NM....",
        "....MNNNNNNM....",
        "....MN.KK.NM....",
        "....MNNNNNNM....",
        "....MMMMMMMM....",
        "...EEEEEEEEEE...",
        "..EE........EE..",
        "................",
        "................",
        "................",
        "................",
    ],
    "halloween/banner": [
        "...............................",
        "....SS.....SS.....SS...........",
        "...OOOO...OOOO...OOOO...KK.KK..",
        "..OOKKOO.OOKKOO.OOKKOO.KKKKKKK.",
        "...OOOO...OOOO...OOOO...KKKK...",
        "...............................",
    ],
    "halloween/motif": [
        "........",
        "..K.....",
        ".KYK....",
        "..K.....",
        "........",
        ".....Y..",
        "........",
        "........",
    ],
}


def hex_to_rgba(hex_col: str, a: int) -> tuple[int, int, int, int]:
    h = hex_col.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a


def png_bytes(width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        row = y * width
        for x in range(width):
            raw.extend(pixels[row + x])

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def scale_grid(rows: list[str], scale: int) -> tuple[int, int, list[tuple[int, int, int, int]]]:
    h0 = len(rows)
    w0 = max(len(r) for r in rows)
    w, h = w0 * scale, h0 * scale
    out = [(0, 0, 0, 0)] * (w * h)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            rgba = PAL.get(ch, (0, 0, 0, 0))
            if rgba[3] == 0:
                continue
            for dy in range(scale):
                for dx in range(scale):
                    out[(y * scale + dy) * w + (x * scale + dx)] = rgba
    return w, h, out


def pad_to(w: int, h: int, src_w: int, src_h: int, src: list[tuple[int, int, int, int]], anchor: str) -> list[tuple[int, int, int, int]]:
    out = [(0, 0, 0, 0)] * (w * h)
    ox = 0 if "l" in anchor else (w - src_w if "r" in anchor else (w - src_w) // 2)
    oy = 0 if "t" in anchor else (h - src_h if "b" in anchor else (h - src_h) // 2)
    for y in range(src_h):
        for x in range(src_w):
            px = src[y * src_w + x]
            if px[3] == 0:
                continue
            tx, ty = ox + x, oy + y
            if 0 <= tx < w and 0 <= ty < h:
                out[ty * w + tx] = px
    return out


def vignette(kind: str) -> tuple[int, int, list[tuple[int, int, int, int]]]:
    w = h = 256
    out = [(0, 0, 0, 0)] * (w * h)
    if kind == "jungle":
        edge = [(30, 90, 44, 50), (42, 112, 64, 36), (58, 136, 80, 28)]
    else:
        edge = [(201, 122, 32, 40), (88, 28, 120, 36), (40, 10, 28, 28)]
    for y in range(h):
        for x in range(w):
            edge_n = min(x, y, w - 1 - x, h - 1 - y)
            if edge_n > 48:
                continue
            if (x + y * 3) % 7 != 0:
                continue
            col = edge[(x + y) % len(edge)]
            fade = max(8, int(col[3] * (1 - edge_n / 48)))
            out[y * w + x] = (col[0], col[1], col[2], fade)
    return w, h, out


def write_png(path: Path, w: int, h: int, pixels: list[tuple[int, int, int, int]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png_bytes(w, h, pixels))
    print("wrote", path.relative_to(ROOT), f"{w}x{h}")


def main() -> None:
    anchors = {
        "corner-tl": "tl",
        "corner-tr": "tr",
        "corner-bl": "bl",
        "corner-br": "br",
        "banner": "c",
        "motif": "c",
    }
    for key, rows in SPRITES.items():
        pack, slot = key.split("/", 1)
        scale = 8 if slot.startswith("corner") else (4 if slot == "banner" else 8)
        sw, sh, pix = scale_grid(rows, scale)
        if slot.startswith("corner"):
            pix = pad_to(192, 192, sw, sh, pix, anchors[slot])
            sw = sh = 192
        elif slot == "banner":
            pix = pad_to(256, 48, sw, sh, pix, "c")
            sw, sh = 256, 48
        elif slot == "motif":
            pix = pad_to(64, 64, sw, sh, pix, "c")
            sw = sh = 64
        write_png(OUT / pack / f"{slot}.png", sw, sh, pix)

    for pack in ("jungle", "halloween"):
        w, h, pix = vignette(pack)
        write_png(OUT / pack / "vignette.png", w, h, pix)


if __name__ == "__main__":
    main()
