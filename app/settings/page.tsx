import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDemoSettings } from "@/server/data"

export default async function SettingsPage() {
  const settings = await getDemoSettings()

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="max-w-3xl text-muted-foreground">This route reserves the future configuration area for Mirakl connectivity, research behavior, and source-order preferences.</p>
      </section>
      <Alert>
        <AlertTitle>Preview-safe placeholder</AlertTitle>
        <AlertDescription>This page only surfaces demo-safe defaults. It does not mutate any live environment or credentials.</AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Demo settings snapshot</CardTitle>
          <CardDescription>Current local defaults used by the workspace shell</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Mirakl base URL: {settings.miraklBaseUrl}</p>
          <p>Environment: {settings.environment}</p>
          <p>Fake research mode: {settings.fakeResearchMode ? "Enabled" : "Disabled"}</p>
        </CardContent>
      </Card>
    </main>
  )
}
