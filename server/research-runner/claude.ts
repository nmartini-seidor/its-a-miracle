import { commandExists } from "./probe.ts"
import type { ResearchRunnerAdapter, RunnerContext, RunnerInvocation } from "./types.ts"

// claude adapter. Verified in the Phase 0 spike: headless under the subscription OAuth login
// (no ANTHROPIC_API_KEY), real web search, conformant output.json. ~70s.
export const claudeRunner: ResearchRunnerAdapter = {
  id: "claude",
  displayName: "Claude",

  buildInvocation(ctx: RunnerContext): RunnerInvocation {
    return {
      command: "claude",
      // --allowedTools is variadic and would swallow a positional prompt, so the prompt is fed
      // via stdin and the tool list is passed as a single comma-separated token (Phase 0 finding).
      args: [
        "-p",
        "--output-format",
        "text",
        "--dangerously-skip-permissions",
        "--add-dir",
        ctx.jailDir,
        "--allowedTools",
        "WebSearch,WebFetch,Write,Read",
      ],
      stdin: ctx.prompt,
    }
  },

  async detectAvailability() {
    const installed = await commandExists("claude")
    // The Claude CLI has no cheap non-interactive login probe; presence implies the host's
    // subscription session is usable (a failed login surfaces as a FAILED run, handled by the worker).
    return {
      runner: "claude",
      installed,
      loggedIn: installed ? "unknown" : false,
      detail: installed ? "claude CLI present (subscription login assumed)" : "claude not on PATH",
    }
  },
}
