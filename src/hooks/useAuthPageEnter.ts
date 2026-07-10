import { useEffect, type RefObject } from 'react'
import { runAuthPageEnter } from '../animations/pageEnter'
import { onIntroComplete } from '../lib/intro'

export function useAuthPageEnter(pageRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = pageRef.current
    if (!root) return

    let cleanupEnter = () => {}

    const start = () => {
      cleanupEnter = runAuthPageEnter(root)
    }

    const removeIntroListener = onIntroComplete(start)

    return () => {
      removeIntroListener()
      cleanupEnter()
    }
  }, [pageRef])
}
