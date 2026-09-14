#!/usr/bin/env python3
"""Generate stickman-pixel seasonal overlay SVGs (integer pixels, merged runs)."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "seasons"

# CSS-pair contract (#279 / docs/SEASON-ASSET-SLOTS.md)
CONTRACT_SLOTS = (
    "corner-tl",
    "corner-tr",
    "corner-bl",
    "corner-br",
    "banner",
    "vignette",
    "ground-trim",
    "motif",
)

JUNGLE = {
    "V": "#5a3818",
    "v": "#8a6030",
    "w": "#c4a36a",
    "D": "#1d4a2c",
    "M": "#276238",
    "L": "#4ecf6a",
    "H": "#7cfc8a",
    "F": "#ffd75e",
    "O": "#c97a20",
    "K": "#3a3228",
    "S": "#6a6054",
}

HALLOWEEN = {
    "P": "#e67a1a",
    "p": "#ff9a32",
    "D": "#c45a10",
    "S": "#3d2a12",
    "s": "#6a4a1c",
    "E": "#ffd75e",
    "B": "#1a1020",
    "W": "#d8d0e8",
    "w": "#9a90b0",
    "A": "#2a2038",
    "a": "#4a3860",
    "C": "#c792ff",
    "c": "#6a4090",
    "F": "#fff4c8",
    "f": "#ffb040",
    "N": "#f2efe6",
    "n": "#d4c4a0",
}


def blank(w: int, h: int) -> list[list[str]]:
    return [["."] * w for _ in range(h)]


def plot(g: list[list[str]], x: int, y: int, ch: str) -> None:
    if 0 <= y < len(g) and 0 <= x < len(g[0]) and ch != ".":
        g[y][x] = ch


def rect(g: list[list[str]], x: int, y: int, w: int, h: int, ch: str) -> None:
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            plot(g, xx, yy, ch)


def flip_h(g: list[list[str]]) -> list[list[str]]:
    return [row[::-1] for row in g]


def stamp(g: list[list[str]], ox: int, oy: int, sprite: list[str], skip: str = ".") -> None:
    for y, row in enumerate(sprite):
        for x, ch in enumerate(row):
            if ch != skip:
                plot(g, ox + x, oy + y, ch)


def svg_from_grid(grid: list[list[str]], palette: dict[str, str]) -> str:
    h = len(grid)
    w = len(grid[0]) if h else 0
    rects: list[str] = []
    for y, row in enumerate(grid):
        x = 0
        while x < w:
            ch = row[x]
            if ch == "." or ch not in palette:
                x += 1
                continue
            run = 1
            while x + run < w and row[x + run] == ch:
                run += 1
            color = palette[ch]
            rects.append(
                f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{color}"/>'
            )
            x += run
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" shape-rendering="crispEdges" aria-hidden="true">\n'
        + "\n".join(rects)
        + "\n</svg>\n"
    )


def hex_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def scale_grid(grid: list[list[str]], n: int) -> list[list[str]]:
    out: list[list[str]] = []
    for row in grid:
        scaled = []
        for ch in row:
            scaled.extend([ch] * n)
        for _ in range(n):
            out.append(list(scaled))
    return out


def write_png(path: Path, grid: list[list[str]], palette: dict[str, str], scale: int = 4) -> None:
    g = scale_grid(grid, scale)
    h = len(g)
    w = len(g[0]) if h else 0
    raw = bytearray()
    for row in g:
        raw.append(0)
        for ch in row:
            if ch == "." or ch not in palette:
                raw.extend((0, 0, 0, 0))
            else:
                raw.extend(hex_rgba(palette[ch]))

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def write(pack: str, name: str, grid: list[list[str]], palette: dict[str, str], png: bool = False) -> Path:
    dest = OUT / pack / f"{name}.svg"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(svg_from_grid(grid, palette), encoding="utf-8")
    if png:
        write_png(OUT / pack / f"{name}.png", grid, palette, 4)
    return dest


# ── Jungle sprites ────────────────────────────────────────────────────────

LEAF = [
    "..DMMD..",
    ".DMLLMD.",
    "DMLHHLMD",
    ".MLHHLM.",
    "..MLLM..",
    "...MM...",
]

LEAF_S = [
    ".DM.",
    "DMLD",
    "MLHM",
    ".MM.",
]

FERN = [
    "....H....",
    "...LHL...",
    "..LMLML..",
    ".LMDMDML.",
    "LM.D.D.ML",
    "M.......M",
]


def jungle_corner_tl() -> list[list[str]]:
    g = blank(32, 32)
    # hanging vine from top-left
    for i in range(18):
        plot(g, 1 + (i % 3 == 2), i, "V" if i % 2 == 0 else "v")
        if i % 4 == 0:
            plot(g, 2, i, "w")
    for i in range(10):
        plot(g, i, 1, "V")
        if i % 2:
            plot(g, i, 2, "v")
    stamp(g, 3, 4, LEAF)
    stamp(g, 8, 9, LEAF_S)
    stamp(g, 2, 14, LEAF)
    stamp(g, 10, 2, LEAF_S)
    # gold fruit
    rect(g, 12, 16, 2, 2, "F")
    plot(g, 12, 16, "O")
    return g


def jungle_rail_l() -> list[list[str]]:
    g = blank(16, 48)
    for y in range(48):
        x = 7 + (1 if y % 6 >= 3 else 0)
        plot(g, x, y, "V" if y % 2 == 0 else "v")
        if y % 5 == 0:
            plot(g, x + 1, y, "w")
    stamp(g, 1, 4, LEAF)
    stamp(g, 8, 14, LEAF_S)
    stamp(g, 0, 24, LEAF)
    stamp(g, 8, 34, LEAF_S)
    rect(g, 3, 40, 2, 2, "F")
    return g


def jungle_corner_bl() -> list[list[str]]:
    g = blank(32, 32)
    # rock
    rect(g, 2, 24, 10, 6, "K")
    rect(g, 3, 23, 8, 1, "S")
    rect(g, 4, 28, 7, 2, "S")
    stamp(g, 6, 14, FERN)
    stamp(g, 1, 18, LEAF)
    stamp(g, 14, 20, LEAF_S)
    rect(g, 18, 26, 2, 2, "F")
    plot(g, 18, 26, "O")
    return g


def jungle_crest() -> list[list[str]]:
    g = blank(24, 24)
    stamp(g, 8, 2, LEAF)
    stamp(g, 2, 8, LEAF)
    stamp(g, 14, 8, LEAF)
    rect(g, 11, 14, 2, 6, "V")
    plot(g, 11, 13, "w")
    rect(g, 10, 19, 4, 2, "F")
    return g


# ── Halloween sprites ─────────────────────────────────────────────────────

PUMPKIN = [
    "......ss......",
    "......SS......",
    "....ppPPpp....",
    "...pPPPPPPPp..",
    "..pPPPEEPPPPp.",
    ".pPPEBBEEPPPPp",
    ".pPPPEEPPPPPPp",
    ".pPPPPPPPPPPPp",
    ".pPPBPPPPBPPPp",
    "..pPBBBBBBPPp.",
    "...pPPPPPPPp..",
    "....ppPPpp....",
]

PUMPKIN_B = [
    "......ss......",
    "......SS......",
    "....ppPPpp....",
    "...pPPPPPPPp..",
    "..pPPEBBEPPpp.",
    ".pPPPEEEPPPPPp",
    ".pPPPPPPPPPPPp",
    ".pPPEPPPPPPEPp",
    ".pPPBBBBBBPPPp",
    "..pPBBPPBBPPp.",
    "...pPPPPPPPp..",
    "....ppPPpp....",
]


def halloween_corner_tl() -> list[list[str]]:
    g = blank(32, 32)
    # cobweb: radial threads + arcs
    for i in range(20):
        plot(g, i, 0, "W" if i % 2 == 0 else "w")
        plot(g, 0, i, "W" if i % 2 == 0 else "w")
    for i in range(18):
        plot(g, i, i // 2, "w" if i % 3 else "W")
        plot(g, i // 2, i, "w" if i % 3 else "W")
        if i < 14:
            plot(g, i, i, "W")
    for r in (5, 10, 15):
        for i in range(r + 1):
            plot(g, i, r - i // 2, "w")
            plot(g, r - i // 2, i, "w")
    # spider
    plot(g, 8, 8, "B")
    plot(g, 7, 8, "A")
    plot(g, 9, 8, "A")
    plot(g, 8, 7, "A")
    plot(g, 8, 9, "A")
    return g


def halloween_bat() -> list[str]:
    return [
        "a...A...a",
        "aa.AAA.aa",
        "aaaaaaaaa",
        ".aa.A.aa.",
        "..a...a..",
    ]


def halloween_corner_tr() -> list[list[str]]:
    g = flip_h(halloween_corner_tl())
    stamp(g, 20, 4, halloween_bat())
    return g


def halloween_rail_l() -> list[list[str]]:
    g = blank(16, 48)
    # candle
    rect(g, 6, 16, 4, 22, "N")
    rect(g, 7, 16, 2, 22, "n")
    rect(g, 5, 37, 6, 3, "s")
    rect(g, 6, 38, 4, 2, "S")
    # flame
    rect(g, 7, 10, 2, 6, "f")
    plot(g, 7, 9, "F")
    plot(g, 8, 9, "F")
    plot(g, 7, 8, "F")
    plot(g, 8, 11, "F")
    # drip wax
    plot(g, 9, 20, "N")
    plot(g, 9, 21, "N")
    plot(g, 5, 24, "n")
    # purple glow dots
    plot(g, 3, 12, "C")
    plot(g, 12, 14, "c")
    return g


def halloween_corner_bl() -> list[list[str]]:
    g = blank(32, 32)
    stamp(g, 2, 16, PUMPKIN)
    # tiny candy-corn
    plot(g, 20, 26, "F")
    plot(g, 19, 27, "p")
    plot(g, 20, 27, "p")
    plot(g, 21, 27, "p")
    plot(g, 18, 28, "N")
    plot(g, 19, 28, "N")
    plot(g, 20, 28, "N")
    plot(g, 21, 28, "N")
    plot(g, 22, 28, "N")
    return g


def halloween_corner_br() -> list[list[str]]:
    g = blank(32, 32)
    stamp(g, 14, 16, PUMPKIN_B)
    stamp(g, 4, 20, halloween_bat())
    return g


def halloween_crest() -> list[list[str]]:
    g = blank(24, 24)
    stamp(g, 5, 6, [
        "......ss......",
        "......SS......",
        "....ppPPpp....",
        "...pPPEEPPP...",
        "..pPEBBEEPPPp.",
        ".pPPPEEPPPPPp.",
        ".pPPPPPPPPPPp.",
        "..pPBBBBBBpp..",
        "...pPPPPPPp...",
        "....ppPPpp....",
    ])
    return g


def halloween_rail_r() -> list[list[str]]:
    return flip_h(halloween_rail_l())


def jungle_banner() -> list[list[str]]:
    g = blank(80, 16)
    for x in range(80):
        if x % 7 < 2:
            plot(g, x, 0, "V")
        if x % 11 == 0:
            stamp(g, x, 1, LEAF_S)
        if x % 13 == 3:
            stamp(g, x, 4, LEAF_S)
    stamp(g, 8, 2, LEAF)
    stamp(g, 36, 1, LEAF)
    stamp(g, 62, 3, LEAF)
    return g


def halloween_banner() -> list[list[str]]:
    g = blank(80, 16)
    for x in range(80):
        plot(g, x, 0, "W" if x % 2 == 0 else "w")
        if x % 6 == 0:
            plot(g, x, 1, "w")
        if x % 10 == 0:
            for y in range(min(8, 16)):
                plot(g, x, y, "w")
    stamp(g, 18, 3, halloween_bat())
    stamp(g, 52, 2, halloween_bat())
    return g


def jungle_ground() -> list[list[str]]:
    g = blank(48, 16)
    stamp(g, 2, 4, FERN)
    stamp(g, 16, 6, LEAF_S)
    stamp(g, 28, 3, FERN)
    rect(g, 40, 12, 3, 2, "F")
    plot(g, 40, 12, "O")
    for x in range(48):
        plot(g, x, 15, "D" if x % 3 else "M")
    return g


def halloween_ground() -> list[list[str]]:
    g = blank(48, 16)
    stamp(g, 2, 4, [
        "....ss....",
        "....SS....",
        "..ppPPpp..",
        ".pPPEEPPp.",
        "pPEBBEEPPp",
        "pPPPEEPPPp",
        ".pBBBBBPp.",
        "..ppPPpp..",
    ])
    stamp(g, 28, 5, [
        "...ss...",
        "...SS...",
        ".ppPPpp.",
        "pPPEEPPp",
        "pEBBEEPp",
        "pPPPPPPp",
        ".pBBBBp.",
        "..pPPp..",
    ])
    for x in range(48):
        plot(g, x, 15, "S" if x % 4 else "s")
    return g


def jungle_vignette() -> list[list[str]]:
    g = blank(64, 64)
    for i in range(18):
        for j in range(18 - i):
            ch = "D" if i + j < 8 else "M"
            plot(g, j, i, ch)
            plot(g, 63 - j, i, ch)
            plot(g, j, 63 - i, ch)
            plot(g, 63 - j, 63 - i, ch)
    return g


def halloween_vignette() -> list[list[str]]:
    g = blank(64, 64)
    for i in range(16):
        for j in range(16 - i):
            ch = "B" if i + j < 7 else "A"
            plot(g, j, i, ch)
            plot(g, 63 - j, i, ch)
            plot(g, j, 63 - i, ch)
            plot(g, 63 - j, 63 - i, ch)
    return g


def jungle_motif() -> list[list[str]]:
    return jungle_crest()


def halloween_motif() -> list[list[str]]:
    return halloween_crest()


def write_sheet(pack: str, files: list[str], palette: dict[str, str], cell: int = 48) -> None:
    """Simple labeled sheet for PR preview (not used in-game)."""
    cols = 4
    rows = (len(files) + cols - 1) // cols
    w = cols * cell
    h = rows * cell
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" shape-rendering="crispEdges">'
        f'<rect width="{w}" height="{h}" fill="#0a0d18"/>'
    ]
    for i, name in enumerate(files):
        cx = (i % cols) * cell
        cy = (i // cols) * cell
        href = f"{name}.svg"
        parts.append(
            f'<image href="{href}" x="{cx + 4}" y="{cy + 4}" width="{cell - 8}" height="{cell - 8}" '
            f'style="image-rendering:pixelated"/>'
        )
        parts.append(
            f'<text x="{cx + cell/2}" y="{cy + cell - 3}" fill="#9db1e3" font-size="5" '
            f'text-anchor="middle" font-family="monospace">{name}</text>'
        )
    parts.append("</svg>\n")
    (OUT / pack / "_sheet.svg").write_text("\n".join(parts), encoding="utf-8")


def main() -> None:
    jungle = {
        "corner-tl": jungle_corner_tl(),
        "corner-tr": flip_h(jungle_corner_tl()),
        "corner-bl": jungle_corner_bl(),
        "corner-br": flip_h(jungle_corner_bl()),
        "banner": jungle_banner(),
        "vignette": jungle_vignette(),
        "ground-trim": jungle_ground(),
        "motif": jungle_motif(),
        "rail-l": jungle_rail_l(),
        "rail-r": flip_h(jungle_rail_l()),
        "crest": jungle_crest(),
    }
    halloween = {
        "corner-tl": halloween_corner_tl(),
        "corner-tr": halloween_corner_tr(),
        "corner-bl": halloween_corner_bl(),
        "corner-br": halloween_corner_br(),
        "banner": halloween_banner(),
        "vignette": halloween_vignette(),
        "ground-trim": halloween_ground(),
        "motif": halloween_motif(),
        "rail-l": halloween_rail_l(),
        "rail-r": halloween_rail_r(),
        "crest": halloween_crest(),
    }
    for name, grid in jungle.items():
        write("jungle", name, grid, JUNGLE, png=name in CONTRACT_SLOTS)
    for name, grid in halloween.items():
        write("halloween", name, grid, HALLOWEEN, png=name in CONTRACT_SLOTS)
    write_sheet("jungle", list(CONTRACT_SLOTS), JUNGLE)
    write_sheet("halloween", list(CONTRACT_SLOTS), HALLOWEEN)
    print("wrote seasonal pixel packs →", OUT)


if __name__ == "__main__":
    main()
