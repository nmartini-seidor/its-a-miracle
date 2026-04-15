import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return <main className="mx-auto flex min-h-screen max-w-xl items-center p-6"><Card><CardHeader><CardTitle>Product not found</CardTitle></CardHeader><CardContent><Button asChild><Link href="/">Back to dashboard</Link></Button></CardContent></Card></main>
}
