import * as React from "react";
import { Tabs as HeroTabs } from "@heroui/react";

import { cn } from "@/lib/utils";

type TabsProps = Omit<React.ComponentProps<typeof HeroTabs>, "selectedKey" | "defaultSelectedKey" | "onSelectionChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};
const Tabs = ({ value, defaultValue, onValueChange, ...props }: TabsProps) => (
  <HeroTabs {...props} selectedKey={value} defaultSelectedKey={defaultValue}
    onSelectionChange={onValueChange ? key => onValueChange(String(key)) : undefined} />
);

const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof HeroTabs.List>>(
  ({ className, children, ...props }, ref) => (
    <HeroTabs.List ref={ref} aria-label="Sections" {...props} className={cn("w-fit rounded-full bg-secondary", className)}>
      {children}
    </HeroTabs.List>
  ),
);
TabsList.displayName = "TabsList";

type TriggerProps = Omit<React.ComponentPropsWithoutRef<typeof HeroTabs.Tab>, "id" | "isDisabled" | "children"> & { value: string; disabled?: boolean; children?: React.ReactNode };
const TabsTrigger = React.forwardRef<HTMLDivElement, TriggerProps>(
  ({ value, disabled, className, children, ...props }, ref) => (
    <HeroTabs.Tab {...props} ref={ref} id={value} isDisabled={disabled}
      className={cn("min-h-10 px-3 text-sm text-muted-foreground data-[selected=true]:text-foreground", className)}>
      {children}
      <HeroTabs.Indicator />
    </HeroTabs.Tab>
  ),
);
TabsTrigger.displayName = "TabsTrigger";

type ContentProps = Omit<React.ComponentPropsWithoutRef<typeof HeroTabs.Panel>, "id"> & { value: string };
const TabsContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ value, className, ...props }, ref) => (
    <HeroTabs.Panel {...props} ref={ref} id={value} className={cn("mt-2", className)} />
  ),
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
