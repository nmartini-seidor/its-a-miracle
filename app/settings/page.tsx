import { Badge } from "@/components/ui/badge"
import { PageHeader, PageShell } from "@/components/app/page-chrome"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { listAggregators, listSchemas, getDemoSettings } from "@/server/data"

export default async function SettingsPage() {
  const [settings, schemas, aggregators] = await Promise.all([getDemoSettings(), listSchemas(), listAggregators()])

  return (
    <PageShell className="gap-5">
      <PageHeader
        eyebrow="Settings"
        title="Workspace configuration"
        description="Configure endpoint metadata, research behavior, schema matching, evidence sources, and export governance from one navigable settings surface."
        badges={
          <>
            <Badge variant="secondary">Configurable workflow</Badge>
            <Badge variant="outline">Operator controls</Badge>
          </>
        }
      />

      <SettingsTabs initialSettings={settings} schemas={schemas} aggregators={aggregators} />
    </PageShell>
  )
}
