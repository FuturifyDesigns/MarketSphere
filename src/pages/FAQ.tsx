import { useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ_ITEMS } from '../lib/constants'
import { Button } from '../components/ui/Button'
import './FAQ.css'

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="page faq-page">
      <section className="faq-hero">
        <div className="container faq-hero__inner">
          <div className="faq-hero__content page-enter-hero">
            <span className="section-label">FAQ</span>
            <h1 className="display-xl">
              Questions?<br />
              <em className="text-gold">We've got answers</em>
            </h1>
            <p className="lead">
              Everything you need to know about using MarketSphere and working with Market Sphere Group.
            </p>
          </div>
          <div className="faq-hero__card bento-card page-reveal">
            <span className="faq-hero__count">{FAQ_ITEMS.length}</span>
            <p>Common questions about our platform, providers, and services.</p>
            <Button to="/contact" variant="secondary" size="sm">
              Still need help? <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.question}
                className={`faq-item bento-card page-reveal ${openIndex === i ? 'faq-item--open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                >
                  <span className="faq-question__index">0{i + 1}</span>
                  <span className="faq-question__text">{item.question}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--accent">
        <div className="container">
          <div className="cta-panel bento-card page-reveal">
            <span className="section-label">Support</span>
            <h2 className="display-lg">Can't find what you're looking for?</h2>
            <p>Our team is ready to help with any questions about services, providers, or your account.</p>
            <div className="cta-panel__actions">
              <Button to="/contact" size="lg">
                Contact Us <ArrowRight size={16} />
              </Button>
              <Button to="/register" variant="secondary" size="lg">
                Create Account
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
