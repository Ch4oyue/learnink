# Regenerates docs/assets/english-ui-default.png.
# Needs Pillow (pip install pillow). Run from anywhere: python3 docs/flows/english-ui-default.py
import os
from PIL import Image, ImageDraw
from diagram_fonts import BOLD, REG, font
W,H=1500,560
im=Image.new("RGB",(W,H),"#0f1420"); d=ImageDraw.Draw(im)
t=font(BOLD,34); b=font(BOLD,22); s=font(REG,19)
G="#9fb0cc"
d.text((40,26),"How it works: English UI defaults",font=t,fill="#ffffff")
d.text((40,74),"Interface copy, dates and category labels render in English. Stored data and AI prompts stay untouched.",font=s,fill=G)
def box(x,y,w,h,title,lines,col):
    d.rounded_rectangle((x,y,x+w,y+h),radius=16,fill="#18202f",outline=col,width=3)
    d.text((x+18,y+14),title,font=b,fill=col)
    for i,l in enumerate(lines): d.text((x+18,y+50+i*27),l,font=s,fill="#dbe4f5")
def arrow(x1,y,x2):
    d.line((x1,y,x2,y),fill=G,width=4); d.polygon([(x2,y),(x2-14,y-9),(x2-14,y+9)],fill=G)
box(40,140,330,170,"1. UI copy",["Hardcoded Indonesian","strings replaced with","English: toasts, labels,","errors, aria-labels"],"#6ea8ff")
box(430,140,300,170,"2. Dates",["date-fns id -> enUS","toLocaleDateString","id-ID -> en-US"],"#7ee0a1")
box(790,140,330,170,"3. Stored values",["DB keeps raw values like","AI Dasar / Pemula.","categoryLabels.ts maps","them at render only."],"#ffd36e")
box(1180,140,280,170,"4. Unchanged",["AI/material prompts","and DB content stay","as authored."],"#c3a6ff")
for a,b2 in ((370,430),(730,790),(1120,1180)): arrow(a,225,b2)
d.text((40,350),"Verification: build and unit tests pass; see PR for the current test count.",font=s,fill=G)
d.text((40,384),"Visual check (desktop + mobile): /, /auth, /syllabus, /changelog. Auth-gated routes source-inspected only.",font=s,fill=G)
d.text((40,418),"No database values are mutated; unknown stored values render as-is.",font=s,fill=G)
out=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","assets","english-ui-default.png"))
os.makedirs(os.path.dirname(out), exist_ok=True)
im.save(out)
print(out)
