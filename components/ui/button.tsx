import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] hover:bg-slate-800 hover:shadow-[0_14px_30px_rgba(15,23,42,0.2)]",
        destructive: "bg-rose-600 text-white shadow-[0_10px_24px_rgba(225,29,72,0.18)] hover:bg-rose-700",
        outline: "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950",
        secondary: "border border-blue-100 bg-blue-50 text-blue-950 hover:border-blue-200 hover:bg-blue-100",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
