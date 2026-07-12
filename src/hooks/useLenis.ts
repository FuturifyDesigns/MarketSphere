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

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      prevent: (node) => {
        if (!(node instanceof HTMLElement)) return false
        return Boolean(node.closest('[data-lenis-prevent]'))
      },
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
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      lenis.destroy()
      lenisInstance = null
      document.documentElement.classList.remove('lenis')
    }
  }, [])
}
