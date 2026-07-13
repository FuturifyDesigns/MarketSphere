import { getLenis } from '../hooks/useLenis'

let lockCount = 0
let savedScrollY = 0

/** Prevent the page behind a modal from scrolling (works on iOS + Lenis). */
export function lockBodyScroll() {
  if (typeof document === 'undefined') return

  lockCount += 1
  if (lockCount > 1) return

  savedScrollY = window.scrollY
  getLenis()?.stop()

  document.documentElement.classList.add('body-scroll-locked')
  document.body.classList.add('body-scroll-locked')
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollY}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return

  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  document.documentElement.classList.remove('body-scroll-locked')
  document.body.classList.remove('body-scroll-locked')
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.overflow = ''

  window.scrollTo(0, savedScrollY)
  getLenis()?.start()
}
