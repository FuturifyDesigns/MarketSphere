import { useEffect } from 'react'

/** Showcase field that plays soft looping piano ambience. */
export const MUSIC_EDUCATION_SLUG = 'music-education'

const AMBIENCE_SRC = `${import.meta.env.BASE_URL}audio/music-education-piano.mp3`
/** Soft ambient level — present but never dominant. */
const TARGET_VOLUME = 0.16
const FADE_MS = 1600

/**
 * Quiet looping piano while the visitor is in the Music Education showcase
 * (column or a listing under that column). Stops cleanly on leave.
 */
export function useShowcaseAmbience(slug: string | undefined) {
  useEffect(() => {
    if (slug !== MUSIC_EDUCATION_SLUG) return

    const audio = new Audio(AMBIENCE_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0

    let disposed = false
    let fadeFrame = 0
    let unlocked = false

    const cancelFade = () => {
      if (fadeFrame) cancelAnimationFrame(fadeFrame)
      fadeFrame = 0
    }

    const fadeTo = (to: number, ms: number) => {
      cancelFade()
      const from = audio.volume
      const start = performance.now()
      const tick = (now: number) => {
        if (disposed) return
        const t = Math.min(1, (now - start) / ms)
        const eased = t * t * (3 - 2 * t)
        audio.volume = from + (to - from) * eased
        if (t < 1) fadeFrame = requestAnimationFrame(tick)
      }
      fadeFrame = requestAnimationFrame(tick)
    }

    const startPlayback = async () => {
      if (disposed || unlocked) return
      try {
        await audio.play()
        unlocked = true
        fadeTo(TARGET_VOLUME, FADE_MS)
      } catch {
        // Autoplay blocked until a gesture — wait for one.
      }
    }

    const onPointer = () => {
      void startPlayback()
    }

    const onVisibility = () => {
      if (disposed) return
      if (document.hidden) {
        cancelFade()
        audio.pause()
      } else if (unlocked) {
        void audio.play().then(() => fadeTo(TARGET_VOLUME, 700)).catch(() => {})
      }
    }

    void startPlayback()
    window.addEventListener('pointerdown', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      cancelFade()
      window.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      try {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      } catch {
        /* ignore */
      }
    }
  }, [slug])
}
