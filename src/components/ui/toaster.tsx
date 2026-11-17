import * as React from "react";
import { Toast, ToastQueue } from "@heroui/react";
import { useToast } from "@/hooks/use-toast";
type Content={title?:React.ReactNode;description?:React.ReactNode;action?:React.ReactNode;variant?:"default"|"danger"};
export function Toaster(){
 const {toasts}=useToast();const [queue]=React.useState(()=>new ToastQueue<Content>({maxVisibleToasts:1}));const entries=React.useRef(new Map<string,{key:string;source:unknown}>());
 React.useEffect(()=>{
  for(const [id,entry] of entries.current){if(!toasts.some(t=>t.id===id&&t.open)){queue.close(entry.key);entries.current.delete(id);}}
  for(const item of toasts){if(!item.open)continue;const content:Content={title:item.title,description:item.description,action:item.action,variant:item.variant==="destructive"?"danger":"default"};const entry=entries.current.get(item.id);if(!entry){const key=queue.add(content,{timeout:item.duration??5000,onClose:()=>item.onOpenChange?.(false)});entries.current.set(item.id,{key,source:item});}else if(entry.source!==item){queue.update(entry.key,content);entry.source=item;}}
 },[toasts,queue]);
 return <Toast.Provider queue={queue} placement="top end" maxVisibleToasts={1} width={400} className="z-[100] max-w-[calc(100vw-24px)]">{({toast})=><Toast toast={toast} variant={toast.content.variant} className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-lg"><Toast.Content><div className="grid gap-1 pr-9">{toast.content.title&&<Toast.Title className="text-sm font-semibold">{toast.content.title}</Toast.Title>}{toast.content.description&&<Toast.Description className="text-sm text-muted-foreground">{toast.content.description}</Toast.Description>}</div>{toast.content.action}</Toast.Content><Toast.CloseButton aria-label="Close notification" className="absolute right-2 top-2 z-10 min-h-9 min-w-9 rounded-full border-0 bg-transparent pointer-events-auto opacity-100"/></Toast>}</Toast.Provider>;
}
