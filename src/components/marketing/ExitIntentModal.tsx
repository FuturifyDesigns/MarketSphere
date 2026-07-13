import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, Search, X } from 'lucide-react'
import { COMPANY } from '../../lib/constants'
import { hasDismissedExitIntent, markExitIntentDismissed } from '../../lib/exitIntent'
import { lockBodyScroll, unlockBodyScroll } from '../../lib/bodyScrollLock'
import { MASCOT_PATHS } from '../../lib/mascots'
import { useModalWheelScroll } from '../../hooks/useModalWheelScroll'
import { Button } from '../ui/Button'
import '../onboarding/Onboarding.css'
import './ExitIntentModal.css'

const ACTIVATION_DELAY_MS = 8_000

const BLOCKED_PATH_PREFIXES = [
  '/login',
  '/register',
  '/get-started',
  '/auth/',
  '/forgot-password',
]

function isBlockedPath(pathname: string) {
  return BLOCKED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function ExitIntentModal() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const modalRef = useModalWheelScroll<HTMLDivElement>(open)

  const close = () => {
    markExitIntentDismissed()
    setOpen(false)
  }

  useEffect(() => {
    if (isBlockedPath(location.pathname) || hasDismissedExitIntent()) return

    let armed = false
    const armTimer = window.setTimeout(() => {
      armed = true
    }, ACTIVATION_DELAY_MS)

    const onMouseOut = (event: MouseEvent) => {
      if (!armed || open) return
      if (event.clientY > 16) return

      const related = event.relatedTarget
      if (related instanceof Node && document.documentElement.contains(related)) return

      setOpen(true)
    }

    document.documentElement.addEventListener('mouseout', onMouseOut)

    return () => {
      window.clearTimeout(armTimer)
      document.documentElement.removeEventListener('mouseout', onMouseOut)
    }
  }, [location.pathname, open])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="exit-intent-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={close}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            className="welcome-message exit-intent-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-intent-title"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="welcome-message__close" onClick={close} aria-label="Close">
              <X size={18} aria-hidden="true" />
            </button>

            <div className="welcome-message__scroll" data-modal-scroll>
              <span className="welcome-message__eyebrow">Before you go</span>

              <div className="welcome-message__mascot-wrap">
                <img
                  src={MASCOT_PATHS.welcome}
                  alt=""
                  className="welcome-message__mascot"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                />
              </div>

              <h2 id="exit-intent-title" className="welcome-message__title">
                Wait — still looking for the right provider?
              </h2>
              <p className="welcome-message__lead">
                {COMPANY.shortName} connects you with verified professionals across Botswana. Browse listings,
                send enquiries, or list your own business — all in one place.
              </p>

              <ul className="welcome-message__bullets exit-intent-modal__bullets">
                <li>
                  <Search size={15} aria-hidden="true" />
                  Browse providers by category and location
                </li>
                <li>
                  <BriefcaseBusiness size={15} aria-hidden="true" />
                  Sign up free as a customer or service provider
                </li>
                <li>Track enquiries and grow your network from your dashboard</li>
              </ul>
            </div>

            <div className="welcome-message__footer">
              <div className="welcome-message__actions exit-intent-modal__actions">
                <Button to="/browse" size="lg" onClick={close}>
                  Browse providers
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button to="/register" size="lg" variant="secondary" onClick={close}>
                  Create free account
                </Button>
                <Button type="button" variant="ghost" className="exit-intent-modal__stay" onClick={close}>
                  Stay on site
                </Button>
              </div>

              <p className="welcome-message__footnote">
                Need help? <Link to="/contact" onClick={close}>Contact our team</Link> or read the{' '}
                <Link to="/faq" onClick={close}>FAQ</Link>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
