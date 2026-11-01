"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type Settled<T> = {
  request: object | null
  status: "ready" | "error"
  data: T | null
}

// Loads client-side data (dashboard cards and charts). A failure shows a toast
// and sets hasError so the component can render <LoadError onRetry={retry} />.
// `load` must be stable (wrap it in useCallback with its inputs as deps); a
// new `load` reloads, and a response for an older `load` is ignored. The last
// data is kept while reloading.
export function useLoad<T>(load: () => Promise<T>, errorMessage: string) {
  const [attempt, setAttempt] = useState(0)
  // A new object per load/retry: the request whose answer we are waiting for
  const request = useMemo(() => ({ load, attempt }), [load, attempt])
  const [settled, setSettled] = useState<Settled<T>>({
    request: null,
    status: "ready",
    data: null,
  })

  useEffect(() => {
    let isCurrent = true

    request
      .load()
      .then((data) => {
        if (isCurrent) setSettled({ request, status: "ready", data })
      })
      .catch(() => {
        if (!isCurrent) return
        setSettled((previous) => ({
          request,
          status: "error",
          data: previous.data,
        }))
        toast.error(errorMessage)
      })

    return () => {
      isCurrent = false
    }
  }, [request, errorMessage])

  const isLoading = settled.request !== request

  return {
    data: settled.data,
    isLoading,
    hasError: !isLoading && settled.status === "error",
    retry: () => setAttempt((value) => value + 1),
  }
}
