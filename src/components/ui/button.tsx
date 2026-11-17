import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Button as HeroButton } from "@heroui/react"
import { buttonVariants as heroButton } from "@heroui/styles"

import { cn } from "@/lib/utils"

// Buttons render the real HeroUI v3 Button (react-aria: press, focus ring, disabled, keyboard).
// Links and Radix triggers (`asChild`) keep their own element and take the same HeroUI v3 button styles.
type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type Size = "default" | "sm" | "lg" | "icon"

const VARIANT = { default: "primary", destructive: "danger", outline: "outline", secondary: "secondary", ghost: "ghost", link: "ghost" } as const
const SIZE = { default: "md", sm: "sm", lg: "lg", icon: "md" } as const
const LINK_STYLE = "text-primary underline-offset-4 hover:underline hover:bg-transparent"

function buttonVariants({ variant = "default", size = "default", className }: { variant?: Variant | null; size?: Size | null; className?: string } = {}) {
  const v: Variant = variant ?? "default"
  const s: Size = size ?? "default"
  return cn(
    heroButton({ variant: VARIANT[v], size: SIZE[s], isIconOnly: s === "icon" }),
    v === "link" && LINK_STYLE,
    className
  )
}

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: Variant | null
  size?: Size | null
  asChild?: boolean
  onClick?: React.MouseEventHandler<HTMLElement> | (() => void)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, disabled, type, children, ...props }, ref) => {
    if (asChild) {
      // Slot merges onto a link/trigger, so `disabled` cannot be forwarded as an
      // attribute: mirror native disabled semantics (out of tab order, no pointer
      // activation) and announce the state instead.
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }), disabled && "pointer-events-none opacity-50")}
          ref={ref}
          aria-disabled={disabled || undefined}
          data-disabled={disabled ? "true" : undefined}
          tabIndex={disabled ? -1 : undefined}
          type={type}
          onClick={onClick as React.MouseEventHandler<HTMLElement>}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    const v: Variant = variant ?? "default"
    const s: Size = size ?? "default"
    return (
      <HeroButton
        ref={ref}
        variant={VARIANT[v]}
        size={SIZE[s]}
        isIconOnly={s === "icon"}
        isDisabled={disabled}
        type={type ?? "button"}
        className={cn(v === "link" && LINK_STYLE, className)}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement> | undefined}
        {...(props as object)}
      >
        {children}
      </HeroButton>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
