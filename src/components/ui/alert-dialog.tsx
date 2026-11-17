import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

const AlertDialog=Dialog;
const AlertDialogTrigger=DialogTrigger;
const AlertDialogContent=React.forwardRef<HTMLElement,React.ComponentPropsWithoutRef<typeof DialogContent>>(
  (props,ref)=><DialogContent {...props} ref={ref} role="alertdialog" />,
);
AlertDialogContent.displayName="AlertDialogContent";
const AlertDialogHeader=DialogHeader;
const AlertDialogFooter=DialogFooter;
const AlertDialogTitle=DialogTitle;
const AlertDialogDescription=DialogDescription;
const AlertDialogAction=React.forwardRef<HTMLButtonElement,React.ComponentPropsWithoutRef<typeof DialogClose>>(
  (props,ref)=><DialogClose {...props} ref={ref} />,
);
AlertDialogAction.displayName="AlertDialogAction";
const AlertDialogCancel=React.forwardRef<HTMLButtonElement,React.ComponentPropsWithoutRef<typeof DialogClose>>(
  (props,ref)=><DialogClose variant="outline" autoFocus {...props} ref={ref} />,
);
AlertDialogCancel.displayName="AlertDialogCancel";
export {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogFooter,AlertDialogTitle,AlertDialogDescription,AlertDialogAction,AlertDialogCancel};
