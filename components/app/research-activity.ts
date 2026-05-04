"use client"

import { useEffect, useState } from "react"

const storageKey = "mirakl-research-active-count"
const eventName = "mirakl-research-activity-change"

function readCount() {
  if (typeof window === "undefined") return 0
  return Number(window.localStorage.getItem(storageKey) ?? "0") || 0
}

function writeCount(count: number) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, String(Math.max(0, count)))
  window.dispatchEvent(new CustomEvent(eventName))
}

export function beginResearchActivity() {
  writeCount(readCount() + 1)
}

export function endResearchActivity() {
  writeCount(readCount() - 1)
}

export function useResearchActivity() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    function sync() {
      setActive(readCount() > 0)
    }

    sync()
    window.addEventListener(eventName, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(eventName, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return active
}
