import * as React from "react"
import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const combinedRef = (node: HTMLTextAreaElement) => {
        textareaRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    const adjustHeight = React.useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, []);

    React.useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        if (onChange) onChange(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
          className
        )}
        ref={combinedRef}
        value={value}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

export { AutoResizeTextarea }
