from PIL import Image, ImageDraw, ImageFont
import os
import sys
# Regenerates docs/assets/ci-flow.png. Run from the repo root: python3 docs/flows/ci-flow.py
variant=sys.argv[1] if len(sys.argv)>1 else "learnink"; out="docs/assets/ci-flow.png"; L=variant=="learnink"
W,H=1500,820
im=Image.new("RGB",(W,H),"#0f1420"); d=ImageDraw.Draw(im)
def _font(paths, size):
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()
_REGULAR_FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "/usr/share/fonts/truetype/freefont/FreeSans.ttf"]
_BOLD_FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"]
t = _font(_BOLD_FONTS, 34); b = _font(_BOLD_FONTS, 22); s = _font(_REGULAR_FONTS, 19)
G="#9fb0cc"
d.text((40,26),"How it works: checks on a pull request",font=t,fill="#ffffff")
d.text((40,74),"A new commit and a title edit start different checks. Only older runs of the same PR are cancelled.",font=s,fill=G)
def box(x,y,w,h,title,lines,col):
    d.rounded_rectangle((x,y,x+w,y+h),radius=16,fill="#18202f",outline=col,width=3)
    d.text((x+18,y+14),title,font=b,fill=col)
    for i,l in enumerate(lines): d.text((x+18,y+50+i*27),l,font=s,fill="#dbe4f5")
def line(*p): d.line(p,fill=G,width=4)
def head(x,y): d.polygon([(x,y),(x-14,y-9),(x-14,y+9)],fill=G)
d.text((40,118),"A. New commit pushed to the PR branch",font=b,fill="#6ea8ff")
box(40,160,240,100,"Push to PR",["New commit on","the PR branch"],"#6ea8ff")
# fan-out
line(280,210,320,210); line(320,210,320,205); 
ys=[205,205]
if L:
    box(360,160,420,190,"Workflows that start",["CI: restore Bun cache, then","install, lint, build, test","CodeQL","Dependency review"],"#7ee0a1")
    box(360,370,420,80,"PR title check",["Runs in parallel, reads the title"],"#7ee0a1")
    line(320,205,360,205); head(360,205); line(320,205,320,410); line(320,410,360,410); head(360,410)
else:
    box(360,160,420,100,"ci (pull_request run)",["Plugin matrix, e2e, secret scan.","No cache added."],"#7ee0a1")
    box(360,280,420,100,"ci (push run)",["Also starts for the pushed branch.","Not touched by this change."],"#ffd36e")
    box(360,400,420,80,"PR title check",["Runs in parallel, reads the title"],"#7ee0a1")
    line(320,205,320,440); 
    for y in (210,330,440): line(320,y,360,y); head(360,y)
box(850,160,610,150,"Older run cancelled",["Per workflow, per PR, pull_request runs only.","When a newer commit arrives, the older run of","the same workflow on the same PR is cancelled."],"#ff8a8a")
yb=530 if not L else 500
d.text((40,yb-42),"B. PR title edited, no new commit",font=b,fill="#6ea8ff")
box(40,yb,240,80,"Edit title",["On the PR page"],"#6ea8ff")
box(360,yb,420,80,"PR title check only",["Other workflows do not start."],"#7ee0a1")
line(280,yb+40,320,yb+40); line(320,yb+40,360,yb+40); head(360,yb+40)
if L:
    box(850,350,610,200,"Never cancelled",["Push to main, scheduled and manual runs:","each has its own run group.","Release workflow (auto-release): untouched.","No merge, deploy or branch rule change."],"#c3a6ff")
else:
    box(850,350,610,230,"Never cancelled",["Push, scheduled and manual runs:","each has its own run group.","A pull_request run is cancelled only by a newer","pull_request run of the same PR.","No merge, deploy or branch rule change."],"#c3a6ff")
im.save(out)
