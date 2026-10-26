"""App icons for ON (installable web app).

Draws the ON wordmark (Funnel Display ExtraBold + the mint "on air" dot)
on the brand's darkest green. Colours are the design system tokens
green-950, beige-100 and mint-500 (globals.css).

    python scripts/make-on-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

GREEN_950 = "#011f1a"
BEIGE_100 = "#f2efeb"
MINT_500 = "#90b495"
FONT = Path("D:/Aboustate Design System/assets/fonts/FunnelDisplay-ExtraBold.ttf")
OUT = Path(__file__).resolve().parent.parent / "public" / "on-icons"


def draw(size, content=0.62, radius=0.0):
    """content = share of the width the wordmark spans (maskable icons need
    everything inside the central 80% circle, so they use less)."""
    scale = 4  # draw big, shrink down for clean edges
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if radius:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * radius), fill=GREEN_950)
    else:
        d.rectangle([0, 0, s, s], fill=GREEN_950)

    # Fit "ON" plus the dot to the requested width.
    font_size = int(s * 0.5)
    for _ in range(40):
        font = ImageFont.truetype(str(FONT), font_size)
        l, t, r, b = d.textbbox((0, 0), "ON", font=font)
        dot = (b - t) * 0.26
        gap = dot * 0.55
        total = (r - l) + gap + dot
        if total <= s * content:
            break
        font_size = int(font_size * 0.96)

    x = (s - total) / 2 - l
    y = (s - (b - t)) / 2 - t
    d.text((x, y), "ON", font=font, fill=BEIGE_100)
    # Dot sits on the baseline, like the wordmark on the site.
    dx = x + l + (r - l) + gap
    dy = y + b - dot
    d.ellipse([dx, dy, dx + dot, dy + dot], fill=MINT_500)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192).save(OUT / "icon-192.png")
    draw(512).save(OUT / "icon-512.png")
    draw(512, content=0.46).save(OUT / "maskable-512.png")
    draw(180, content=0.56).convert("RGB").save(OUT / "apple-touch-icon.png")
    draw(64, content=0.7, radius=0.22).save(OUT / "favicon-64.png")
    print("wrote", sorted(p.name for p in OUT.iterdir()))


if __name__ == "__main__":
    main()
