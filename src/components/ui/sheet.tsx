import * as React from "react";
import { Drawer as HeroDrawer } from "@heroui/react";
import { Slot } from "@radix-ui/react-slot";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const Context = React.createContext<{
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
} | null>(null);
function useSheet() {
  const c = React.useContext(Context);
  if (!c) throw new Error("Sheet requires its root");
  return c;
}
type RootProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};
function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: RootProps) {
  const [local, setLocal] = React.useState(defaultOpen);
  const id = React.useId();
  const setOpen = React.useCallback(
    (v: boolean) => {
      setLocal(v);
      onOpenChange?.(v);
    },
    [onOpenChange],
  );
  return (
    <Context.Provider
      value={{
        setOpen,
        titleId: `${id}-title`,
        descriptionId: `${id}-description`,
      }}
    >
      <HeroDrawer isOpen={open ?? local} onOpenChange={setOpen}>
        {children}
      </HeroDrawer>
    </Context.Provider>
  );
}
const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, type, onClick, ...props }, ref) => {
  const { setOpen } = useSheet();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      {...props}
      ref={ref}
      type={asChild ? type : (type ?? "button")}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(true);
      }}
    />
  );
});
SheetTrigger.displayName = "SheetTrigger";
const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useSheet();
  return (
    <Button
      {...props}
      ref={ref}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
    />
  );
});
SheetClose.displayName = "SheetClose";
type ContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof HeroDrawer.Dialog>,
  "children"
> & { children?: React.ReactNode } & {
  side?: "left" | "right" | "top" | "bottom";
  showClose?: boolean;
};
function SheetContent({
  side = "right",
  className,
  children,
  showClose = true,
  ...props
}: ContentProps) {
  const { titleId, descriptionId } = useSheet();
  return (
    <HeroDrawer.Backdrop isDismissable className="z-50 bg-black/40">
      <HeroDrawer.Content placement={side} className="z-50">
        <HeroDrawer.Dialog
          {...props}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-label="Navigation"
          className={cn(
            "relative flex flex-col overflow-y-auto bg-card text-card-foreground p-6 shadow-xl outline-none",
            side === "left" || side === "right"
              ? "h-full w-80 max-w-[calc(100vw-32px)]"
              : "w-full max-h-[85dvh]",
            side === "left"
              ? "rounded-r-3xl"
              : side === "right"
                ? "rounded-l-3xl"
                : side === "bottom"
                  ? "rounded-t-3xl"
                  : "rounded-b-3xl",
            className,
          )}
        >
          {children}
          {showClose && (
            <SheetClose
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-30 min-h-11 min-w-11"
              aria-label="Close"
            >
              <X className="size-4" />
            </SheetClose>
          )}
        </HeroDrawer.Dialog>
      </HeroDrawer.Content>
    </HeroDrawer.Backdrop>
  );
}
SheetContent.displayName = "SheetContent";
function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("flex flex-col gap-2 pr-8", className)} />
  );
}
function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("mt-auto flex flex-col gap-2 pt-4", className)}
    />
  );
}
const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<typeof HeroDrawer.Heading>
>(({ className, ...props }, ref) => {
  const { titleId } = useSheet();
  return (
    <HeroDrawer.Heading
      {...props}
      ref={ref}
      id={titleId}
      className={cn("text-lg font-semibold text-foreground", className)}
    />
  );
});
SheetTitle.displayName = "SheetTitle";
const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useSheet();
  return (
    <p
      {...props}
      ref={ref}
      id={descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
    />
  );
});
SheetDescription.displayName = "SheetDescription";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
