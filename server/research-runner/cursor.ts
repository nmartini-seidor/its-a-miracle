import { commandExists, probeCommand } from "./probe.ts"
import type { ResearchRunnerAdapter, RunnerContext, RunnerInvocation } from "./types.ts"

// cursor-agent adapter. Verified in the Phase 0 spike: headless under `cursor-agent login`
// (no CURSOR_API_KEY), real web search, conformant output.json. ~38s.
export const cursorRunner: ResearchRunnerAdapter = {
  id: "cursor",
  displayName: "Cursor Agent",

  buildInvocation(ctx: RunnerContext): RunnerInvocation {
    return {
      command: "cursor-agent",
      // -p = headless print mode; --force allows tool use (incl. web + file write) without prompts;
      // --workspace jails the run to its per-run dir.
      args: ["-p", "--output-format", "text", "--force", "--workspace", ctx.jailDir, ctx.prompt],
    }
  },

  async detectAvailability() {
    const installed = await commandExists("cursor-agent")
    if (!installed) return { runner: "cursor", installed: false, loggedIn: false, detail: "cursor-agent not on PATH" }
    const { output } = await probeCommand("cursor-agent", ["status"])
    const loggedIn = /logged in/i.test(output)
    return { runner: "cursor", installed: true, loggedIn, detail: output.trim().split("\n")[0] ?? "" }
  },
}
