const MODAL_SCROLL_SELECTOR = '[data-modal-scroll]'

/** Route mouse-wheel deltas into a modal's scroll region (needed when body scroll is locked). */
export function bindModalWheelScroll(
  modalRoot: HTMLElement,
  scrollSelector = MODAL_SCROLL_SELECTOR,
) {
  const onWheel = (event: WheelEvent) => {
    if (!modalRoot.contains(event.target as Node)) return

    const scroller = modalRoot.querySelector<HTMLElement>(scrollSelector)
    if (!scroller) {
      event.preventDefault()
      return
    }

    const maxScroll = scroller.scrollHeight - scroller.clientHeight
    if (maxScroll <= 0) {
      event.preventDefault()
      return
    }

    const next = Math.min(maxScroll, Math.max(0, scroller.scrollTop + event.deltaY))
    if (next !== scroller.scrollTop) {
      scroller.scrollTop = next
    }

    event.preventDefault()
  }

  modalRoot.addEventListener('wheel', onWheel, { passive: false })
  return () => modalRoot.removeEventListener('wheel', onWheel)
}
