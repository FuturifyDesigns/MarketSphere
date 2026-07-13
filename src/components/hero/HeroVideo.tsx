import { useEffect, useRef, useState } from 'react'
import {
  getHeroVideoSrc,
  isHeroVideoReady,
  preloadHeroVideo,
  subscribeHeroVideoCache,
} from '../../lib/heroVideoCache'
import { LOGO_PATH } from '../../lib/constants'
import './HeroVideo.css'

const base = import.meta.env.BASE_URL
const CDN_BASE =
  'https://media.githubusercontent.com/media/FuturifyDesigns/MarketSphere/main/public/'
const POSTER = `${base}${LOGO_PATH}`

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState(() => getHeroVideoSrc())
  const [ready, setReady] = useState(() => isHeroVideoReady())

  useEffect(() => {
    void preloadHeroVideo()
    return subscribeHeroVideoCache(() => {
      setSrc(getHeroVideoSrc())
      if (isHeroVideoReady()) setReady(true)
    })
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    el.muted = true
    el.loop = true
    el.playsInline = true

    const markReady = () => setReady(true)

    const play = () => {
      if (el.paused) void el.play().catch(() => {})
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) markReady()
    }

    if (isHeroVideoReady()) play()

    void preloadHeroVideo().then(play)

    el.addEventListener('loadeddata', play)
    el.addEventListener('canplay', play)
    el.addEventListener('playing', markReady)

    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
      el.removeEventListener('playing', markReady)
    }
  }, [src])

  return (
    <div className={`hero-video ${ready ? 'hero-video--ready' : ''}`}>
      <div className="hero-video__glow" aria-hidden="true" />
      <div className="hero-video__frame">
        <img
          className="hero-video__poster"
          src={POSTER}
          alt=""
          decoding="async"
          fetchPriority="high"
          aria-hidden="true"
        />
        <video
          ref={videoRef}
          className="hero-video__player"
          src={src}
          poster={POSTER}
          loop
          muted
          autoPlay
          playsInline
          preload="auto"
          aria-label="Market Sphere Group showcase"
          onPlaying={() => setReady(true)}
          onLoadedData={() => {
            const el = videoRef.current
            if (el && el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true)
          }}
          onError={() => {
            if (!src.includes('media.githubusercontent.com') && !src.startsWith('blob:')) {
              setSrc(`${CDN_BASE}home/hero-video.mp4`)
            }
          }}
        />
      </div>
    </div>
  )
}
