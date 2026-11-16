from PIL import Image, ImageDraw, ImageFont
# Regenerates docs/assets/pr20-quiz-cap-and-admin-boundary.png. Run from the repo root:
#   python3 docs/flows/pr20-quiz-cap-and-admin-boundary.py
out = "docs/assets/pr20-quiz-cap-and-admin-boundary.png"
W, H = 1500, 700
im = Image.new("RGB", (W, H), "#0f1420")
d = ImageDraw.Draw(im)
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
t = ImageFont.truetype(FB, 34)
b = ImageFont.truetype(FB, 22)
s = ImageFont.truetype(F, 19)
m = ImageFont.truetype(F, 17)
G = "#9fb0cc"
d.text((40, 26), "How it works: quiz count clamp + one admin read path", font=t, fill="#ffffff")
d.text((40, 74), "Two P2 findings from the #14 review, fixed on main before #14 is rebased.", font=s, fill=G)


def box(x, y, w, h, title, lines, border="#3b82f6"):
    d.rounded_rectangle([x, y, x + w, y + h], 14, outline=border, width=3, fill="#161d2e")
    d.text((x + 18, y + 14), title, font=b, fill="#ffffff")
    for i, ln in enumerate(lines):
        d.text((x + 18, y + 52 + i * 28), ln, font=s, fill=G)


def arrow(x1, y1, x2, y2, color="#64748b"):
    import math
    d.line([x1, y1, x2, y2], fill=color, width=3)
    ang = math.atan2(y2 - y1, x2 - x1)
    L = 12
    for da in (math.radians(150), math.radians(-150)):
        d.line([x2, y2, x2 + L * math.cos(ang + da), y2 + L * math.sin(ang + da)], fill=color, width=3)


# --- Left: generate-quiz clamp ---
box(60, 210, 400, 130, "1. generate-quiz", ["caller sends questionCount", "= 10000 (unbounded)"], "#3b82f6")
box(560, 210, 380, 130, "2. clamp [1, 50]", ["Math.trunc + Math.min/max", "default 5 when omitted"], "#a855f7")
box(1040, 210, 400, 130, "3. insert", ["rawQuestions sliced to 50", "one row per question"], "#22c55e")
arrow(460, 275, 560, 275)
arrow(940, 275, 1040, 275)

# --- Right: useUsers single read path ---
box(60, 420, 400, 130, "1. useUsers(page, limit)", ["supabase.functions.invoke", "get-users?page=&limit="], "#3b82f6")
box(560, 420, 380, 130, "2. Edge Function", ["admin gate: JWT + user_roles", "403 for non-admin"], "#a855f7")
box(1040, 380, 400, 90, "ok", ["return payload as-is"], "#22c55e")
box(1040, 500, 400, 90, "error", ["throw -- no client fallback"], "#ef4444")
arrow(460, 485, 560, 485)
arrow(940, 460, 1040, 425)
arrow(940, 510, 1040, 545, "#ef4444")

d.text((60, 610), "Before: any get-users error silently degraded to a direct profiles + user_roles query, bypassing the admin gate.", font=s, fill="#e2e8f0")
d.text((60, 644), "The get-users Edge Function is now the only read path; an empty payload is an error, not an empty list.", font=s, fill="#e2e8f0")
im.save(out)
print("wrote", out)
