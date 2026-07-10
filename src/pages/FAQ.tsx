import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQ_ITEMS } from '../lib/constants'
import './FAQ.css'

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="page faq-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">FAQ</span>
          <h1>Frequently Asked Questions</h1>
          <p className="lead">
            Everything you need to know about using MarketSphere and working with Market Sphere Group.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {item.question}
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
