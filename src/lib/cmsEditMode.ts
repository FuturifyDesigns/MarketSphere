/** Live-edit flag — used to pause realtime content reloads, not to stop site animations. */
let cmsEditActive = false

export function isCmsEditActive() {
  return cmsEditActive
}

/** Mark live editing on. Does not kill GSAP — the site should keep its normal motion. */
export function prepareDomForCmsEdit() {
  cmsEditActive = true
  document.documentElement.classList.add('cms-editing')
}

export function releaseDomAfterCmsEdit() {
  cmsEditActive = false
  document.documentElement.classList.remove('cms-editing')
}
