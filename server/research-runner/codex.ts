import { commandExists, probeCommand } from "./probe.ts"
import type { ResearchRunnerAdapter, RunnerContext, RunnerInvocation } from "./types.ts"

// codex adapter. Verified in the Phase 0 spike: headless under ChatGPT login (no OPENAI_API_KEY),
// real web search via the web_search tool, conformant output.json. ~75s.
export const codexRunner: ResearchRunnerAdapter = {
  id: "codex",
  displayName: "Codex",

  buildInvocation(ctx: RunnerContext): RunnerInvocation {
    return {
      command: "codex",
      args: [
        "exec",
        "--skip-git-repo-check",
        "-C",
        ctx.jailDir,
        // The jail is the cwd; we only ever ingest output.json, so bypassing the sandbox to
        // give the agent network access for browsing is acceptable (ADR 0002 trust boundary).
        "--dangerously-bypass-approvals-and-sandbox",
        "-c",
        "tools.web_search=true",
        ctx.prompt,
      ],
    }
  },

  async detectAvailability() {
    const installed = await commandExists("codex")
    if (!installed) return { runner: "codex", installed: false, loggedIn: false, detail: "codex not on PATH" }
    const { output } = await probeCommand("codex", ["login", "status"])
    const loggedIn = /logged in/i.test(output)
    return { runner: "codex", installed: true, loggedIn, detail: output.trim().split("\n")[0] ?? "" }
  },
}
