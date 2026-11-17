import * as React from "react";
import {Popover as HeroPopover} from "@heroui/react";
import {cn} from "@/lib/utils";
type Props=Omit<React.ComponentProps<typeof HeroPopover>,"isOpen"> & {open?:boolean};
function Popover({open,...props}:Props){return <HeroPopover {...props} isOpen={open}/>;}
function PopoverTrigger({asChild,children,...props}:React.HTMLAttributes<HTMLDivElement>&{asChild?:boolean}){return asChild?children:<HeroPopover.Trigger {...props}>{children}</HeroPopover.Trigger>;}
type ContentProps=Omit<React.ComponentPropsWithoutRef<typeof HeroPopover.Content>,"placement"> & {align?:"start"|"center"|"end";side?:"top"|"bottom"|"left"|"right";sideOffset?:number};
const PopoverContent=React.forwardRef<HTMLDivElement,ContentProps>(({className,align="center",side="bottom",sideOffset=4,children,"aria-label":label="Details",...props},ref)=><HeroPopover.Content {...props} ref={ref} placement={align==="center"?side:side==="left"||side==="right"?`${side} ${align==="start"?"top":"bottom"}`:`${side} ${align}`} offset={sideOffset} className={cn("z-50 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-lg",className)}><HeroPopover.Dialog aria-label={label} className="p-0 outline-none">{children}</HeroPopover.Dialog></HeroPopover.Content>);
PopoverContent.displayName="PopoverContent";
export {Popover,PopoverTrigger,PopoverContent};
