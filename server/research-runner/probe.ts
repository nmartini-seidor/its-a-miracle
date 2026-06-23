import { execFile } from "node:child_process"

// Run a short, side-effect-free probe command (e.g. `cursor-agent status`) and capture output.
// Used only for availability detection; never for ingesting catalog data.
export function probeCommand(command: string, args: string[], timeoutMs = 8000): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      const output = `${stdout ?? ""}${stderr ?? ""}`
      resolve({ ok: !error, output })
    })
  })
}

export function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile("command", ["-v", command], { shell: "/bin/bash", timeout: 5000 }, (error) => resolve(!error))
  })
}
