import { useEffect, type RefObject } from 'react'
import { runAuthPageEnter } from '../animations/pageEnter'
import { isIntroComplete, onIntroComplete } from '../lib/intro'

export function useAuthPageEnter(pageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = pageRef.current
    if (!root) return

    let cleanupEnter = () => {}
    let started = false

    const start = () => {
      if (started) return
      started = true
      cleanupEnter = runAuthPageEnter(root)
    }

    const removeIntroListener = onIntroComplete(start)
    const failsafe = isIntroComplete() ? undefined : window.setTimeout(start, 4200)

    return () => {
      if (failsafe !== undefined) window.clearTimeout(failsafe)
      removeIntroListener()
      cleanupEnter()
    }
  }, [pageRef])
}
