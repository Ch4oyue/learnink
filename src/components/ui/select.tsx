import * as React from "react";
import { Select as HeroSelect, ListBox } from "@heroui/react";

import { cn } from "@/lib/utils";

type SelectProps = Omit<React.ComponentProps<typeof HeroSelect<object, "single">>, "value" | "defaultValue" | "onChange" | "isDisabled" | "isRequired"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
};
const Select = ({value, defaultValue, onValueChange, disabled, required, ...props}: SelectProps) => (
  <HeroSelect {...props} value={value === undefined ? undefined : value || null} defaultValue={defaultValue} isDisabled={disabled} isRequired={required}
    onChange={onValueChange ? key => onValueChange(key == null ? "" : String(key)) : undefined} />
);

type ValueProps = React.ComponentProps<typeof HeroSelect.Value> & { placeholder?: string };
const SelectValue = ({placeholder, children, ...props}: ValueProps) => (
  <HeroSelect.Value {...props}>{children ?? (({isPlaceholder, selectedText}) => isPlaceholder ? placeholder : selectedText)}</HeroSelect.Value>
);

const SelectTrigger = React.forwardRef<HTMLButtonElement, Omit<React.ComponentPropsWithoutRef<typeof HeroSelect.Trigger>, "children"> & {disabled?: boolean; children?:React.ReactNode}>(
  ({className, children, disabled, ...props},ref) => (
    <HeroSelect.Trigger {...props} ref={ref} isDisabled={disabled} className={cn("min-h-11 w-full text-foreground",className)}>
      {children}<HeroSelect.Indicator className="text-muted-foreground" />
    </HeroSelect.Trigger>
  ),
);
SelectTrigger.displayName = "SelectTrigger";

type ContentProps = React.ComponentPropsWithoutRef<typeof HeroSelect.Popover> & {position?: "popper" | "item-aligned"};
const SelectContent = React.forwardRef<HTMLElement, ContentProps>(
  ({className, children, position: _position, ...props},ref) => (
    <HeroSelect.Popover {...props} ref={ref} className={cn("bg-popover text-popover-foreground",className)}>
      <ListBox aria-label="Options">{children}</ListBox>
    </HeroSelect.Popover>
  ),
);
SelectContent.displayName = "SelectContent";

function optionText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionText).join(" ").trim();
  if (React.isValidElement<{children?: React.ReactNode}>(node)) return optionText(node.props.children);
  return "";
}

type ItemProps = Omit<React.ComponentPropsWithoutRef<typeof ListBox.Item>, "id" | "children" | "isDisabled"> & {value:string;disabled?:boolean;children?:React.ReactNode};
const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
  ({value,disabled,className,children,textValue,...props},ref) => (
    <ListBox.Item {...props} ref={ref} id={value} isDisabled={disabled}
      textValue={textValue ?? optionText(children)}
      className={cn("min-h-10 text-foreground data-[focused=true]:bg-secondary",className)}>
      {children}<ListBox.ItemIndicator />
    </ListBox.Item>
  ),
);
SelectItem.displayName = "SelectItem";

export {Select, SelectValue, SelectTrigger, SelectContent, SelectItem};
