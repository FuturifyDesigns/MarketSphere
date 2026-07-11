import { useEffect, useRef, useState } from 'react'
import {
  getServiceVideoSrc,
  isServiceVideoReady,
  preloadServiceVideos,
  subscribeServiceVideoCache,
} from '../../lib/serviceVideoCache'

const base = import.meta.env.BASE_URL
const CDN_BASE =
  'https://media.githubusercontent.com/media/FuturifyDesigns/MarketSphere/main/public/'

type ServiceSlideMediaProps = {
  video: string
  image: string
  title: string
  index: number
}

export function ServiceSlideMedia({ video, image, title, index }: ServiceSlideMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState(() => getServiceVideoSrc(video))
  const [useImage, setUseImage] = useState(false)

  useEffect(() => {
    void preloadServiceVideos()
    return subscribeServiceVideoCache(() => {
      setSrc(getServiceVideoSrc(video))
    })
  }, [video])

  useEffect(() => {
    const el = videoRef.current
    if (!el || useImage) return

    el.muted = true
    el.loop = true
    el.playsInline = true

    const play = () => {
      if (el.paused) void el.play().catch(() => {})
    }

    play()
    el.addEventListener('loadeddata', play)
    el.addEventListener('canplay', play)
    el.addEventListener('canplaythrough', play)

    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
      el.removeEventListener('canplaythrough', play)
    }
  }, [src, useImage])

  if (useImage) {
    return (
      <img
        className="svc-page__fallback-img"
        src={`${base}${image}`}
        alt={title}
        loading="eager"
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className="svc-page__video"
      data-service-index={index}
      data-service-title={title}
      data-video-ready={isServiceVideoReady(video) ? 'true' : 'false'}
      src={src}
      loop
      muted
      autoPlay
      playsInline
      preload="auto"
      aria-label={`${title} showcase video`}
      onError={() => {
        if (!src.includes('media.githubusercontent.com') && !src.startsWith('blob:')) {
          setSrc(`${CDN_BASE}${video}`)
          return
        }
        setUseImage(true)
      }}
    />
  )
}
