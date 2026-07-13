import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, X } from 'lucide-react'
import { isIntroComplete, onIntroComplete } from '../../lib/intro'
import { hasSeenWelcome, markWelcomeSeen } from '../../lib/onboarding'
import { MASCOT_PATHS } from '../../lib/mascots'
import { Button } from '../ui/Button'
import './Onboarding.css'

const WELCOME_DELAY_MS = 500

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (hasSeenWelcome()) return

    const reveal = () => {
      if (!hasSeenWelcome()) setOpen(true)
    }

    if (isIntroComplete()) {
      const timer = window.setTimeout(reveal, WELCOME_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    return onIntroComplete(() => {
      window.setTimeout(reveal, WELCOME_DELAY_MS)
    })
  }, [])

  const closeWelcome = () => {
    markWelcomeSeen()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="welcome-message-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={closeWelcome}
          role="presentation"
        >
          <motion.div
            className="welcome-message"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-message-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="welcome-message__close"
              onClick={closeWelcome}
              aria-label="Close welcome message"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <span className="welcome-message__eyebrow">Welcome</span>

            <div className="welcome-message__mascot-wrap">
              <img
                src={MASCOT_PATHS.welcome}
                alt=""
                className="welcome-message__mascot"
                decoding="async"
              />
            </div>

            <h2 id="welcome-message-title" className="welcome-message__title">
              Welcome to Market Sphere Group
            </h2>
            <p className="welcome-message__lead">
              Your trusted marketplace for discovering verified service providers across Botswana —
              from tutors and consultants to youth mentors and real estate experts.
            </p>
            <p className="welcome-message__signup">
              Create a free account as a <strong>customer</strong> to find services, or sign up as a{' '}
              <strong>provider</strong> to list your business and reach new clients.
            </p>

            <ul className="welcome-message__bullets">
              <li>Browse providers by category and location</li>
              <li>Send secure enquiries from provider profiles</li>
              <li>Track messages from your dashboard</li>
            </ul>

            <div className="welcome-message__actions">
              <Button type="button" size="lg" onClick={closeWelcome}>
                Got it
              </Button>
              <Button to="/get-started" size="lg" variant="secondary" onClick={closeWelcome}>
                Sign up
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>

            <p className="welcome-message__footnote">
              Already have an account? <Link to="/login" onClick={closeWelcome}>Sign in</Link>
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
