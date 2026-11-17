import * as React from "react";
import { Switch as HeroSwitch } from "@heroui/react";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ComponentProps<typeof HeroSwitch>, "children" | "onChange" | "isSelected" | "defaultSelected" | "isDisabled" | "ref"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

// Field semantics and accessible names belong to the root. The forwarded ref
// points to the focusable input, including when used by react-hook-form.
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, ...props }, ref) => (
    <HeroSwitch
      {...props}
      inputRef={ref}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onCheckedChange}
      isDisabled={disabled}
      className={cn("inline-flex shrink-0", className)}
    >
      <HeroSwitch.Content className="min-h-11 min-w-11 justify-center">
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
      </HeroSwitch.Content>
    </HeroSwitch>
  ),
);
Switch.displayName = "Switch";

export { Switch };
