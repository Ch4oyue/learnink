# Regenerates docs/assets/realtime-channel-topics.png.
# Needs Pillow (pip install pillow). Run from anywhere: python3 docs/flows/realtime-channel-topics.py
import os
from PIL import Image, ImageDraw
from diagram_fonts import BOLD, REG, font
W,H=1500,640
im=Image.new("RGB",(W,H),"#0f1420"); d=ImageDraw.Draw(im)
t=font(BOLD,34); b=font(BOLD,22); s=font(REG,19)
G="#9fb0cc"
d.text((40,26),"How it works: unique realtime channel topics",font=t,fill="#ffffff")
d.text((40,74),"supabase.channel() dedupes by topic and returns the existing channel. Topics must be unique per subscription.",font=s,fill=G)
def box(x,y,w,h,title,lines,col):
    d.rounded_rectangle((x,y,x+w,y+h),radius=16,fill="#18202f",outline=col,width=3)
    d.text((x+18,y+14),title,font=b,fill=col)
    for i,l in enumerate(lines): d.text((x+18,y+50+i*27),l,font=s,fill="#dbe4f5")
def arrow(x1,y,x2,col=G):
    d.line((x1,y,x2,y),fill=col,width=4); d.polygon([(x2,y),(x2-14,y-9),(x2-14,y+9)],fill=col)
# Before
d.text((40,120),"BEFORE: static topic, shared channel",font=b,fill="#ff8a8a")
box(40,160,320,170,"Instance A",["mounts first,","channel('users-","profiles-changes')","-> subscribe()"],"#6ea8ff")
box(420,160,330,170,"Instance B",["same topic -> same","channel returned,","already subscribed","-> .on() throws"],"#ff8a8a")
box(810,160,320,170,"Result",["'cannot add postgres_","changes callbacks ...","after subscribe()'","-> dashboard crashes"],"#ff8a8a")
arrow(360,245,420); arrow(750,245,810)
# After
d.text((40,370),"AFTER: uniqueChannelTopic() per subscription",font=b,fill="#7ee0a1")
box(40,410,320,170,"Instance A",["channel('users-","profiles-changes-1')","-> subscribe()","independent channel"],"#6ea8ff")
box(420,410,330,170,"Instance B",["channel('users-","profiles-changes-2')","-> subscribe()","independent channel"],"#7ee0a1")
box(810,410,320,170,"Result",["no aliasing, also safe","on remount while old","removal is pending","-> dashboard renders"],"#7ee0a1")
arrow(360,495,420); arrow(750,495,810)
d.text((1180,170),"Applies to all 7 channel call",font=s,fill=G)
d.text((1180,197),"sites: useUsers x2,",font=s,fill=G)
d.text((1180,224),"NotificationBadge,",font=s,fill=G)
d.text((1180,251),"BottomNavigation x2,",font=s,fill=G)
d.text((1180,278),"DashboardNotifications,",font=s,fill=G)
d.text((1180,305),"ContentApproval.",font=s,fill=G)
out=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","assets","realtime-channel-topics.png"))
os.makedirs(os.path.dirname(out), exist_ok=True)
im.save(out)
print(out)
