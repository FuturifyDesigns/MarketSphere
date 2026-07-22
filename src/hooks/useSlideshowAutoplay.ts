import { useCallback, useEffect, useRef, useState } from 'react'

function canHoverPause() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

type Options = {
  /** Time between advances. */
  intervalMs?: number
  /** After manual prev/next/dot, wait this long before the next auto advance. */
  resumeAfterMs?: number
}

/**
 * Reliable slideshow autoplay that:
 * - does not stick paused after touch taps (mouseenter without mouseleave)
 * - only pauses on true desktop hover
 * - pauses when off-screen or tab is hidden
 * - resets the timer after manual navigation
 */
export function useSlideshowAutoplay(
  length: number,
  setIndex: (updater: (current: number) => number) => void,
  { intervalMs = 3200, resumeAfterMs = 4000 }: Options = {},
) {
  const lengthRef = useRef(length)
  const intervalRef = useRef(intervalMs)
  const hoverPausedRef = useRef(false)
  const offscreenPausedRef = useRef(false)
  const resumeAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const [rootEl, setRootEl] = useState<HTMLElement | null>(null)

  lengthRef.current = length
  intervalRef.current = intervalMs

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const schedule = useCallback(() => {
    clearTimer()
    if (lengthRef.current <= 1) return

    const delay = Math.max(intervalRef.current, resumeAtRef.current - Date.now())

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null

      if (document.visibilityState !== 'visible') {
        schedule()
        return
      }

      if (
        hoverPausedRef.current ||
        offscreenPausedRef.current ||
        Date.now() < resumeAtRef.current
      ) {
        schedule()
        return
      }

      const total = lengthRef.current
      if (total > 1) setIndex((current) => (current + 1) % total)
      schedule()
    }, delay)
  }, [clearTimer, setIndex])

  useEffect(() => {
    if (length <= 1) {
      clearTimer()
      return
    }
    schedule()
    return clearTimer
  }, [length, intervalMs, schedule, clearTimer])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule()
      else clearTimer()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [schedule, clearTimer])

  useEffect(() => {
    if (!rootEl || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      ([entry]) => {
        offscreenPausedRef.current = !(entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.15)
        if (!offscreenPausedRef.current) schedule()
        else clearTimer()
      },
      { threshold: [0, 0.15, 0.35] },
    )
    io.observe(rootEl)
    return () => io.disconnect()
  }, [rootEl, schedule, clearTimer])

  const pauseForHover = useCallback(() => {
    if (!canHoverPause()) return
    hoverPausedRef.current = true
  }, [])

  const resumeFromHover = useCallback(() => {
    hoverPausedRef.current = false
    schedule()
  }, [schedule])

  /** Call after manual prev/next/dot so autoplay restarts cleanly. */
  const bump = useCallback(() => {
    resumeAtRef.current = Date.now() + resumeAfterMs
    schedule()
  }, [resumeAfterMs, schedule])

  return {
    rootProps: {
      ref: setRootEl,
      onMouseEnter: pauseForHover,
      onMouseLeave: resumeFromHover,
    },
    bump,
  }
}
