from PIL import Image, ImageDraw, ImageFont
# Regenerates docs/assets/pr14-role-guards-how-it-works.png. Run from the repo root: python3 docs/flows/pr14-role-guards-how-it-works.py
out = "docs/assets/pr14-role-guards-how-it-works.png"
W, H = 1500, 660
im = Image.new("RGB", (W, H), "#0f1420")
d = ImageDraw.Draw(im)
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
t = ImageFont.truetype(FB, 34); b = ImageFont.truetype(FB, 22); s = ImageFont.truetype(F, 19)
G = "#9fb0cc"
d.text((40, 26), "How it works: fail-closed role guards + least-privilege CI token", font=t, fill="#ffffff")
d.text((40, 74), "Super-admin protection reads every role row and throws on lookup errors; the CI token is pinned to read-only scopes.", font=s, fill=G)

def box(x, y, w, h, title, lines, border="#3b82f6"):
    d.rounded_rectangle([x, y, x + w, y + h], 14, outline=border, width=3, fill="#161d2e")
    d.text((x + 18, y + 14), title, font=b, fill="#ffffff")
    for i, ln in enumerate(lines):
        d.text((x + 18, y + 52 + i * 28), ln, font=s, fill=G)

def arrow(x1, y1, x2, y2):
    import math
    d.line([x1, y1, x2, y2], fill="#64748b", width=3)
    ang = math.atan2(y2 - y1, x2 - x1)
    L = 12
    for da in (math.radians(150), math.radians(-150)):
        d.line([x2, y2, x2 + L * math.cos(ang + da), y2 + L * math.sin(ang + da)], fill="#64748b", width=3)

box(60, 230, 380, 140, "1. Ban / role change", ["Admin UI calls useBanUser", "or useUpdateUserRole", "for a target user."], "#3b82f6")
box(540, 200, 420, 200, "2. Read ALL role rows", ["select('role').eq(user_id),", "no .single(): user_roles may", "hold several rows per user", "(server rolesOf returns", "an array too)."], "#a855f7")
box(1060, 90, 400, 150, "3a. Lookup error", ["throw immediately;", "nothing is changed.", "The guard fails closed."], "#ef4444")
box(1060, 320, 400, 200, "3b. Rows read", ["includes('superadmin')?", "yes: block ban / role change.", "no: proceed as before,", "promotion to superadmin", "stays blocked."], "#22c55e")
arrow(440, 300, 540, 300)
arrow(960, 300, 1060, 165)
arrow(960, 300, 1060, 420)
d.text((60, 590), "Client-side guards are defense in depth: the authoritative boundary stays the database RLS policies.", font=s, fill="#e2e8f0")
d.text((60, 620), "CI: GITHUB_TOKEN pinned to contents: read + pull-requests: read; the jobs only read checkout and PR metadata.", font=s, fill="#e2e8f0")
im.save(out)
print("wrote", out)
