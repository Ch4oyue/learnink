import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { buttonVariants as heroButton } from "@heroui/styles"

import { cn } from "@/lib/utils"

// Visual style comes from HeroUI v3 (`button--*` classes from @heroui/styles).
// The element stays a native <button> (or the child via asChild), so onClick, forms and links keep working.
type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
type Size = "default" | "sm" | "lg" | "icon"

const VARIANT = { default: "primary", destructive: "danger", outline: "outline", secondary: "secondary", ghost: "ghost", link: "ghost" } as const
const SIZE = { default: "md", sm: "sm", lg: "lg", icon: "md" } as const

function buttonVariants({ variant = "default", size = "default", className }: { variant?: Variant | null; size?: Size | null; className?: string } = {}) {
  const v: Variant = variant ?? "default"
  const s: Size = size ?? "default"
  return cn(
    heroButton({ variant: VARIANT[v], size: SIZE[s], isIconOnly: s === "icon" }),
    v === "link" && "text-primary underline-offset-4 hover:underline hover:bg-transparent",
    className
  )
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant | null
  size?: Size | null
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
