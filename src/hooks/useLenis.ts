import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scheduleScrollRefresh } from '../lib/scrollRefresh'
import { shouldUseNativeScroll } from '../lib/nativeScroll'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null
let usingNativeScroll = shouldUseNativeScroll()

export function getLenis() {
  return lenisInstance
}

export function isUsingNativeScroll() {
  return usingNativeScroll
}

/** True when the wheel target should keep native scrolling (fields, nested panels, modals). */
function shouldLenisYieldToNativeScroll(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false
  const el = node instanceof HTMLElement ? node : node.parentElement
  if (!el) return false

  if (el.closest('[data-lenis-prevent], [data-modal-scroll]')) return true

  // Form controls: let overflowing textareas / selects keep native wheel.
  // Single-line inputs must NOT block Lenis or the page won't scroll over the form.
  const field = el.closest('textarea, select')
  if (field instanceof HTMLTextAreaElement) {
    return field.scrollHeight > field.clientHeight + 1
  }
  if (field instanceof HTMLSelectElement) return true

  if (el.closest('[contenteditable=""], [contenteditable="true"]')) return true

  let cur: HTMLElement | null = el
  while (cur && cur !== document.documentElement && cur !== document.body) {
    const style = window.getComputedStyle(cur)
    const oy = style.overflowY
    const ox = style.overflowX
    const canY =
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && cur.scrollHeight > cur.clientHeight + 1
    const canX =
      (ox === 'auto' || ox === 'scroll' || ox === 'overlay') && cur.scrollWidth > cur.clientWidth + 1
    if (canY || canX) return true
    cur = cur.parentElement
  }

  return false
}

export function useLenis() {
  useEffect(() => {
    usingNativeScroll = shouldUseNativeScroll()
    ScrollTrigger.config({
      ignoreMobileResize: true,
      limitCallbacks: true,
    })

    if (usingNativeScroll) {
      document.documentElement.classList.remove('lenis')
      scheduleScrollRefresh()
      return () => {
        lenisInstance = null
      }
    }

    document.documentElement.classList.add('lenis')

    // Snappier desktop smoothing — less lag after wheel input, same look.
    const lenis = new Lenis({
      duration: 0.58,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      wheelMultiplier: 1,
      prevent: (node) => shouldLenisYieldToNativeScroll(node),
    })
    lenisInstance = lenis

    lenis.on('scroll', ScrollTrigger.update)

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value as number, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      },
      pinType: document.documentElement.style.transform ? 'transform' : 'fixed',
    })

    const onRefresh = () => lenis.resize()
    ScrollTrigger.addEventListener('refresh', onRefresh)
    scheduleScrollRefresh()

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    // Allow GSAP to drop catch-up work under load (smoother scroll than lagSmoothing(0)).
    gsap.ticker.lagSmoothing(500)

    return () => {
      gsap.ticker.remove(tick)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      lenis.destroy()
      lenisInstance = null
      document.documentElement.classList.remove('lenis')
      gsap.ticker.lagSmoothing(500)
    }
  }, [])
}
