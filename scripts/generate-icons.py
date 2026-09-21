#!/usr/bin/env python3
"""Renders the app icon set and the Google Play artwork from one description.

Run with `python3 scripts/generate-icons.py`. The outputs are committed; this
script exists so the mark can be retuned without a design tool. Colours must
stay in step with src/ui/tokens/colors.ts ("float on the water").

The hook is drawn as one continuous stroke: a round brush stamped along the
shank, the bend and the point, so there are no seams where the parts meet.
"""

import math

from PIL import Image, ImageDraw, ImageFont

DEEP_WATER = (12, 63, 69, 255)  # accent2 800
INK = (14, 42, 51, 255)  # text
BLAZE = (255, 74, 28, 255)  # accent
LURE = (214, 255, 61, 255)  # lure
HAZE = (241, 245, 236, 255)  # bg
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

SIZE = 1024
SUPERSAMPLE = 4

# The hook in its own coordinates: the bend's centre-top is the origin.
STROKE = 92.0
EYE_R = 92.0
EYE_STROKE = 54.0
BEND_R = 190.0
SHANK = 420.0
POINT_RISE = 170.0
BARB_HALF = 74.0
BARB_TIP = 150.0

LEFT = -2 * BEND_R - BARB_HALF
RIGHT = EYE_R + EYE_STROKE / 2
TOP = -SHANK - 2 * EYE_R - EYE_STROKE / 2
BOTTOM = BEND_R + STROKE / 2
WIDTH = RIGHT - LEFT
HEIGHT = BOTTOM - TOP


def hook_path(steps: int = 900) -> list[tuple[float, float]]:
    """Shank down, round the bend, up to the point — in hook coordinates."""
    eye_bottom = -SHANK
    points = [(0.0, eye_bottom + (0 - eye_bottom) * i / steps) for i in range(steps + 1)]
    for i in range(steps + 1):
        angle = math.pi * i / steps  # 0 → π, sweeping through the bottom
        points.append((-BEND_R + BEND_R * math.cos(angle), BEND_R * math.sin(angle)))
    points += [(-2 * BEND_R, -POINT_RISE * i / steps) for i in range(steps + 1)]
    return points


def draw_hook(draw: ImageDraw.ImageDraw, hook, eye, unit: float, ox: float, oy: float) -> None:
    """`unit` scales the local coordinates; (ox, oy) is where the origin lands."""

    def at(px: float, py: float) -> tuple[float, float]:
        return ox + px * unit, oy + py * unit

    half = STROKE * unit / 2
    for px, py in hook_path():
        cx, cy = at(px, py)
        draw.ellipse([cx - half, cy - half, cx + half, cy + half], fill=hook)

    tip_x = -2 * BEND_R
    draw.polygon(
        [
            at(tip_x - BARB_HALF, -POINT_RISE + 10),
            at(tip_x + BARB_HALF, -POINT_RISE + 10),
            at(tip_x, -POINT_RISE - BARB_TIP),
        ],
        fill=hook,
    )

    eye_cx, eye_cy = at(0, -SHANK - EYE_R)
    radius = EYE_R * unit
    draw.ellipse(
        [eye_cx - radius, eye_cy - radius, eye_cx + radius, eye_cy + radius],
        outline=eye,
        width=int(EYE_STROKE * unit),
    )


def draw_ripples(draw: ImageDraw.ImageDraw, size: int, cx: float, cy: float) -> None:
    """Rings spreading from the bend, the way water rings out from a float."""
    for radius, alpha in ((0.30, 44), (0.42, 28), (0.56, 16)):
        r = size * radius
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=(214, 255, 61, alpha),
            width=max(2, size // 180),
        )


def mark(size: int, background, hook, eye, coverage: float, ripples: bool = False) -> Image.Image:
    """`coverage` is the share of the canvas the mark's bounding box fills."""
    canvas = size * SUPERSAMPLE
    image = Image.new("RGBA", (canvas, canvas), background)
    unit = (canvas * coverage) / max(WIDTH, HEIGHT)
    origin_x = canvas / 2 - (LEFT + RIGHT) / 2 * unit
    origin_y = canvas / 2 - (TOP + BOTTOM) / 2 * unit
    if ripples:
        overlay = Image.new("RGBA", (canvas, canvas), TRANSPARENT)
        draw_ripples(ImageDraw.Draw(overlay), canvas, origin_x - BEND_R * unit, origin_y)
        image = Image.alpha_composite(image, overlay)
    draw_hook(ImageDraw.Draw(image), hook, eye, unit, origin_x, origin_y)
    return image.resize((size, size), Image.LANCZOS)


def flat(colour, path: str) -> None:
    Image.new("RGBA", (SIZE, SIZE), colour).save(path)


def feature_graphic(path: str) -> None:
    """Google Play's 1024×500 banner: the mark, the name, what it answers."""
    width, height = 1024, 500
    scale = SUPERSAMPLE
    image = Image.new("RGBA", (width * scale, height * scale), DEEP_WATER)

    overlay = Image.new("RGBA", image.size, TRANSPARENT)
    draw_ripples(ImageDraw.Draw(overlay), height * scale * 2, 250 * scale, 250 * scale)
    image = Image.alpha_composite(image, overlay)

    hook = mark(360, TRANSPARENT, BLAZE, LURE, 0.9).resize((360 * scale, 360 * scale))
    image.alpha_composite(hook, (70 * scale, 70 * scale))

    draw = ImageDraw.Draw(image)
    title = ImageFont.truetype("assets/fonts/Rubik_900Black.ttf", 150 * scale)
    # Figtree has no Cyrillic; Rubik does.
    tagline = ImageFont.truetype("assets/fonts/Rubik_700Bold.ttf", 32 * scale)
    draw.text((470 * scale, 110 * scale), "Клює", font=title, fill=HAZE)
    draw.text(
        (478 * scale, 300 * scale),
        "Чи варто сьогодні на рибалку?\nВідповідь — за один погляд",
        font=tagline,
        fill=(241, 245, 236, 220),
        spacing=10 * scale,
    )
    image.resize((width, height), Image.LANCZOS).convert("RGB").save(path)


if __name__ == "__main__":
    # Store icon: opaque, square, no rounding of our own; the stores mask it.
    mark(SIZE, DEEP_WATER, BLAZE, LURE, 0.6, ripples=True).save("assets/icon.png")
    mark(256, DEEP_WATER, BLAZE, LURE, 0.66).save("assets/favicon.png")
    # Android adaptive: the mark must sit inside the 66% safe circle.
    mark(SIZE, TRANSPARENT, BLAZE, LURE, 0.42).save("assets/android-icon-foreground.png")
    mark(SIZE, TRANSPARENT, WHITE, WHITE, 0.42).save("assets/android-icon-monochrome.png")
    flat(DEEP_WATER, "assets/android-icon-background.png")
    # Splash sits on the light app ground, so the eye goes dark instead of lure.
    mark(SIZE, TRANSPARENT, BLAZE, INK, 0.72).save("assets/splash-icon.png")
    # Google Play listing artwork.
    mark(512, DEEP_WATER, BLAZE, LURE, 0.6, ripples=True).convert("RGB").save(
        "assets/store/play-icon-512.png"
    )
    feature_graphic("assets/store/feature-graphic.png")
    print("icons written to assets/ and assets/store/")
