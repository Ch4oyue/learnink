import * as React from "react";
import {Separator as HeroSeparator} from "@heroui/react";
import {cn} from "@/lib/utils";
type Props=React.ComponentPropsWithoutRef<typeof HeroSeparator>&{decorative?:boolean};
const Separator=React.forwardRef<HTMLElement,Props>(({className,orientation="horizontal",decorative=true,...props},ref)=><HeroSeparator {...props} ref={ref} isDecorative={decorative} orientation={orientation} className={cn("shrink-0 bg-border",orientation==="horizontal"?"h-px w-full":"h-full w-px",className)}/>);
Separator.displayName="Separator";
export {Separator};
