import { useEffect, useRef, useState } from 'react'
import {
  getHeroVideoSrc,
  isHeroVideoReady,
  preloadHeroVideo,
  subscribeHeroVideoCache,
} from '../../lib/heroVideoCache'
import { cmsAssetUrl } from '../../lib/cmsAssetUrl'
import { LOGO_PATH } from '../../lib/constants'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { EditableAsset } from '../cms/EditableAsset'
import './HeroVideo.css'

const base = import.meta.env.BASE_URL
const CDN_BASE =
  'https://media.githubusercontent.com/media/FuturifyDesigns/MarketSphere/main/public/'
const POSTER = `${base}${LOGO_PATH}`
const DEFAULT_VIDEO = 'home/hero-video.mp4'

export function HeroVideo() {
  const { getBlock } = useSiteContent()
  const canEditField = useSectionFieldEdit()
  const hero = getBlock<{ hero: { video?: string } }>('home').hero
  const cmsVideo = hero.video || DEFAULT_VIDEO
  const isRemoteVideo = /^https?:\/\//i.test(cmsVideo)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState(() => (isRemoteVideo ? cmsAssetUrl(cmsVideo) : getHeroVideoSrc()))
  const [ready, setReady] = useState(() => !isRemoteVideo && isHeroVideoReady())

  useEffect(() => {
    if (isRemoteVideo) {
      setSrc(cmsAssetUrl(cmsVideo))
      setReady(false)
      return
    }

    void preloadHeroVideo()
    return subscribeHeroVideoCache(() => {
      setSrc(getHeroVideoSrc())
      if (isHeroVideoReady()) setReady(true)
    })
  }, [cmsVideo, isRemoteVideo])

  useEffect(() => {
    if (isRemoteVideo) {
      setSrc(cmsAssetUrl(cmsVideo))
    }
  }, [cmsVideo, isRemoteVideo])

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

    if (!isRemoteVideo && isHeroVideoReady()) play()
    if (!isRemoteVideo) void preloadHeroVideo().then(play)

    el.addEventListener('loadeddata', play)
    el.addEventListener('canplay', play)
    el.addEventListener('playing', markReady)

    return () => {
      el.removeEventListener('loadeddata', play)
      el.removeEventListener('canplay', play)
      el.removeEventListener('playing', markReady)
    }
  }, [src, isRemoteVideo])

  const resolvedSrc = isRemoteVideo ? cmsAssetUrl(cmsVideo) : src

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
          src={resolvedSrc}
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
            if (isRemoteVideo) return
            if (!resolvedSrc.includes('media.githubusercontent.com') && !resolvedSrc.startsWith('blob:')) {
              setSrc(`${CDN_BASE}${DEFAULT_VIDEO}`)
            }
          }}
        />
      </div>
      {canEditField ? (
        <EditableAsset
          contentKey="home"
          path="hero.video"
          value={cmsVideo}
          uploadFolder="hero"
          accept="video/mp4,video/webm,video/quicktime"
          label="Replace hero video"
        />
      ) : null}
    </div>
  )
}
