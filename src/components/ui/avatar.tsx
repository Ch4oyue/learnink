import * as React from "react";
import { Avatar as HeroAvatar } from "@heroui/react";
import { cn } from "@/lib/utils";
const Avatar=React.forwardRef<HTMLSpanElement,React.ComponentPropsWithoutRef<typeof HeroAvatar> & {isPremium?:boolean}>(
  ({className,isPremium,...props},ref)=><HeroAvatar {...props} ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",isPremium&&"ring-2 ring-amber-400 ring-offset-2 ring-offset-background",className)} />,
);
Avatar.displayName="Avatar";
const AvatarImage=React.forwardRef<HTMLImageElement,React.ComponentPropsWithoutRef<typeof HeroAvatar.Image>>(
  ({className,...props},ref)=><HeroAvatar.Image {...props} ref={ref} className={cn("aspect-square h-full w-full",className)} />,
);
AvatarImage.displayName="AvatarImage";
const AvatarFallback=React.forwardRef<HTMLSpanElement,React.ComponentPropsWithoutRef<typeof HeroAvatar.Fallback>>(
  ({className,...props},ref)=><HeroAvatar.Fallback {...props} ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-secondary text-foreground",className)} />,
);
AvatarFallback.displayName="AvatarFallback";
export {Avatar,AvatarImage,AvatarFallback};
