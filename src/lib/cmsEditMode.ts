import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '../hooks/useLenis'
import { scheduleScrollRefresh } from './scrollRefresh'

let cmsEditActive = false

export function isCmsEditActive() {
  return cmsEditActive
}

function unwrapPinSpacers() {
  document.querySelectorAll('.pin-spacer').forEach((spacer) => {
    const parent = spacer.parentElement
    const pinned = spacer.firstElementChild
    if (parent && pinned) {
      parent.insertBefore(pinned, spacer)
    }
    spacer.remove()
  })
}

function resetPinnedElements() {
  const selectors = [
    '.services-showcase__pin',
    '.about-tree__pin',
    '.svc-page__pin',
    '[data-home-section]',
  ]

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        gsap.set(el, { clearProps: 'all' })
      }
    })
  })
}

/** Unpin GSAP sections so React can safely update the DOM during live editing. */
export function prepareDomForCmsEdit() {
  cmsEditActive = true
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true))
  unwrapPinSpacers()
  resetPinnedElements()
  gsap.killTweensOf('*')
  getLenis()?.stop()
  document.documentElement.classList.add('cms-editing')
}

export function releaseDomAfterCmsEdit() {
  cmsEditActive = false
  document.documentElement.classList.remove('cms-editing')
  getLenis()?.start()
  scheduleScrollRefresh()
}

/** Run React state updates after GSAP pin cleanup has settled in the DOM. */
export function deferDomSafeUpdate(update: () => void) {
  prepareDomForCmsEdit()
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(update)
  })
}
