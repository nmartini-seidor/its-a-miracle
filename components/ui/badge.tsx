import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "border-transparent bg-slate-950 text-white",
      secondary: "border-slate-200 bg-slate-100 text-slate-800",
      destructive: "border-transparent bg-rose-600 text-white",
      outline: "border-slate-200 bg-white text-slate-700"
    }
  },
  defaultVariants: { variant: "default" }
})
function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) { return <div className={cn(badgeVariants({ variant }), className)} {...props} /> }
export { Badge, badgeVariants }
