import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("rounded-[1.35rem] border border-slate-200 bg-white text-card-foreground shadow-[0_18px_45px_rgba(15,23,42,0.055)]", className)} {...props} /> }
function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} /> }
function CardTitle({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("font-semibold leading-tight tracking-[-0.025em]", className)} {...props} /> }
function CardDescription({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("text-sm text-muted-foreground", className)} {...props} /> }
function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("p-6 pt-0", className)} {...props} /> }
function CardFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex items-center p-6 pt-0", className)} {...props} /> }

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
