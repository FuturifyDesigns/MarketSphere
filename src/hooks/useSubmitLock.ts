import { useCallback, useRef, useState } from 'react'

/** Prevent double-submit races before React re-renders disabled state. */
export function useSubmitLock() {
  const lockRef = useRef(false)
  const [locked, setLocked] = useState(false)

  const runLocked = useCallback(async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined
    lockRef.current = true
    setLocked(true)
    try {
      return await task()
    } finally {
      lockRef.current = false
      setLocked(false)
    }
  }, [])

  return { locked, runLocked }
}
