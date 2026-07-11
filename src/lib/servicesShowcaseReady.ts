const SERVICES_SHOWCASE_READY_EVENT = 'services-showcase-ready'

let servicesShowcaseReady = false
const queue: Array<() => void> = []

function drainQueue() {
  queue.splice(0).forEach((fn) => fn())
}

/** Call after the Services pinned showcase ScrollTrigger is registered. */
export function markServicesShowcaseReady() {
  if (servicesShowcaseReady) return
  servicesShowcaseReady = true
  window.dispatchEvent(new CustomEvent(SERVICES_SHOWCASE_READY_EVENT))
  drainQueue()
}

export function isServicesShowcaseReady() {
  return servicesShowcaseReady
}

export function onServicesShowcaseReady(callback: () => void) {
  if (servicesShowcaseReady) {
    callback()
    return () => {}
  }

  queue.push(callback)
  const handler = () => drainQueue()
  window.addEventListener(SERVICES_SHOWCASE_READY_EVENT, handler, { once: true })

  return () => {
    const index = queue.indexOf(callback)
    if (index >= 0) queue.splice(index, 1)
    window.removeEventListener(SERVICES_SHOWCASE_READY_EVENT, handler)
  }
}
