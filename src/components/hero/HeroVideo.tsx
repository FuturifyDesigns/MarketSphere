import { useEffect, useRef, useState } from 'react'
import {
  getHeroVideoSrc,
  isHeroVideoReady,
  preloadHeroVideo,
  subscribeHeroVideoCache,
} from '../../lib/heroVideoCache'
import './HeroVideo.css'

const CDN_BASE =
  'https://media.githubusercontent.com/media/FuturifyDesigns/MarketSphere/main/public/'

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState(() => getHeroVideoSrc())
  const [ready, setReady] = useState(() => isHeroVideoReady())

  useEffect(() => {
    void preloadHeroVideo()
    return subscribeHeroVideoCache(() => {
      setSrc(getHeroVideoSrc())
      setReady(isHeroVideoReady())
    })
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    el.muted = true
    el.loop = true
    el.playsInline = true

    const play = () => {
      if (el.paused) void el.play().catch(() => {})
      setReady(true)
    }

    if (isHeroVideoReady()) play()
    void preloadHeroVideo().then(play)

    el.addEventListener('loadeddata', play)
    el.addEventListener('canplay', play)
    el.addEventListener('canplaythrough', play)

    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
      el.removeEventListener('canplaythrough', play)
    }
  }, [src])

  return (
    <div className={`hero-video ${ready ? 'hero-video--ready' : ''}`}>
      <div className="hero-video__glow" aria-hidden="true" />
      <div className="hero-video__frame">
        <video
          ref={videoRef}
          className="hero-video__player"
          src={src}
          loop
          muted
          autoPlay
          playsInline
          preload="auto"
          aria-label="Market Sphere Group showcase"
          onPlaying={() => setReady(true)}
          onLoadedData={() => setReady(true)}
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
