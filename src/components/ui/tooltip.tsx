import * as React from "react";
import {Tooltip as HeroTooltip} from "@heroui/react";
import {Slot} from "@radix-ui/react-slot";
import {cn} from "@/lib/utils";
const DelayContext=React.createContext(500);
function TooltipProvider({children,delayDuration=500}:{children:React.ReactNode;delayDuration?:number}){return <DelayContext.Provider value={delayDuration}>{children}</DelayContext.Provider>;}
type Props=Omit<React.ComponentProps<typeof HeroTooltip>,"isOpen"|"defaultOpen"> & {open?:boolean;defaultOpen?:boolean;onOpenChange?:(open:boolean)=>void;delayDuration?:number};
function Tooltip({open,defaultOpen,delayDuration,...props}:Props){const delay=React.useContext(DelayContext);return <HeroTooltip {...props} delay={delayDuration??delay} isOpen={open} defaultOpen={defaultOpen}/>;}
function TooltipTrigger({asChild,children,...props}:React.HTMLAttributes<HTMLDivElement>&{asChild?:boolean}){return <HeroTooltip.Trigger {...props} render={asChild?p=><Slot {...p}>{children}</Slot>:undefined}>{asChild?undefined:children}</HeroTooltip.Trigger>;}
type ContentProps=Omit<React.ComponentPropsWithoutRef<typeof HeroTooltip.Content>,"placement"> & {side?:"top"|"bottom"|"left"|"right";sideOffset?:number;align?:"start"|"center"|"end"};
const TooltipContent=React.forwardRef<HTMLDivElement,ContentProps>(({className,side="top",sideOffset=4,align="center",...props},ref)=><HeroTooltip.Content {...props} ref={ref} placement={align==="center"?side:side==="left"||side==="right"?`${side} ${align==="start"?"top":"bottom"}`:`${side} ${align}`} offset={sideOffset} className={cn("z-50 max-w-72 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md",className)}/>);
TooltipContent.displayName="TooltipContent";
export {Tooltip,TooltipTrigger,TooltipContent,TooltipProvider};
