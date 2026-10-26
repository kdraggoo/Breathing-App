"""Draws the app icon, Android adaptive icon layers, splash image and favicon
into assets/images/. Everything is drawn here so the art matches the in-app
dandelion and can be regenerated. Requires Pillow.

Run: python3 scripts/generate-icons.py
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"
SS = 4  # supersampling factor for smooth edges

# Keep in sync with src/constants/theme.ts
SKY_TOP = (0x6F, 0xBD, 0xEB)
SKY_BOTTOM = (0xD4, 0xEE, 0xFB)
HILL = (0x8C, 0xCB, 0x7A)
HILL_SHADE = (0x76, 0xB8, 0x65)
STEM = (0x4F, 0x8F, 0x45)
CORE = (0xB3, 0x9E, 0x6E)
SEED = (0xFF, 0xFF, 0xFF)
STALK = (0xEE, 0xF3, 0xF7)


def canvas(size, background=None):
    mode_bg = background if background is not None else (0, 0, 0, 0)
    return Image.new("RGBA", (size * SS, size * SS), mode_bg)


def finish(img, size):
    return img.resize((size, size), Image.LANCZOS)


def line(d, p0, p1, width, fill):
    """Line with round caps."""
    d.line([p0, p1], fill=fill, width=round(width))
    r = width / 2
    for x, y in (p0, p1):
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def bezier(p0, p1, p2, p3, steps=80):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        pts.append(
            (
                u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
                u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
            )
        )
    return pts


def quad(p0, p1, p2, steps=40):
    return [
        (
            (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
            (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
        )
        for t in (i / steps for i in range(steps + 1))
    ]


def sky(img, hill=True):
    """Vertical sky gradient with rolling hills, filling the whole canvas."""
    w, h = img.size
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM)))
    if hill:
        top = h * 0.80
        back = quad((0, top + h * 0.03), (w * 0.35, top - h * 0.06), (w, top + h * 0.01))
        d.polygon(back + [(w, h), (0, h)], fill=HILL_SHADE)
        front = quad((0, top + h * 0.06), (w * 0.6, top - h * 0.01), (w, top + h * 0.07))
        d.polygon(front + [(w, h), (0, h)], fill=HILL)


def seed(d, cx, cy, angle_deg, length, scale, stalk=STALK, tuft=SEED):
    """One seed pointing outward from (cx, cy) at angle (0 = straight up)."""
    a = math.radians(angle_deg)
    ux, uy = math.sin(a), -math.cos(a)
    base = (cx + ux * length * 0.16, cy + uy * length * 0.16)
    tip = (cx + ux * length * 0.78, cy + uy * length * 0.78)
    line(d, base, tip, 2.2 * scale, stalk)
    for k in range(7):
        b = a + math.radians(-60 + k * 20)
        end = (tip[0] + math.sin(b) * length * 0.24, tip[1] - math.cos(b) * length * 0.24)
        line(d, tip, end, 2.0 * scale, tuft)


def dandelion(img, cx, cy, radius, stem_to=None, flyers=True, mono=None):
    """Seed head centered at (cx, cy); optional stem down to y=stem_to and drifting seeds."""
    d = ImageDraw.Draw(img)
    scale = radius / 60  # line weights tuned at radius 60
    stem_color = mono or STEM
    if stem_to is not None:
        pts = bezier(
            (cx, cy),
            (cx + radius * 0.25, cy + (stem_to - cy) * 0.45),
            (cx - radius * 0.3, cy + (stem_to - cy) * 0.75),
            (cx - radius * 0.1, stem_to),
        )
        for p0, p1 in zip(pts, pts[1:]):
            line(d, p0, p1, 4 * scale, stem_color)
    stalk, tuft = (mono, mono) if mono else (STALK, SEED)
    for i in range(24):
        seed(d, cx, cy, i * 15, radius, scale, stalk, tuft)
    for i in range(12):
        seed(d, cx, cy, i * 30 + 7.5, radius * 0.66, scale * 0.9, stalk, tuft)
    if flyers:
        # A few seeds already drifting off on the wind.
        for dx, dy, ang, s in ((1.3, -0.85, 50, 0.5), (1.5, -0.25, 75, 0.42), (0.85, -1.25, 30, 0.4)):
            sx, sy = cx + dx * radius, cy + dy * radius
            a = math.radians(ang)
            # Offset so the drawn seed sits centered on (sx, sy).
            seed(d, sx - math.sin(a) * radius * s * 0.5, sy + math.cos(a) * radius * s * 0.5, ang, radius * s, scale * 0.8, stalk, tuft)
    r = radius * 0.13
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=mono or CORE)


def app_icon(size=1024):
    img = canvas(size)
    sky(img)
    s = size * SS
    dandelion(img, s * 0.47, s * 0.40, s * 0.24, stem_to=s * 1.02)
    return finish(img, size).convert("RGB")  # App Store icons must be opaque


def android_background(size=512):
    img = canvas(size)
    sky(img)
    return finish(img, size)


def android_foreground(size=512, mono=None):
    # Adaptive icons are masked to roughly the central 66%; keep the head well inside it.
    img = canvas(size)
    s = size * SS
    dandelion(img, s * 0.48, s * 0.44, s * 0.15, stem_to=s * 0.78, flyers=False, mono=mono)
    return finish(img, size)


def splash(size=600):
    img = canvas(size)
    s = size * SS
    dandelion(img, s * 0.5, s * 0.36, s * 0.26, stem_to=s * 0.98, flyers=False)
    return finish(img, size)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    icon = app_icon()
    icon.save(OUT / "icon.png")
    icon.resize((48, 48), Image.LANCZOS).save(OUT / "favicon.png")
    android_background().save(OUT / "android-icon-background.png")
    android_foreground().save(OUT / "android-icon-foreground.png")
    android_foreground(432, mono=(255, 255, 255, 255)).save(OUT / "android-icon-monochrome.png")
    splash().save(OUT / "splash-icon.png")
    print(f"wrote icons to {OUT}")
