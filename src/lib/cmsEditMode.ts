import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '../hooks/useLenis'
import { scheduleScrollRefresh } from './scrollRefresh'

/** Unpin GSAP sections so React can safely update the DOM during live editing. */
export function prepareDomForCmsEdit() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true))
  getLenis()?.stop()
  document.documentElement.classList.add('cms-editing')
}

export function releaseDomAfterCmsEdit() {
  document.documentElement.classList.remove('cms-editing')
  getLenis()?.start()
  scheduleScrollRefresh()
}
