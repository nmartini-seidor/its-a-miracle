"use client"
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
const Tabs = TabsPrimitive.Root
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) { return <TabsPrimitive.List className={cn("inline-flex min-h-11 flex-wrap items-center justify-center rounded-2xl border border-slate-200 bg-white p-1 text-slate-500 shadow-[0_10px_26px_rgba(15,23,42,0.055)]", className)} {...props} /> }
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger className={cn("inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-[0_8px_20px_rgba(15,23,42,0.18)]", className)} {...props} /> }
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) { return <TabsPrimitive.Content className={cn("mt-2", className)} {...props} /> }
export { Tabs, TabsList, TabsTrigger, TabsContent }
