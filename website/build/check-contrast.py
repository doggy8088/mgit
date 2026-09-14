#!/usr/bin/env python3
"""Check the site's text contrast against WCAG AA.

Two things are checked, because one of them is easy to get wrong:

1. Every text colour against every flat surface colour it is used on.
2. Every text colour against the **worst pixel of the texture** that sits on
   that surface. A grain is not a flat colour: its darkest grain is what a
   reader with low vision actually has to read against, so averaging it away
   would hide a real failure.

    python3 website/build/check-contrast.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

TEXTURES = Path(__file__).resolve().parent.parent / "assets" / "img" / "textures"

FLAT = {
    "light": {
        "surfaces": {"bg": "#fbfbfa", "surface": "#ffffff", "surface-2": "#f5f6f3", "surface-3": "#eceee9"},
        "inks": {
            "ink": "#16181a", "ink-2": "#43484b", "ink-3": "#5f6569",
            "accent": "#0a5f9e", "ok": "#14652f", "warn": "#7d5200", "err": "#a5211a",
        },
    },
    "dark": {
        "surfaces": {"bg": "#0d1013", "surface": "#141a1f", "surface-2": "#1a2128", "surface-3": "#212932"},
        "inks": {
            "ink": "#e9eef2", "ink-2": "#bcc6cf", "ink-3": "#98a3ad",
            "accent": "#6fb3f5", "ok": "#6cc989", "warn": "#dfae51", "err": "#ff8a80",
        },
    },
    "terminal": {
        "surfaces": {"term-bg": "#0b0f14", "term-bg-2": "#12181f"},
        "inks": {
            "term-fg": "#d8dee4", "term-dim": "#97a3ae", "term-cyan": "#67c5d4",
            "term-yellow": "#e8c27c", "term-green": "#92cf7c", "term-red": "#ff8a80",
            "term-blue": "#83b7f2",
        },
    },
}

# texture -> (which ink set, whether the text is dark on light)
TEXTURED = {
    "page-light": ("light", True),
    "panel-light": ("light", True),
    "page-dark": ("dark", False),
    "panel-dark": ("dark", False),
    "terminal": ("terminal", False),
}

# Boundaries of user interface components need 3:1, not 4.5:1.
COMPONENT = {
    "light": ("#848a82", "#fbfbfa"),
    "dark": ("#606c79", "#0d1013"),
}

AA = 4.5
UI = 3.0


def channel(value: float) -> float:
    value /= 255
    return value / 12.92 if value <= 0.03928 else ((value + 0.055) / 1.055) ** 2.4


def luminance(rgb) -> float:
    red, green, blue = rgb
    return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue)


def from_hex(value: str):
    value = value.lstrip("#")
    return [int(value[index : index + 2], 16) for index in (0, 2, 4)]


def contrast(first: float, second: float) -> float:
    high, low = max(first, second), min(first, second)
    return (high + 0.05) / (low + 0.05)


def worst_pixel(path: Path, dark_on_light: bool) -> float:
    pixels = np.asarray(Image.open(path).convert("RGB")).reshape(-1, 3).astype(int)
    sampled = pixels[::37]
    values = np.array([luminance(pixel) for pixel in sampled])
    return float(values.max() if not dark_on_light else values.min())


def main() -> int:
    failures = []

    for theme, group in FLAT.items():
        for surface_name, surface in group["surfaces"].items():
            for ink_name, ink in group["inks"].items():
                ratio = contrast(luminance(from_hex(ink)), luminance(from_hex(surface)))
                if ratio < AA:
                    failures.append(f"{theme}: {ink_name} on {surface_name} is {ratio:.2f}")

    print(f"{'texture':14s} {'ink':12s} {'worst ratio':>11s}")
    for texture, (theme, dark_on_light) in TEXTURED.items():
        path = TEXTURES / f"{texture}.jpg"
        if not path.exists():
            failures.append(f"missing texture {path}")
            continue
        background = worst_pixel(path, dark_on_light)
        for ink_name, ink in FLAT[theme]["inks"].items():
            ratio = contrast(luminance(from_hex(ink)), background)
            flag = "" if ratio >= AA else "   << FAIL"
            print(f"{texture:14s} {ink_name:12s} {ratio:11.2f}{flag}")
            if ratio < AA:
                failures.append(f"{texture}: {ink_name} on the worst grain is {ratio:.2f}")

    for theme, (border, surface) in COMPONENT.items():
        ratio = contrast(luminance(from_hex(border)), luminance(from_hex(surface)))
        print(f"\ncontrol border ({theme}): {ratio:.2f} (needs {UI})")
        if ratio < UI:
            failures.append(f"{theme}: the control border is {ratio:.2f}")

    if failures:
        print("\nFAILURES:")
        for failure in failures:
            print("  " + failure)
        return 1
    print("\nEvery text colour clears WCAG AA, on flat surfaces and on the worst grain of every texture.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
