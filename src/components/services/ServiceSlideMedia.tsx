import { useEffect, useRef, useState } from 'react'

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
  const [src, setSrc] = useState(`${base}${video}`)
  const [useImage, setUseImage] = useState(false)

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

    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
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
      src={src}
      loop
      muted
      autoPlay
      playsInline
      preload="auto"
      aria-label={`${title} showcase video`}
      onError={() => {
        if (src.startsWith(base)) {
          setSrc(`${CDN_BASE}${video}`)
          return
        }
        setUseImage(true)
      }}
    />
  )
}
