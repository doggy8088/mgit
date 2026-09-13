#!/usr/bin/env python3
"""Lay the generated plates' grain on the design system's own tones.

The three shipped textures are photographs of material; the prompts that made
them live beside the shipped files as website/assets/plates/*.prompt.txt and
their originals are kept here in texture-sources/. Photographed straight, their
grain is far too even to read: measured detail sigma is 1.3-4.5 levels out of
255, and the scrims the CSS used to lay them down (0.94 paper, 0.88 graphite,
0.78 chart) let 6-22% of that through, so every dark surface on the page
measured a spread of 3/255 — a flat fill carrying a material's name.

This script keeps the photographed grain and re-lays it on the exact token
colour at a chosen amplitude. That is also what makes the tone predictable: the
mean of the output is the token, only the grain varies.

    cd website/build && python3 make-textures.py

Inputs:  texture-sources/<name>.jpg   (generated plate, provenance embedded)
Outputs: ../assets/plates/<name>.jpg  (shipped; re-embed the provenance with
         `impeccable embed-prompt <file> --prompt-file <file>.prompt.txt` and
         keep the sidecar's post-process note in step with the recipes below)
"""

import numpy as np
from pathlib import Path
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
SRC = HERE / "texture-sources"
OUT = HERE.parent / "assets" / "plates"

# name: (base colour = the token it stands on, target grain sigma /255, blur radius px)
RECIPES = {
    "paper-fibre": ((245, 246, 244), 3.2, 5),
    "graphite-plate": ((25, 26, 29), 4.0, 4),
    "chart-paper": ((245, 246, 244), 4.4, 6),
}


def rebuild(name, base, sigma, radius):
    src = Image.open(SRC / f"{name}.jpg").convert("L")
    flat = np.asarray(src, dtype=np.float32)
    blurred = np.asarray(src.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32)
    detail = flat - blurred
    detail -= detail.mean()  # the grain, with no tone of its own
    gain = sigma / detail.std()
    colour = np.asarray(base, dtype=np.float32).reshape(1, 1, 3)
    out = np.clip(colour + (detail * gain)[..., None], 0, 255).astype(np.uint8)
    image = Image.fromarray(out, "RGB")
    image.save(OUT / f"{name}.jpg", quality=86, optimize=True, subsampling=0)
    measured = (detail * gain).std()
    size = (OUT / f"{name}.jpg").stat().st_size
    print(
        f"{name:16s} base {base}  grain sigma {measured:.2f}/255  "
        f"{image.width}x{image.height}  {size // 1024}KB"
    )


if __name__ == "__main__":
    for name, (base, sigma, radius) in RECIPES.items():
        rebuild(name, base, sigma, radius)
