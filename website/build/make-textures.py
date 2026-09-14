#!/usr/bin/env python3
"""Turn the generated grain sources into the textures the site actually ships.

A generated texture cannot be used as it comes: laid straight onto the page it
either disappears (the grain is too even to survive the browser's scaling) or
it drags the whole surface off the colour the design system declares. So the
grain is separated from its own lighting, re-centred on the exact token colour
it will sit on, and given a measured amplitude.

    python3 website/build/make-textures.py

Every output carries its generation prompt: as a sidecar .prompt.txt and inside
the JPEG comment, so a texture can never end up in the repository without a
record of where it came from.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SOURCES = HERE / "texture-sources"
OUT = HERE.parent / "assets" / "img" / "textures"

# name -> (source, token colour it is laid on, target grain sigma in 0-255)
# The sigma here is the one that has to survive tiling and JPEG, so the script
# measures the file it just wrote and corrects the amplitude until it lands.
# Below about 2 the grain stops being visible; above about 4 it starts reading
# as noise rather than as a surface.
TEXTURES = {
    "page-light": ("grain-light.jpg", "#fbfbfa", 3.0),
    "panel-light": ("grain-light.jpg", "#f5f6f3", 3.4),
    "page-dark": ("grain-dark.jpg", "#0d1013", 3.2),
    "panel-dark": ("grain-dark.jpg", "#1a2128", 3.6),
    "terminal": ("grain-dark.jpg", "#0b0f14", 3.0),
}

TILE = 384  # the tile the page repeats; smaller files, no visible seam at this grain


def prompt_for(source: str) -> str:
    path = SOURCES / (Path(source).stem + ".prompt.txt")
    return path.read_text(encoding="utf-8") if path.exists() else ""


def grain_of(image: Image.Image) -> np.ndarray:
    """The high frequency part of a texture, with its own lighting removed."""
    grey = np.asarray(image.convert("L")).astype(np.float64)
    lighting = np.asarray(image.convert("L").filter(ImageFilter.GaussianBlur(24))).astype(np.float64)
    grain = grey - lighting
    return grain - grain.mean()


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def build(name: str, source: str, colour: str, sigma: float) -> Path:
    image = Image.open(SOURCES / source)

    # Resize the grain first, then set its amplitude: scaling averages
    # neighbouring pixels and would otherwise quietly flatten the texture.
    grain = grain_of(image)
    grain_tile = np.asarray(
        Image.fromarray((grain - grain.min()).astype(np.float32), "F").resize((TILE, TILE), Image.LANCZOS)
    ).astype(np.float64)
    grain_tile -= grain_tile.mean()

    base = np.array(hex_to_rgb(colour), dtype=np.float64)
    out = OUT / f"{name}.jpg"

    # JPEG is a low pass filter, so the amplitude that goes in is not the
    # amplitude that comes out. Write, measure, correct, repeat.
    amplitude = sigma
    for _ in range(8):
        scaled = grain_tile * (amplitude / grain_tile.std())
        stack = np.clip(np.repeat(scaled[:, :, None], 3, axis=2) + base, 0, 255).astype(np.uint8)
        texture = Image.fromarray(stack, "RGB")
        write(texture, out, name, source, colour, sigma)
        measured = measure(out)[1]
        if abs(measured - sigma) <= 0.08 or measured <= 0:
            break
        amplitude *= sigma / measured
    return out


def write(texture: Image.Image, out: Path, name: str, source: str, colour: str, sigma: float) -> None:
    comment = (
        f"mgit website texture '{name}'. Generated grain from {source} "
        f"(prompt in {source.replace('.jpg', '.prompt.txt')}), re-laid on {colour} "
        f"at sigma {sigma}. Generated with Azure OpenAI gpt-image-2.\n\n" + prompt_for(source)
    )
    texture.save(out, quality=94, optimize=True, comment=comment.encode("utf-8")[:65000])
    (OUT / f"{name}.prompt.txt").write_text(comment, encoding="utf-8")
    return out


def measure(path: Path) -> tuple[float, float, int, int]:
    grey = np.asarray(Image.open(path).convert("L")).astype(np.float64)
    return grey.mean(), grey.std(), int(grey.min()), int(grey.max())


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"{'texture':14s} {'on':9s} {'mean':>6s} {'sigma':>6s} {'min':>4s} {'max':>4s}  size")
    for name, (source, colour, sigma) in TEXTURES.items():
        path = build(name, source, colour, sigma)
        mean, deviation, low, high = measure(path)
        print(
            f"{name:14s} {colour:9s} {mean:6.1f} {deviation:6.2f} {low:4d} {high:4d}"
            f"  {path.stat().st_size / 1024:.0f} KB"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
