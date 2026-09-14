#!/usr/bin/env python3
"""Render the site's raster assets from the two sources that define them:
assets/favicon.svg for every icon, and build/og-template.html for the social
card. Chrome is used as the renderer because it is the same engine that will
show the page, so the card cannot drift from the site's own typography.

    python3 website/build/make-assets.py

Needs Google Chrome and Pillow. The outputs are committed, so this only has to
run when the mark or the card changes.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
SITE = HERE.parent
IMG = SITE / "assets" / "img"
BACKDROP = (11, 15, 20, 255)  # --term-bg, the ground the mark is drawn on

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
]


def find_chrome() -> str:
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    raise SystemExit(
        "make-assets: no Chrome or Chromium found. Set one of: "
        + ", ".join(CHROME_CANDIDATES)
    )


def shoot(chrome: str, url: str, out: Path, width: int, height: int, transparent: bool) -> None:
    command = [
        chrome,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        f"--screenshot={out}",
        f"--window-size={width},{height}",
        url,
    ]
    if transparent:
        command.insert(-1, "--default-background-color=00000000")
    result = subprocess.run(command, capture_output=True, text=True)
    if not out.exists():
        raise SystemExit(f"make-assets: Chrome produced nothing for {url}\n{result.stderr}")


def on_backdrop(icon: Image.Image, size: int, inset: float = 0.0) -> Image.Image:
    """Flatten the mark onto the solid ground, optionally inside a safe area."""
    canvas = Image.new("RGBA", (size, size), BACKDROP)
    scaled = round(size * (1 - 2 * inset))
    mark = icon.resize((scaled, scaled), Image.LANCZOS)
    offset = (size - scaled) // 2
    canvas.alpha_composite(mark, (offset, offset))
    return canvas


def main() -> int:
    chrome = find_chrome()
    IMG.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temporary:
        work = Path(temporary)

        # The icon: render the shipped SVG once at 512, derive the rest.
        (work / "favicon.svg").write_bytes((SITE / "assets" / "favicon.svg").read_bytes())
        (work / "icon.html").write_text(
            "<!doctype html><meta charset=\"utf-8\">"
            "<style>html,body{margin:0;background:transparent}"
            "img{display:block;width:512px;height:512px}</style>"
            "<img src=\"favicon.svg\" alt=\"\">",
            encoding="utf-8",
        )
        icon_png = work / "icon-512.png"
        shoot(chrome, (work / "icon.html").as_uri(), icon_png, 512, 512, transparent=True)
        icon = Image.open(icon_png).convert("RGBA")

        icon.resize((512, 512), Image.LANCZOS).save(IMG / "icon-512.png", optimize=True)
        icon.resize((192, 192), Image.LANCZOS).save(IMG / "icon-192.png", optimize=True)

        # Apple fills the corners itself, so the touch icon is full bleed.
        on_backdrop(icon, 180).convert("RGB").save(IMG / "apple-touch-icon.png", optimize=True)

        # A maskable icon keeps its content inside the middle 80%.
        on_backdrop(icon, 512, inset=0.14).convert("RGB").save(
            IMG / "icon-maskable-512.png", optimize=True
        )

        # The .ico carries the three sizes Windows and old browsers ask for.
        icon.save(
            SITE / "assets" / "favicon.ico",
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)],
        )

        # The social card.
        card = work / "og-cover.png"
        shoot(chrome, (HERE / "og-template.html").as_uri(), card, 1200, 630, transparent=False)
        Image.open(card).convert("RGB").save(IMG / "og-cover.png", optimize=True, quality=92)

    for path in sorted(IMG.glob("*.png")) + [SITE / "assets" / "favicon.ico"]:
        with Image.open(path) as image:
            print(f"{path.relative_to(SITE.parent)}  {image.size[0]}x{image.size[1]}  {path.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
