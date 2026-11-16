"""Shared font fallbacks for the repository flow diagrams."""
from PIL import ImageFont

def font(names,size):
    for n in names:
        try: return ImageFont.truetype(n,size)
        except OSError: pass
    return ImageFont.load_default(size)
REG=["DejaVuSans.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf","Arial.ttf","/System/Library/Fonts/Supplemental/Arial.ttf","C:/Windows/Fonts/arial.ttf"]
BOLD=["DejaVuSans-Bold.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf","Arial Bold.ttf","/System/Library/Fonts/Supplemental/Arial Bold.ttf","C:/Windows/Fonts/arialbd.ttf"]
