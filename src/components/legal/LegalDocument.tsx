import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { getLenis } from '../../hooks/useLenis'
import './LegalDocument.css'

export interface LegalSection {
  id: string
  title: string
  content: ReactNode
}

interface LegalDocumentProps {
  title: string
  subtitle: string
  meta: string
  intro: ReactNode
  sections: LegalSection[]
}

export function LegalDocument({
  title,
  subtitle,
  meta,
  intro,
  sections,
}: LegalDocumentProps) {
  const tocNavRef = useRef<HTMLElement>(null)
  const scrollLockRef = useRef(false)
  const scrollLockTimerRef = useRef<number | undefined>(undefined)
  const tocScrollReadyRef = useRef(false)
  const [activeId, setActiveId] = useState(() => sections[0]?.id ?? '')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section, index) => [section.id, index === 0])),
  )

  const getScrollMarker = useCallback(() => {
    const navHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
    )
    return (Number.isFinite(navHeight) ? navHeight : 72) + 32
  }, [])

  const syncActiveFromScroll = useCallback(() => {
    if (scrollLockRef.current || sections.length === 0) return

    const marker = getScrollMarker()
    let current = sections[0].id

    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (!element) continue
      if (element.getBoundingClientRect().top <= marker) {
        current = section.id
      }
    }

    setActiveId(current)
  }, [getScrollMarker, sections])

  useEffect(() => {
    const onScroll = () => {
      window.requestAnimationFrame(syncActiveFromScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    const lenis = getLenis()
    lenis?.on('scroll', onScroll)

    const readyTimer = window.setTimeout(() => {
      tocScrollReadyRef.current = true
      syncActiveFromScroll()
    }, 400)

    return () => {
      window.clearTimeout(readyTimer)
      window.removeEventListener('scroll', onScroll)
      lenis?.off('scroll', onScroll)
    }
  }, [syncActiveFromScroll])

  useEffect(() => {
    if (!tocScrollReadyRef.current || scrollLockRef.current) return

    const nav = tocNavRef.current
    if (!nav || !activeId) return

    const activeLink = nav.querySelector<HTMLElement>(`[data-section-id="${activeId}"]`)
    const card = nav.closest<HTMLElement>('.legal-doc-sidebar__card')
    if (!activeLink || !card) return

    const cardRect = card.getBoundingClientRect()
    const linkRect = activeLink.getBoundingClientRect()

    if (linkRect.top < cardRect.top + 8) {
      card.scrollTop -= cardRect.top - linkRect.top + 8
    } else if (linkRect.bottom > cardRect.bottom - 8) {
      card.scrollTop += linkRect.bottom - cardRect.bottom + 8
    }
  }, [activeId])

  const selectSection = useCallback((id: string) => {
    scrollLockRef.current = true
    if (scrollLockTimerRef.current) window.clearTimeout(scrollLockTimerRef.current)
    scrollLockTimerRef.current = window.setTimeout(() => {
      scrollLockRef.current = false
    }, 700)

    setOpenSections((prev) => ({ ...prev, [id]: true }))
    setActiveId(id)
  }, [])

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const nextOpen = !prev[id]
      if (nextOpen) setActiveId(id)
      return { ...prev, [id]: nextOpen }
    })
  }

  useEffect(() => {
    return () => {
      if (scrollLockTimerRef.current) window.clearTimeout(scrollLockTimerRef.current)
    }
  }, [])

  return (
    <div className="page legal-doc-page">
      <header className="legal-doc-hero">
        <div className="container legal-doc-hero__inner page-enter-hero">
          <span className="section-label">Legal</span>
          <h1>{title}</h1>
          <p className="legal-doc-hero__subtitle">{subtitle}</p>
          <p className="legal-doc-hero__meta">{meta}</p>
        </div>
      </header>

      <div className="container legal-doc-layout">
        <aside className="legal-doc-sidebar" aria-label="Table of contents">
          <div className="legal-doc-sidebar__card">
            <p className="legal-doc-sidebar__label">On this page</p>
            <nav ref={tocNavRef} className="legal-doc-toc">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  data-section-id={section.id}
                  className={activeId === section.id ? 'legal-doc-toc__link legal-doc-toc__link--active' : 'legal-doc-toc__link'}
                  aria-current={activeId === section.id ? 'true' : undefined}
                  onClick={() => selectSection(section.id)}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <div className="legal-doc-main">
          <section className="legal-doc-intro bento-card">{intro}</section>

          <div className="legal-doc-sections">
            {sections.map((section, index) => {
              const isOpen = openSections[section.id] ?? false
              return (
                <article key={section.id} id={section.id} className="legal-doc-section bento-card">
                  <button
                    type="button"
                    className="legal-doc-section__toggle"
                    aria-expanded={isOpen}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span className="legal-doc-section__index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="legal-doc-section__title">{section.title}</span>
                    <ChevronDown
                      size={18}
                      className={isOpen ? 'legal-doc-section__chevron legal-doc-section__chevron--open' : 'legal-doc-section__chevron'}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <motion.div
                        className="legal-doc-section__body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="legal-doc-section__content">{section.content}</div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
