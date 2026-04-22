import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { listAggregators, listProducts } from "@/server/data"

function getAuthorityTier(authorityScore: number) {
  if (authorityScore >= 90) {
    return {
      label: "Canonical anchor",
      badgeVariant: "default" as const,
      guidance: "Can anchor brand, naming, and canonical specs when the evidence is direct.",
    }
  }

  if (authorityScore >= 80) {
    return {
      label: "Trusted specialist",
      badgeVariant: "secondary" as const,
      guidance: "Strong structured or policy evidence that still expects corroboration in the review flow.",
    }
  }

  if (authorityScore >= 60) {
    return {
      label: "Corroborating source",
      badgeVariant: "outline" as const,
      guidance: "Useful for visible specifications and merchandising detail, but not as sole proof.",
    }
  }

  return {
    label: "Supporting only",
    badgeVariant: "outline" as const,
    guidance: "Helpful for hints and title variants, never for canonical export-ready fields on its own.",
  }
}

function getConfidenceSummary({ authorityScore, defaultConfidence, type }: { authorityScore: number; defaultConfidence: string; type: string }) {
  if (type === "internal_reference") {
    return "Operator guidance only — helps review decisions, never acts as live-source proof."
  }

  if (defaultConfidence === "high" && authorityScore >= 90) {
    return "Starts high because the provider can anchor canonical fields when direct evidence is available."
  }

  if (defaultConfidence === "high") {
    return "Starts high for structured technical evidence, but the review flow should still corroborate it."
  }

  if (defaultConfidence === "medium") {
    return "Starts medium until a stronger source confirms the field or the evidence is clearly visible."
  }

  return "Starts low and stays supporting-only unless a stronger source confirms the same claim."
}

export default async function AggregatorsPage() {
  const [aggregators, products] = await Promise.all([listAggregators(), listProducts()])

  const providerRows = aggregators.map((aggregator) => {
    const evidence = products.flatMap((product) => product.evidence.filter((record) => record.aggregatorId === aggregator.id))
    const extractedFields = evidence.flatMap((record) => Object.keys(record.extractedFields))
    const uniqueFields = [...new Set(extractedFields)]
    const touchedProducts = new Set(evidence.map((record) => record.productId)).size
    const observedConfidence = [...new Set(evidence.map((record) => record.confidence))]
    const authorityTier = getAuthorityTier(aggregator.authorityScore)

    return {
      ...aggregator,
      authorityTier,
      evidenceCount: evidence.length,
      extractedFieldCount: extractedFields.length,
      uniqueFieldCount: uniqueFields.length,
      uniqueFields,
      touchedProducts,
      observedConfidence,
      confidenceSummary: getConfidenceSummary(aggregator),
    }
  })

  const activeProviders = providerRows.filter((provider) => provider.evidenceCount > 0)
  const stagedProviders = providerRows.filter((provider) => provider.evidenceCount === 0)
  const canonicalAnchors = providerRows.filter((provider) => provider.authorityScore >= 90).length
  const trustedSpecialists = providerRows.filter((provider) => provider.authorityScore >= 80 && provider.authorityScore < 90).length

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Aggregators</h1>
        <p className="max-w-3xl text-muted-foreground">
          Review how the demo ranks manufacturer, retailer, technical, marketplace, and internal-reference evidence before any
          candidate becomes export-preview eligible.
        </p>
      </section>

      <Alert>
        <AlertTitle>Preview-safe evidence model</AlertTitle>
        <AlertDescription>
          Every score, provider, and confidence rule on this page comes from local mock data only. The section explains review
          authority and confidence; it does not call live providers, scrape the web, or publish anything to Mirakl.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{providerRows.length}</CardTitle>
            <CardDescription>Enabled source providers in the demo contract</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{activeProviders.length}</CardTitle>
            <CardDescription>Providers already visible in the hero-product review flow</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{canonicalAnchors}</CardTitle>
            <CardDescription>Canonical-anchor providers with authority scores of 90+</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{trustedSpecialists}</CardTitle>
            <CardDescription>Trusted specialists staged for technical or policy-heavy fields</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authority and confidence model</CardTitle>
          <CardDescription>
            The demo makes the review posture explicit: authority score defines how much a provider can influence a field, and
            default confidence defines the starting trust level before corroboration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Canonical anchor",
              range: "90–100",
              summary: "Direct manufacturer evidence can anchor branding, names, and core specifications.",
            },
            {
              label: "Trusted specialist",
              range: "80–89",
              summary: "Structured spec sources and internal policy references stay strong, but still expect review context.",
            },
            {
              label: "Corroborating source",
              range: "60–79",
              summary: "Retail signals support visible specifications and merchandising details without becoming the sole proof.",
            },
            {
              label: "Supporting only",
              range: "0–59",
              summary: "Marketplace-style evidence can hint at variants, but never decides export-ready canonical fields alone.",
            },
          ].map((tier) => (
            <div key={tier.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{tier.label}</h3>
                <Badge variant="outline">{tier.range}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{tier.summary}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider authority matrix</CardTitle>
          <CardDescription>
            This matrix shows how each mocked provider is positioned in the review workflow, what it covers, and how much of the
            current demo footprint it already influences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Trust tier</TableHead>
                <TableHead>Default confidence</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Current demo footprint</TableHead>
                <TableHead>Review guidance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerRows.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{provider.name}</span>
                        <Badge variant="secondary">{provider.type.replace(/_/g, " ")}</Badge>
                        <Badge variant={provider.enabled ? "outline" : "destructive"}>{provider.enabled ? "Enabled" : "Disabled"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                      <p className="text-xs text-muted-foreground">{provider.sampleDomains.join(" · ")}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-2 text-sm">
                      <Badge variant={provider.authorityTier.badgeVariant}>{provider.authorityTier.label}</Badge>
                      <p className="text-muted-foreground">Authority score {provider.authorityScore}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-2 text-sm">
                      <Badge variant={provider.defaultConfidence === "high" ? "default" : provider.defaultConfidence === "medium" ? "secondary" : "outline"}>
                        {provider.defaultConfidence}
                      </Badge>
                      <p className="text-muted-foreground">{provider.confidenceSummary}</p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">{provider.coverageTags.join(", ")}</TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {provider.evidenceCount > 0 ? (
                        <>
                          <p>
                            {provider.evidenceCount} evidence record{provider.evidenceCount === 1 ? "" : "s"} across {provider.touchedProducts} product
                            {provider.touchedProducts === 1 ? "" : "s"}
                          </p>
                          <p>{provider.uniqueFieldCount} distinct extracted fields already visible in the demo</p>
                          <p>Observed confidence: {provider.observedConfidence.join(", ")}</p>
                        </>
                      ) : (
                        <>
                          <p>Staged for later tasks; no active evidence records yet</p>
                          <p>{provider.coverageTags.length} coverage tags ready for future drill-downs</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <p>{provider.authorityTier.guidance}</p>
                      <p>{provider.confidencePolicy}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current hero-flow evidence mix</CardTitle>
            <CardDescription>
              The hero product already demonstrates the confidence model: one canonical anchor and one corroborating retailer source
              combine to unlock stronger candidate review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProviders.map((provider) => (
              <div key={provider.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.evidenceCount} active evidence record{provider.evidenceCount === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={provider.authorityTier.badgeVariant}>{provider.authorityTier.label}</Badge>
                    <Badge variant={provider.defaultConfidence === "high" ? "default" : provider.defaultConfidence === "medium" ? "secondary" : "outline"}>
                      {provider.defaultConfidence} default confidence
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{provider.confidencePolicy}</p>
                  <p>
                    Extracted fields in the current demo: {provider.uniqueFields.length > 0 ? provider.uniqueFields.join(", ") : "No live fields yet"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview guardrails</CardTitle>
            <CardDescription>Confidence is shown to explain review posture, not to simulate a live provider network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Provider metadata comes from local fixtures and is safe to inspect.</p>
            <p>• Low-authority providers never become sole proof for export-preview rows.</p>
            <p>• Internal-reference guidance helps operators review candidates but does not act as external evidence.</p>
            <p>• {stagedProviders.length} providers are staged only, so later tasks can expand the demo without implying live coverage today.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
