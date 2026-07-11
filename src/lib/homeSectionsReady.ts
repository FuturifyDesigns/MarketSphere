const HOME_SECTIONS_READY_EVENT = 'home-sections-ready'

let homeSectionsReady = false
const queue: Array<() => void> = []

function runAfterLayout(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

function drainQueue() {
  queue.splice(0).forEach((fn) => runAfterLayout(fn))
}

/** Call after Vision / home pinned sections are registered with ScrollTrigger. */
export function markHomeSectionsReady() {
  if (homeSectionsReady) return
  homeSectionsReady = true
  window.dispatchEvent(new CustomEvent(HOME_SECTIONS_READY_EVENT))
  drainQueue()
}

export function onHomeSectionsReady(callback: () => void) {
  if (homeSectionsReady) {
    runAfterLayout(callback)
    return () => {}
  }

  queue.push(callback)
  const handler = () => drainQueue()
  window.addEventListener(HOME_SECTIONS_READY_EVENT, handler, { once: true })

  return () => {
    const index = queue.indexOf(callback)
    if (index >= 0) queue.splice(index, 1)
    window.removeEventListener(HOME_SECTIONS_READY_EVENT, handler)
  }
}
