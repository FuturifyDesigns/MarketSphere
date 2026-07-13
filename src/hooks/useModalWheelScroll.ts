import { useEffect, useRef } from 'react'
import { bindModalWheelScroll } from '../lib/modalWheelScroll'

export function useModalWheelScroll<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    const node = ref.current
    if (!node) return
    return bindModalWheelScroll(node)
  }, [open])

  return ref
}
