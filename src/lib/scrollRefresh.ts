import { ScrollTrigger } from 'gsap/ScrollTrigger'

let refreshQueued = false

/** Batch multiple refresh requests into a single layout pass. */
export function scheduleScrollRefresh() {
  if (refreshQueued) return
  refreshQueued = true
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      refreshQueued = false
    })
  })
}

/** Always queue a fresh refresh (e.g. after creating pinned sections). */
export function flushScrollRefresh() {
  refreshQueued = false
  scheduleScrollRefresh()
}
