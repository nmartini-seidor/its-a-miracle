import Link from "next/link"
import { BotIcon, SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell, Panel } from "@/components/app/page-chrome"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatEnumLabel } from "@/lib/labels"
import { listProducts, listResearchJobs } from "@/server/data"

export const dynamic = "force-dynamic"

export default async function ResearchPage() {
  const [jobs, products] = await Promise.all([listResearchJobs(), listProducts()])
  const productById = new Map(products.map((product) => [product.id, product]))
  const activeJobs = jobs.filter((job) => job.status !== "SUCCEEDED")

  return (
    <PageShell>
      <PageHeader
        title="Research"
        description="Track research-agent runs that collect evidence and propose candidate enrichments for product review."
        actions={
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(168,85,247,0.24)]">
            <SparklesIcon className="size-4" />
            {activeJobs.length} active
          </div>
        }
      />

      <Panel title="Research agent queue" description="Runs are local workflow records. Completed runs attach evidence and candidate values to the matching product." headerClassName="bg-white" bodyClassName="p-0 sm:p-0">
        <Table surface="flush">
          <TableHeader>
            <TableRow>
              <TableHead>Run</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Runner</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead className="text-right">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-400 text-white shadow-[0_14px_34px_rgba(168,85,247,0.24)]">
                      <BotIcon className="size-6" />
                    </span>
                    <p className="font-semibold">No research agents queued yet</p>
                    <p className="text-sm text-slate-600">Start an agent from the products list or from a product detail page.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {jobs.map((job) => {
              const product = productById.get(job.productId)
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{job.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-950">{product?.title ?? job.productId}</span>
                      {product && <span className="font-mono text-xs text-slate-500">{product.miraklProductId}</span>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{formatEnumLabel(job.status)}</Badge></TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{job.runner}</TableCell>
                  <TableCell>{job.evidenceIds.length}</TableCell>
                  <TableCell>{job.candidateIds.length}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/products/${job.productId}`}>Open product</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Panel>
    </PageShell>
  )
}
