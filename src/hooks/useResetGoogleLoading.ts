import { useEffect } from 'react'

/** Reset Google button loading when the user returns via Back after cancelling OAuth. */
export function useResetGoogleLoading(setGoogleLoading: (value: boolean) => void) {
  useEffect(() => {
    const reset = () => setGoogleLoading(false)

    const onPageShow = (event: PageTransitionEvent) => {
      // bfcache restore after Google cancel / Back
      if (event.persisted) reset()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') reset()
    }

    const onFocus = () => reset()

    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)

    // If we remount after a cancelled redirect, never stay stuck loading.
    reset()

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
    }
  }, [setGoogleLoading])
}
