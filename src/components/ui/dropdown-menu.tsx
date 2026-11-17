import * as React from "react";
import {Dropdown} from "@heroui/react";
import {Pressable,Header,Separator,RouterProvider} from "react-aria-components";
import {Slot} from "@radix-ui/react-slot";
import {useNavigate} from "react-router-dom";
import {cn} from "@/lib/utils";
type RootProps=Omit<React.ComponentProps<typeof Dropdown>,"isOpen"> & {open?:boolean;modal?:boolean};
function DropdownMenu({open,modal:_modal,...props}:RootProps){return <Dropdown {...props} isOpen={open}/>;}
function DropdownMenuTrigger({asChild,children,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{asChild?:boolean}){return <Pressable>{asChild?<Slot {...props}>{children}</Slot>:<button {...props}>{children}</button>}</Pressable>;}
type ItemProps=Omit<React.HTMLAttributes<HTMLDivElement>,"onClick">&{onClick?:()=>void}&{asChild?:boolean;disabled?:boolean;inset?:boolean;onSelect?:()=>void};
// Content builds the HeroUI collection directly so labels and router links retain their semantics.
function DropdownMenuItem(_props:ItemProps){return null;}
function DropdownMenuLabel(_props:React.HTMLAttributes<HTMLDivElement>&{inset?:boolean}){return null;}
function DropdownMenuSeparator(_props:React.HTMLAttributes<HTMLDivElement>){return null;}
type ContentProps=Omit<React.ComponentPropsWithoutRef<typeof Dropdown.Popover>,"children"|"placement"> & {children?:React.ReactNode;align?:"start"|"center"|"end";side?:"top"|"bottom"|"left"|"right";sideOffset?:number};
function textOf(node:React.ReactNode):string{if(typeof node==="string"||typeof node==="number")return String(node);if(Array.isArray(node))return node.map(textOf).join(" ").trim();if(React.isValidElement<{children?:React.ReactNode}>(node))return textOf(node.props.children);return "";}
const DropdownMenuContent=React.forwardRef<HTMLDivElement,ContentProps>(({children,className,align="center",side="bottom",sideOffset=4,...props},ref)=>{
 const navigate=useNavigate();
 let label:React.ReactNode=null;
 const items=React.Children.toArray(children).map((node,index)=>{
  if(!React.isValidElement<ItemProps>(node))return null;
  if(node.type===DropdownMenuLabel){label=<Header className={cn("px-2 py-2 text-sm text-muted-foreground",node.props.className)}>{node.props.children}</Header>;return null;}
  if(node.type===DropdownMenuSeparator)return <Separator key={index} className="my-1 h-px bg-border"/>;
  const {asChild,children:content,disabled,onClick,onSelect,className:cls,inset}=node.props;
  const link=asChild&&React.isValidElement<{to?:string;children?:React.ReactNode}>(content)?content:null;
  return <Dropdown.Item key={index} id={String(index)} textValue={textOf(content)} href={link?.props.to} isDisabled={disabled} onAction={()=>{if(!link){onSelect?.();onClick?.();}}} className={cn("flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-popover-foreground data-[focused=true]:bg-secondary",inset&&"pl-8",cls)}>{link?link.props.children:content}</Dropdown.Item>;
 }).filter(Boolean);
 return <Dropdown.Popover {...props} ref={ref} placement={align==="center"?side:side==="left"||side==="right"?`${side} ${align==="start"?"top":"bottom"}`:`${side} ${align}`} offset={sideOffset} className={cn("z-50 min-w-48 max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",className)}><RouterProvider navigate={navigate}><Dropdown.Menu aria-label="Actions">{label?<Dropdown.Section>{label}{items}</Dropdown.Section>:items}</Dropdown.Menu></RouterProvider></Dropdown.Popover>;
});
DropdownMenuContent.displayName="DropdownMenuContent";
export {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator};
