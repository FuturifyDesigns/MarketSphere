import { getLenis } from '../hooks/useLenis'

/** Capture current page scroll (Lenis or native). */
export function getPageScrollY() {
  return getLenis()?.scroll ?? window.scrollY ?? document.documentElement.scrollTop ?? 0
}

/** Jump to a scroll Y without animation. */
export function setPageScrollY(y: number) {
  const target = Math.max(0, y)
  const lenis = getLenis()
  if (lenis) {
    lenis.scrollTo(target, { immediate: true, force: true })
  }
  window.scrollTo({ top: target, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = target
  document.body.scrollTop = target
}

/**
 * Run a mutation (e.g. remove a card) and keep the viewport where it was.
 * Restores after React paint so layout height changes don't jump the page.
 */
export async function preserveScroll<T>(fn: () => T | Promise<T>): Promise<T> {
  const y = getPageScrollY()
  try {
    return await fn()
  } finally {
    const restore = () => setPageScrollY(y)
    restore()
    requestAnimationFrame(() => {
      restore()
      requestAnimationFrame(restore)
    })
    window.setTimeout(restore, 0)
    window.setTimeout(restore, 50)
  }
}
