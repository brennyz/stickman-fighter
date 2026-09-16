#!/usr/bin/env python3
"""Generate stickman-pixel seasonal overlay SVGs + contract PNGs (integer pixels).

Halloween nest upgrade: denser cobwebs / pumpkins / bats on the 8 CSS slots.
Overlay budget: smoke-season-overlays.mjs requires each nested PNG < 8KB.
"""
from __future__ import annotations

import math
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
    "G": "#c97a20",
    "H": "#ffc46a",
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

# Vignette-only faded inks (lots of PNG alpha; CSS also fades the slot).
HALLOWEEN_VIGNETTE = {
    **HALLOWEEN,
    "1": ("#1a1020", 80),
    "2": ("#2a2038", 56),
    "3": ("#6a4090", 40),
    "4": ("#c45a10", 44),
    "5": ("#ff9a32", 36),
}

HALLOWEEN_SCALE = {
    "corner-tl": 4,
    "corner-tr": 4,
    "corner-bl": 4,
    "corner-br": 4,
    "banner": 4,
    "vignette": 4,
    "ground-trim": 4,
    "motif": 2,
}

PNG_BUDGET = 8000


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


def hex_rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha


def resolve_rgba(val: str | tuple) -> tuple[int, int, int, int]:
    if isinstance(val, tuple):
        if len(val) == 4 and all(isinstance(n, int) for n in val):
            return val  # type: ignore[return-value]
        if len(val) == 2 and isinstance(val[0], str):
            return hex_rgba(val[0], int(val[1]))
    return hex_rgba(str(val))


def css_fill(val: str | tuple) -> str:
    r, g, b, a = resolve_rgba(val)
    if a >= 255:
        return f"#{r:02x}{g:02x}{b:02x}"
    return f"rgba({r},{g},{b},{a / 255:.3f})"


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
            rects.append(
                f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{css_fill(palette[ch])}"/>'
            )
            x += run
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" shape-rendering="crispEdges" aria-hidden="true">\n'
        + "\n".join(rects)
        + "\n</svg>\n"
    )


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
                raw.extend(resolve_rgba(palette[ch]))

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", ihdr)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)


def write(
    pack: str,
    name: str,
    grid: list[list[str]],
    palette: dict[str, str],
    png: bool = False,
    scale: int = 4,
) -> Path:
    dest = OUT / pack / f"{name}.svg"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(svg_from_grid(grid, palette), encoding="utf-8")
    if png:
        write_png(OUT / pack / f"{name}.png", grid, palette, scale)
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
# Chip-accurate pumpkins (ASSET-STYLE gold / halloween orange / purple).
# Corners are 48×48 native ×4 = 192px (inside the 128–256 slot).

PUMPKIN_CHIP = [
    "........ss........",
    "........SS........",
    "......ssSSss......",
    "....HHPPPPPPpp....",
    "...HPPPpPPpPPPp...",
    "..HPPPPpPPpPPPPp..",
    ".HHPPPPpPPpPPPPPp.",
    ".HPPPPPpPPpPPPPDPp",
    ".PPPPPPpPPpPPPPDPp",
    ".PPPPPPpPPpPPPPDPp",
    ".pPPPPPpPPpPPPPDPp",
    "..pPPPPpPPpPPPDPp.",
    "...pPPPPpPPPPDPp..",
    "....ppPPPPPPPp....",
    ".....ppPPPPpp.....",
]

PUMPKIN_JACK = [
    "........ss........",
    "........SS........",
    "......ssSSss......",
    "....HHPPPPPPpp....",
    "...HPPPpPPpPPPp...",
    "..HPPPBE.EBPPPPp..",
    ".HHPPPPE.EPPPPPPp.",
    ".HPPPPPPPPPPPPPDPp",
    ".PPPPB.BPPB.BPPDPp",
    ".PPPPBBBBBBBBPPDPp",
    ".pPPPPBBBBBBPPPDPp",
    "..pPPPBBPPBBPPDPp.",
    "...pPPPPPPPPPDPp..",
    "....ppPPPPPPPp....",
    ".....ppPPPPpp.....",
]

PUMPKIN_S = [
    "....ss....",
    "....SS....",
    "..HPPPPpp.",
    ".HPBEBPPPp",
    "HPPPEEPPDP",
    "PPPPEEPPDP",
    "PPB.BB.PDP",
    ".pBBBBBDp.",
    "..ppPPPp..",
]

PUMPKIN_TINY = [
    "...s..",
    "..pPp.",
    ".pBEBp",
    ".pPPDp",
    "..pBp.",
    "...pp.",
]

BAT_XL = [
    "aa.....A.....aa",
    "aaa...AAA...aaa",
    "aaaaaaaaaaaaaaa",
    "aaaa.AAAAA.aaaa",
    ".aaa..ABA..aaa.",
    "..aa..A.A..aa..",
    "...a..A.A..a...",
]

BAT_L = [
    "a...A.A...a",
    "aa.AAAAA.aa",
    "aaaaaaaaaaa",
    ".aa.ABA.aa.",
    "..a.A.A.a..",
    "....A.A....",
]

BAT_M = [
    "a..A..a",
    "aaAAAAa",
    "aaaaaaa",
    ".aaAaa.",
    "..a.a..",
]

BAT_S = [
    "a.A.a",
    "aaaaa",
    ".aAa.",
]

SPIDER = [
    "A.A.A.A",
    ".A.A.A.",
    "..BBB..",
    ".ABCBA.",
    "A.A.A.A",
]

CANDY = [
    "..F..",
    ".fff.",
    ".ppp.",
    ".NNN.",
]

CANDLE = [
    "...F..",
    "..FfF.",
    "...f..",
    "..NN..",
    "..NnN.",
    "..NN..",
    "..nN..",
    "..NN..",
    ".ssss.",
    "..SS..",
]

MOON = [
    "...EEE.",
    "..EFFEE",
    ".EFFFEE",
    "EFFFFE.",
    "EFFFEE.",
    "EFFEE..",
    ".EEE...",
]


def line(g: list[list[str]], x0: int, y0: int, x1: int, y1: int, ch: str) -> None:
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    x, y = x0, y0
    while True:
        plot(g, x, y, ch)
        if x == x1 and y == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x += sx
        if e2 <= dx:
            err += dx
            y += sy


def _mirror(x: int, y: int, w: int, h: int, flip_x: bool, flip_y: bool) -> tuple[int, int]:
    return (w - 1 - x if flip_x else x, h - 1 - y if flip_y else y)


def draw_web(
    g: list[list[str]],
    reach: int = 44,
    flip_x: bool = False,
    flip_y: bool = False,
) -> None:
    """Quarter cobweb from a corner, chunky threads + gold/purple dew."""
    h = len(g)
    w = len(g[0])

    def put(x: int, y: int, ch: str) -> None:
        xx, yy = _mirror(x, y, w, h, flip_x, flip_y)
        plot(g, xx, yy, ch)

    def ray(x1: int, y1: int, ch: str) -> None:
        x0, y0 = 0, 0
        dx = abs(x1 - x0)
        dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        x, y = x0, y0
        while True:
            put(x, y, ch)
            if x == x1 and y == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x += sx
            if e2 <= dx:
                err += dx
                y += sy

    for i in range(reach + 2):
        put(i, 0, "W" if i % 2 == 0 else "w")
        put(0, i, "W" if i % 2 == 0 else "w")
        if i % 5 == 0:
            put(i, 1, "w")
            put(1, i, "w")

    n_rays = 7
    for i in range(n_rays):
        ang = (i / (n_rays - 1)) * (math.pi / 2)
        x1 = int(round(reach * math.sin(ang)))
        y1 = int(round(reach * math.cos(ang)))
        ray(x1, y1, "W" if i % 2 == 0 else "w")

    # Continuous rings so the web reads as a cobweb, not a sunburst.
    for r in range(6, reach, 6):
        steps = int(r * math.pi / 2) + 4
        for i in range(steps + 1):
            ang = (i / steps) * (math.pi / 2)
            x = int(round(r * math.sin(ang)))
            y = int(round(r * math.cos(ang)))
            ch = "W" if (r // 6) % 2 == 0 else "w"
            put(x, y, ch)
            if r % 12 == 0:
                put(x + (0 if flip_x else 1), y, ch)

    dews = (
        (9, 5, "E"),
        (16, 9, "C"),
        (7, 15, "E"),
        (24, 12, "C"),
        (12, 24, "E"),
        (32, 8, "C"),
        (20, 20, "E"),
        (6, 28, "C"),
    )
    for x, y, ch in dews:
        if x < reach and y < reach:
            put(x, y, ch)


def halloween_corner_tl() -> list[list[str]]:
    g = blank(48, 48)
    draw_web(g, reach=44)
    for y in range(8, 18):
        plot(g, 15, y, "w")
    stamp(g, 12, 17, SPIDER)
    stamp(g, 32, 6, BAT_M)
    stamp(g, 26, 30, CANDY)
    return g


def halloween_corner_tr() -> list[list[str]]:
    g = blank(48, 48)
    draw_web(g, reach=28, flip_x=True)
    stamp(g, 6, 3, MOON)
    stamp(g, 14, 10, BAT_XL)
    stamp(g, 4, 22, BAT_S)
    stamp(g, 38, 16, [
        "A.A",
        ".B.",
        "A.A",
    ])
    plot(g, 10, 8, "E")
    plot(g, 11, 8, "C")
    return g


def halloween_rail_l() -> list[list[str]]:
    g = blank(16, 48)
    stamp(g, 6, 18, CANDLE)
    plot(g, 3, 14, "C")
    plot(g, 12, 16, "c")
    plot(g, 4, 22, "E")
    stamp(g, 1, 6, BAT_S)
    return g


def halloween_corner_bl() -> list[list[str]]:
    g = blank(48, 48)
    draw_web(g, reach=16, flip_y=True)
    for x in range(48):
        plot(g, x, 47, "S" if x % 3 else "s")
        if x % 4 == 0:
            plot(g, x, 46, "s")
    stamp(g, 1, 27, PUMPKIN_JACK)
    stamp(g, 22, 30, PUMPKIN_CHIP)
    stamp(g, 38, 36, PUMPKIN_S)
    stamp(g, 18, 24, CANDY)
    stamp(g, 32, 20, BAT_S)
    return g


def halloween_corner_br() -> list[list[str]]:
    g = blank(48, 48)
    draw_web(g, reach=14, flip_x=True, flip_y=True)
    for x in range(48):
        plot(g, x, 47, "S" if x % 4 else "s")
    stamp(g, 26, 27, PUMPKIN_JACK)
    stamp(g, 14, 26, CANDLE)
    stamp(g, 2, 16, BAT_XL)
    stamp(g, 8, 36, CANDY)
    stamp(g, 20, 36, PUMPKIN_TINY)
    plot(g, 18, 22, "C")
    plot(g, 19, 23, "E")
    return g


def halloween_crest() -> list[list[str]]:
    g = blank(24, 24)
    stamp(g, 5, 6, PUMPKIN_S)
    stamp(g, 2, 2, BAT_S)
    return g


def halloween_rail_r() -> list[list[str]]:
    return flip_h(halloween_rail_l())


def halloween_banner() -> list[list[str]]:
    g = blank(80, 16)
    for x in range(80):
        plot(g, x, 0, "W" if x % 2 == 0 else "w")
        if x % 8 == 0:
            plot(g, x, 1, "w")
        if x % 10 == 0:
            hang = 5 + (x // 10) % 4
            for y in range(1, hang):
                plot(g, x, y, "w")
            if hang >= 6:
                plot(g, x, hang, "C" if x % 20 else "E")
    stamp(g, 1, 5, PUMPKIN_S)
    stamp(g, 14, 3, BAT_L)
    stamp(g, 34, 2, BAT_XL)
    stamp(g, 54, 4, BAT_L)
    stamp(g, 69, 5, PUMPKIN_S)
    stamp(g, 30, 10, CANDY)
    return g


def halloween_ground() -> list[list[str]]:
    g = blank(80, 16)
    for x in range(80):
        plot(g, x, 15, "S" if x % 3 else "s")
        if x % 5 == 2:
            plot(g, x, 14, "s")
    stamp(g, 1, 6, PUMPKIN_S)
    stamp(g, 14, 8, PUMPKIN_TINY)
    stamp(g, 24, 0, PUMPKIN_CHIP)
    stamp(g, 46, 8, CANDY)
    stamp(g, 54, 0, PUMPKIN_JACK)
    stamp(g, 72, 8, PUMPKIN_TINY)
    return g


def halloween_vignette() -> list[list[str]]:
    """Corner wash only — center stays empty so menus stay readable."""
    g = blank(64, 64)

    def corner_dust(ox: int, oy: int, sx: int, sy: int) -> None:
        for i in range(18):
            for j in range(18 - i):
                # clustered dither (run-friendly, lots of holes)
                if (i + j) % 2 != 0:
                    continue
                if i + j < 6:
                    ch = "1"
                elif i + j < 11:
                    ch = "2"
                else:
                    ch = "3"
                plot(g, ox + sx * j, oy + sy * i, ch)
                if (i + j) % 6 == 0 and i + j < 10:
                    plot(g, ox + sx * j, oy + sy * i, "4")

    corner_dust(0, 0, 1, 1)
    corner_dust(63, 0, -1, 1)
    corner_dust(0, 63, 1, -1)
    corner_dust(63, 63, -1, -1)
    stamp(g, 6, 4, BAT_S)
    stamp(g, 52, 6, BAT_S)
    stamp(g, 8, 54, [
        "a.A.a",
        "aaaaa",
        ".aAa.",
    ])
    # faint web ticks, not a solid diamond
    for i in range(10):
        plot(g, i, 0, "w")
        plot(g, 0, i, "w")
        plot(g, 63 - i, 0, "w")
        plot(g, 63, i, "w")
    return g


def halloween_motif() -> list[list[str]]:
    """32×32 tileable scatter — mostly empty so a repeat does not fill the screen."""
    g = blank(32, 32)
    stamp(g, 3, 3, BAT_S)
    stamp(g, 22, 20, CANDY)
    plot(g, 16, 10, "C")
    plot(g, 8, 24, "E")
    return g


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


def jungle_motif() -> list[list[str]]:
    return jungle_crest()


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
        write("jungle", name, grid, JUNGLE, png=name in CONTRACT_SLOTS, scale=4)
    for name, grid in halloween.items():
        pal = HALLOWEEN_VIGNETTE if name == "vignette" else HALLOWEEN
        write(
            "halloween",
            name,
            grid,
            pal,
            png=name in CONTRACT_SLOTS,
            scale=HALLOWEEN_SCALE.get(name, 4),
        )
    write_sheet("jungle", list(CONTRACT_SLOTS), JUNGLE)
    write_sheet("halloween", list(CONTRACT_SLOTS), HALLOWEEN)
    print("wrote seasonal pixel packs →", OUT)
    for pack in ("jungle", "halloween"):
        for name in CONTRACT_SLOTS:
            p = OUT / pack / f"{name}.png"
            if not p.exists():
                continue
            data = p.read_bytes()
            w = int.from_bytes(data[16:20], "big")
            h = int.from_bytes(data[20:24], "big")
            n = p.stat().st_size
            flag = " OVER" if n >= PNG_BUDGET else ""
            print(f"  {pack}/{name}.png {w}x{h} {n}B{flag}")


if __name__ == "__main__":
    main()
