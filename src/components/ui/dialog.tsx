import * as React from "react";
import { Modal } from "@heroui/react";
import { Slot } from "@radix-ui/react-slot";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DialogContext = React.createContext<{setOpen:(open:boolean)=>void; titleId:string; descriptionId:string} | null>(null);
function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("Dialog parts need a Dialog root");
  return context;
}
interface DialogProps {
  open?:boolean; defaultOpen?:boolean; onOpenChange?:(open:boolean)=>void; children?:React.ReactNode;
}
const Dialog = ({open,defaultOpen=false,onOpenChange,children}:DialogProps) => {
  const [localOpen,setLocalOpen] = React.useState(defaultOpen);
  const id=React.useId();
  const setOpen=React.useCallback((next:boolean)=>{setLocalOpen(next);onOpenChange?.(next);},[onOpenChange]);
  return <DialogContext.Provider value={{setOpen,titleId:`${id}-title`,descriptionId:`${id}-description`}}>
    <Modal isOpen={open ?? localOpen} onOpenChange={setOpen}>{children}</Modal>
  </DialogContext.Provider>;
};

// Existing callers open controlled dialogs from their own buttons. Keep asChild
// compatibility for future semantic triggers without adding a nested button.
const DialogTrigger = React.forwardRef<HTMLButtonElement,React.ButtonHTMLAttributes<HTMLButtonElement> & {asChild?:boolean}>(
  ({asChild,type,onClick,...props},ref)=>{
    const {setOpen}=useDialog(); const Comp=asChild ? Slot : "button";
    return <Comp {...props} ref={ref} type={asChild ? type : (type ?? "button")} onClick={(e)=>{onClick?.(e);if(!e.defaultPrevented)setOpen(true);}} />;
  },
);
DialogTrigger.displayName="DialogTrigger";
const DialogClose = React.forwardRef<HTMLButtonElement,React.ComponentPropsWithoutRef<typeof Button>>(
  ({onClick,...props},ref)=>{const {setOpen}=useDialog();return <Button {...props} ref={ref} onClick={(e)=>{onClick?.(e);if(!e.defaultPrevented)setOpen(false);}} />;},
);
DialogClose.displayName="DialogClose";

// HeroUI forwards remaining props to React Aria Dialog; its published type omits the ref.
const HeroDialog = Modal.Dialog as React.ComponentType<React.ComponentPropsWithoutRef<typeof Modal.Dialog> & React.RefAttributes<HTMLElement>>;
const DialogContent = React.forwardRef<HTMLElement,Omit<React.ComponentPropsWithoutRef<typeof Modal.Dialog>,"children"> & {children?:React.ReactNode}>(
  ({className,children,role="dialog",...props},ref)=>{
    const {titleId,descriptionId}=useDialog();
    return <Modal.Backdrop isDismissable={role!=="alertdialog"} className="z-50 bg-black/40">
      <Modal.Container placement="center" className="w-full sm:w-full p-4 sm:p-6">
        <HeroDialog {...props} ref={ref} role={role} aria-labelledby={titleId} aria-describedby={descriptionId}
          className={cn("relative grid w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto gap-4 rounded-3xl bg-card text-card-foreground p-6 shadow-xl ring-1 ring-border outline-none",className)}>
          {children}
          {role!=="alertdialog" && <DialogClose variant="ghost" size="icon" className="absolute right-2 top-2 min-h-11 min-w-11" aria-label="Close"><X className="size-4" /></DialogClose>}
        </HeroDialog>
      </Modal.Container>
    </Modal.Backdrop>;
  },
);
DialogContent.displayName="DialogContent";
const DialogHeader=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div {...props} className={cn("flex flex-col gap-1.5 pr-8 text-left",className)} />;
const DialogFooter=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div {...props} className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto",className)} />;
const DialogTitle=React.forwardRef<HTMLHeadingElement,React.ComponentPropsWithoutRef<typeof Modal.Heading>>(({className,...props},ref)=>{
  const {titleId}=useDialog();return <Modal.Heading {...props} ref={ref} id={titleId} className={cn("text-lg font-semibold leading-tight tracking-tight",className)} />;
});
DialogTitle.displayName="DialogTitle";
const DialogDescription=React.forwardRef<HTMLParagraphElement,React.HTMLAttributes<HTMLParagraphElement>>(({className,...props},ref)=>{
  const {descriptionId}=useDialog();return <p {...props} ref={ref} id={descriptionId} className={cn("text-sm text-muted-foreground",className)} />;
});
DialogDescription.displayName="DialogDescription";
export {Dialog,DialogTrigger,DialogClose,DialogContent,DialogHeader,DialogFooter,DialogTitle,DialogDescription};
