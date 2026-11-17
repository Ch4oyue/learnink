import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./sheet";
function Drawer({
  shouldScaleBackground: _scale,
  ...props
}: React.ComponentProps<typeof Sheet> & { shouldScaleBackground?: boolean }) {
  return <Sheet {...props} />;
}
function DrawerContent({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetContent>) {
  return (
    <SheetContent {...props} side="bottom" showClose={false}>
      <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      {children}
    </SheetContent>
  );
}
DrawerContent.displayName = "DrawerContent";
export {
  Drawer,
  DrawerContent,
  SheetDescription as DrawerDescription,
  SheetFooter as DrawerFooter,
  SheetHeader as DrawerHeader,
  SheetTitle as DrawerTitle,
  SheetTrigger as DrawerTrigger,
  SheetClose as DrawerClose,
};
