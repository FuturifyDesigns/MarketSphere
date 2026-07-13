import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Shield, Cookie } from 'lucide-react'
import { useCookieConsent } from '../../context/CookieConsentContext'
import { Button } from '../ui/Button'
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
  showCookieAction?: boolean
}

export function LegalDocument({
  title,
  subtitle,
  meta,
  intro,
  sections,
  showCookieAction = false,
}: LegalDocumentProps) {
  const { openCookieSettings } = useCookieConsent()
  const location = useLocation()
  const navigate = useNavigate()
  const rightsSectionId = 'your-rights'
  const hasRightsSection = sections.some((section) => section.id === rightsSectionId)
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section, index) => [section.id, index === 0])),
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections])

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const jumpTo = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }))
    setActiveId(id)
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const viewRights = useCallback(() => {
    if (hasRightsSection) {
      jumpTo(rightsSectionId)
      return
    }
    navigate('/privacy', { state: { scrollTo: rightsSectionId } })
  }, [hasRightsSection, jumpTo, navigate])

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!scrollTo || !sections.some((section) => section.id === scrollTo)) return

    const timer = window.setTimeout(() => {
      jumpTo(scrollTo)
      navigate('.', { replace: true, state: null })
    }, 120)

    return () => window.clearTimeout(timer)
  }, [jumpTo, location.state, navigate, sections])

  const quickActions = useMemo(
    () => [
      ...(showCookieAction
        ? [
            {
              icon: Cookie,
              label: 'Cookie settings',
              text: 'Review or change your cookie preferences',
              action: (
                <Button size="sm" variant="secondary" onClick={openCookieSettings}>
                  Manage cookies
                </Button>
              ),
            },
          ]
        : []),
      {
        icon: Shield,
        label: 'Your rights',
        text: 'Access, correction, erasure, and withdrawal of consent',
        action: (
          <Button size="sm" variant="secondary" onClick={viewRights}>
            View rights
          </Button>
        ),
      },
    ],
    [openCookieSettings, showCookieAction, viewRights],
  )

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
            <nav className="legal-doc-toc">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={activeId === section.id ? 'legal-doc-toc__link legal-doc-toc__link--active' : 'legal-doc-toc__link'}
                  onClick={() => jumpTo(section.id)}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="legal-doc-sidebar__actions">
            {quickActions.map((item) => (
              <div key={item.label} className="legal-doc-action">
                <item.icon size={18} aria-hidden="true" />
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.text}</p>
                  {item.action}
                </div>
              </div>
            ))}
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
