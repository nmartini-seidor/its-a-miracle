import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, PageShell } from "@/components/app/page-chrome"
import { SchemaConfigurationForm } from "@/components/schema/schema-configuration-form"
import { listProducts, listSchemas } from "@/server/data"

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const schemas = await listSchemas()
  return schemas.map((schema) => ({ slug: schema.slug }))
}

export default async function SchemaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [schemas, products] = await Promise.all([listSchemas(), listProducts()])
  const schema = schemas.find((item) => item.slug === slug)

  if (!schema) notFound()

  const assignedProducts = products.filter((product) => product.schemaId === schema.id)

  return (
    <PageShell>
      <div className="flex">
        <Button asChild variant="outline" size="sm">
          <Link href="/schemas">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to schemas
          </Link>
        </Button>
      </div>

      <PageHeader title={`${schema.name} configuration`} />
      <SchemaConfigurationForm schema={schema} assignedProducts={assignedProducts} />
    </PageShell>
  )
}
