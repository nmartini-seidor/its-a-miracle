import { spawn } from "node:child_process"
import { createWriteStream, existsSync } from "node:fs"
import path from "node:path"
import type { ResearchRunnerAdapter, RunnerContext, RunnerOutcome, RunnerTerminalStatus } from "./types.ts"

// API keys are stripped from every runner's environment so it must use the host's ambient
// subscription login (hard constraint #2 / ADR 0001). Never hardcode or require API keys.
const STRIPPED_ENV_KEYS = ["CURSOR_API_KEY", "ANTHROPIC_API_KEY", "CLAUDE_API_KEY", "OPENAI_API_KEY", "OPENAI_API_BASE"]

function subscriptionOnlyEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  for (const key of STRIPPED_ENV_KEYS) delete env[key]
  return env
}

export async function runRunner(adapter: ResearchRunnerAdapter, ctx: RunnerContext): Promise<RunnerOutcome> {
  const { command, args, stdin } = adapter.buildInvocation(ctx)
  const logStream = createWriteStream(path.join(ctx.jailDir, "log.ndjson"), { flags: "a" })
  const startedAt = Date.now()

  const writeLog = (stream: "stdout" | "stderr" | "meta", text: string) => {
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue
      logStream.write(`${JSON.stringify({ t: Date.now(), stream, line })}\n`)
      ctx.onLog?.(line)
    }
  }
  writeLog("meta", `launch ${command} ${args.join(" ")}`)

  return await new Promise<RunnerOutcome>((resolve) => {
    let settled = false
    let timedOut = false
    let cancelled = false

    const child = spawn(command, args, {
      cwd: ctx.jailDir,
      env: subscriptionOnlyEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    })

    const killTimer = setTimeout(() => {
      timedOut = true
      child.kill("SIGTERM")
      setTimeout(() => child.kill("SIGKILL"), 3000).unref()
    }, ctx.timeoutMs)

    const onAbort = () => {
      cancelled = true
      child.kill("SIGTERM")
      setTimeout(() => child.kill("SIGKILL"), 3000).unref()
    }
    ctx.signal.addEventListener("abort", onAbort, { once: true })

    child.stdout.on("data", (chunk: Buffer) => writeLog("stdout", chunk.toString()))
    child.stderr.on("data", (chunk: Buffer) => writeLog("stderr", chunk.toString()))

    if (stdin != null) {
      child.stdin.write(stdin)
      child.stdin.end()
    } else {
      child.stdin.end()
    }

    const finish = (outcome: Omit<RunnerOutcome, "durationMs" | "outputExists">) => {
      if (settled) return
      settled = true
      clearTimeout(killTimer)
      ctx.signal.removeEventListener("abort", onAbort)
      const outputExists = existsSync(path.join(ctx.jailDir, "output.json"))
      const durationMs = Date.now() - startedAt
      writeLog("meta", `exit status=${outcome.status} code=${outcome.exitCode} outputExists=${outputExists} ms=${durationMs}`)
      logStream.end()
      resolve({ ...outcome, durationMs, outputExists })
    }

    child.on("error", (error) => {
      finish({ status: "FAILED", exitCode: null, timedOut, cancelled, errorMessage: error.message })
    })

    child.on("close", (code) => {
      let status: RunnerTerminalStatus
      if (cancelled) status = "CANCELLED"
      else if (timedOut) status = "TIMEOUT"
      else if (code === 0) status = "SUCCEEDED"
      else status = "FAILED"
      finish({
        status,
        exitCode: code,
        timedOut,
        cancelled,
        errorMessage: status === "FAILED" && code !== 0 ? `runner exited with code ${code}` : undefined,
      })
    })
  })
}
