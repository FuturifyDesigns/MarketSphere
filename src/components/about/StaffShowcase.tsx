import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { EditableText } from '../cms/EditableText'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSlideshowAutoplay } from '../../hooks/useSlideshowAutoplay'
import './StaffShowcase.css'

export type StaffMember = {
  id: string
  name: string
  role: string
  phone: string
  image: string
}

type AboutStaffBlock = {
  eyebrow: string
  title: string
  titleEmphasis: string
  lead: string
  members: StaffMember[]
}

function assetUrl(path: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function StaffShowcase() {
  const { getBlock } = useSiteContent()
  const staff = getBlock<AboutStaffBlock>('about').staff
  const members = staff?.members?.length ? staff.members : []

  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const touchStartX = useRef<number | null>(null)

  const setIndexFromAutoplay = useCallback((updater: (current: number) => number) => {
    setDirection(1)
    setIndex(updater)
  }, [])

  const { rootProps, bump } = useSlideshowAutoplay(members.length, setIndexFromAutoplay, {
    intervalMs: 4500,
    resumeAfterMs: 2800,
    pauseOnHover: false,
  })

  useEffect(() => {
    setIndex(0)
  }, [members.length])

  if (!members.length) return null

  const safeIndex = Math.min(index, members.length - 1)
  const current = members[safeIndex]

  const goTo = (next: number, dir: number) => {
    setDirection(dir)
    setIndex(((next % members.length) + members.length) % members.length)
    bump()
  }

  const goPrev = () => goTo(safeIndex - 1, -1)
  const goNext = () => goTo(safeIndex + 1, 1)

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null || members.length <= 1) return
    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) < 48) return
    if (delta < 0) goNext()
    else goPrev()
  }

  return (
    <section className="staff-showcase" aria-labelledby="staff-showcase-title" {...rootProps}>
      <div className="container staff-showcase__inner">
        <header className="staff-showcase__header">
          <EditableText contentKey="about" path="staff.eyebrow" as="span" className="section-label" />
          <h2 id="staff-showcase-title" className="display-lg">
            <EditableText contentKey="about" path="staff.title" as="span" />{' '}
            <em className="text-gold">
              <EditableText contentKey="about" path="staff.titleEmphasis" as="span" />
            </em>
          </h2>
          <EditableText contentKey="about" path="staff.lead" as="p" className="staff-showcase__lead" multiline />
        </header>

        <div className="staff-showcase__stage-wrap">
          {members.length > 1 ? (
            <button
              type="button"
              className="staff-showcase__nav staff-showcase__nav--prev"
              onClick={goPrev}
              aria-label="Previous team member"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}

          <div
            className="staff-showcase__stage"
            aria-roledescription="carousel"
            aria-label="Leadership team"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="staff-showcase__glow" aria-hidden="true" />
            <AnimatePresence mode="sync" custom={direction} initial={false}>
              <motion.article
                key={current.id}
                className="staff-showcase__card"
                custom={direction}
                initial="enter"
                animate="center"
                exit="exit"
                variants={{
                  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48, scale: 0.97 }),
                  center: { opacity: 1, x: 0, scale: 1 },
                  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -36 : 36, scale: 0.97 }),
                }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="staff-showcase__photo-wrap">
                  <img
                    src={assetUrl(current.image)}
                    alt=""
                    className="staff-showcase__photo"
                    decoding="async"
                  />
                  <span className="staff-showcase__photo-ring" aria-hidden="true" />
                </div>

                <div className="staff-showcase__body">
                  <span className="staff-showcase__index" aria-hidden="true">
                    {String(safeIndex + 1).padStart(2, '0')} / {String(members.length).padStart(2, '0')}
                  </span>
                  <h3>
                    <EditableText
                      contentKey="about"
                      path={`staff.members.${safeIndex}.name`}
                      as="span"
                    />
                  </h3>
                  <p className="staff-showcase__role">
                    <EditableText
                      contentKey="about"
                      path={`staff.members.${safeIndex}.role`}
                      as="span"
                    />
                  </p>
                  {current.phone ? (
                    <a className="staff-showcase__phone" href={telHref(current.phone)}>
                      <Phone size={16} aria-hidden="true" />
                      <EditableText
                        contentKey="about"
                        path={`staff.members.${safeIndex}.phone`}
                        as="span"
                      />
                    </a>
                  ) : null}
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          {members.length > 1 ? (
            <button
              type="button"
              className="staff-showcase__nav staff-showcase__nav--next"
              onClick={goNext}
              aria-label="Next team member"
            >
              <ChevronRight size={20} />
            </button>
          ) : null}
        </div>

        {members.length > 1 ? (
          <div className="staff-showcase__roster" role="tablist" aria-label="Team members">
            {members.map((member, memberIndex) => {
              const active = memberIndex === safeIndex
              return (
                <button
                  key={member.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show ${member.name}`}
                  className={
                    active
                      ? 'staff-showcase__thumb staff-showcase__thumb--active'
                      : 'staff-showcase__thumb'
                  }
                  onClick={() => goTo(memberIndex, memberIndex > safeIndex ? 1 : -1)}
                >
                  <img src={assetUrl(member.image)} alt="" decoding="async" />
                  <span className="staff-showcase__thumb-name">{member.name.replace(/^Mr\.\s+|^Ms\.\s+/i, '').split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
