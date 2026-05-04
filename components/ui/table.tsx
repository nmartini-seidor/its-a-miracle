import * as React from "react"
import { cn } from "@/lib/utils"

type TableProps = React.ComponentProps<"table"> & { surface?: "card" | "flush" }

function Table({ className, surface = "card", ...props }: TableProps) {
  return (
    <div className={cn("relative w-full overflow-auto", surface === "card" && "rounded-2xl border border-slate-200")}>
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) { return <thead className={cn("[&_tr]:border-b [&_tr]:bg-slate-50", className)} {...props} /> }
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) { return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} /> }
function TableRow({ className, ...props }: React.ComponentProps<"tr">) { return <tr className={cn("border-b border-slate-200 transition-colors duration-150 hover:bg-blue-50/45", className)} {...props} /> }
function TableHead({ className, ...props }: React.ComponentProps<"th">) { return <th className={cn("h-11 px-3 text-left align-middle text-xs font-semibold text-slate-500", className)} {...props} /> }
function TableCell({ className, ...props }: React.ComponentProps<"td">) { return <td className={cn("p-3 align-middle text-slate-800", className)} {...props} /> }
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
