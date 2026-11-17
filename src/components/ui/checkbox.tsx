import * as React from "react";
import {Checkbox as HeroCheckbox} from "@heroui/react";
import {cn} from "@/lib/utils";
type Props=Omit<React.ComponentPropsWithoutRef<typeof HeroCheckbox>,"isSelected"|"defaultSelected"|"isDisabled"|"onChange"|"children"> & {checked?:boolean|"indeterminate";defaultChecked?:boolean;disabled?:boolean;onCheckedChange?:(checked:boolean)=>void};
const Checkbox=React.forwardRef<HTMLInputElement,Props>(({className,checked,defaultChecked,disabled,onCheckedChange,...props},ref)=>(
 <HeroCheckbox {...props} inputRef={ref} isSelected={checked===undefined?undefined:checked===true} isIndeterminate={checked==="indeterminate"} defaultSelected={defaultChecked} isDisabled={disabled} onChange={onCheckedChange} className={cn("inline-flex",className)}>
  <HeroCheckbox.Content className="min-h-11 min-w-11 justify-center"><HeroCheckbox.Control style={{borderRadius:6}} className="border border-muted-foreground/60"><HeroCheckbox.Indicator /></HeroCheckbox.Control></HeroCheckbox.Content>
 </HeroCheckbox>
));
Checkbox.displayName="Checkbox";
export {Checkbox};
