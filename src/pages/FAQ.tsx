import { useMemo, useState } from 'react'
import { ChevronDown, ArrowRight, Search, HelpCircle, Users, CreditCard, Building2, Layers } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ_ITEMS, FAQ_CATEGORIES, COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import './FAQ.css'

const CATEGORY_META: Record<
  (typeof FAQ_CATEGORIES)[number],
  { icon: typeof HelpCircle; label: string }
> = {
  All: { icon: Layers, label: 'All topics' },
  Platform: { icon: HelpCircle, label: 'Using the platform' },
  Providers: { icon: Users, label: 'For providers' },
  Payments: { icon: CreditCard, label: 'Payments' },
  Company: { icon: Building2, label: 'About us' },
}

export function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(FAQ_ITEMS[0]?.question ?? null)
  const [activeCategory, setActiveCategory] = useState<(typeof FAQ_CATEGORIES)[number]>('All')
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      if (!matchesCategory) return false
      if (!normalized) return true
      return (
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
      )
    })
  }, [activeCategory, query])

  const handleToggle = (question: string) => {
    setOpenQuestion((current) => (current === question ? null : question))
  }

  const handleCategoryChange = (category: (typeof FAQ_CATEGORIES)[number]) => {
    setActiveCategory(category)
    setOpenQuestion(null)
  }

  return (
    <div className="page faq-page">
      <section className="faq-hero">
        <div className="faq-hero__glow" aria-hidden="true" />
        <div className="container faq-hero__inner">
          <div className="faq-hero__content page-enter-hero">
            <span className="section-label">Help Centre</span>
            <h1 className="display-xl">
              Questions?<br />
              <em className="text-gold">We've got answers</em>
            </h1>
            <p className="lead">
              Search or browse topics about {COMPANY.shortName}, providers, and how our platform works.
            </p>

            <label className="faq-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search FAQ"
              />
            </label>
          </div>

          <div className="faq-hero__stats page-reveal">
            <div className="faq-stat">
              <span className="faq-stat__value">{FAQ_ITEMS.length}</span>
              <span className="faq-stat__label">Answers</span>
            </div>
            <div className="faq-stat">
              <span className="faq-stat__value">{FAQ_CATEGORIES.length - 1}</span>
              <span className="faq-stat__label">Topics</span>
            </div>
            <div className="faq-stat">
              <span className="faq-stat__value">24h</span>
              <span className="faq-stat__label">Support reply</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section faq-body">
        <div className="container faq-body__inner">
          <aside className="faq-sidebar page-reveal">
            <p className="faq-sidebar__title">Browse by topic</p>
            <div className="faq-categories" role="tablist" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((category) => {
                const Icon = CATEGORY_META[category].icon
                const count =
                  category === 'All'
                    ? FAQ_ITEMS.length
                    : FAQ_ITEMS.filter((item) => item.category === category).length

                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === category}
                    className={`faq-category ${activeCategory === category ? 'faq-category--active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    <span className="faq-category__icon">
                      <Icon size={16} />
                    </span>
                    <span className="faq-category__copy">
                      <strong>{CATEGORY_META[category].label}</strong>
                      <small>{count} questions</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="faq-main">
            <div className="faq-main__head page-reveal">
              <h2 className="faq-main__title">
                {activeCategory === 'All' ? 'All questions' : CATEGORY_META[activeCategory].label}
              </h2>
              <p className="faq-main__meta">
                {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
                {query ? ` for “${query}”` : ''}
              </p>
            </div>

            <div className="faq-list">
              <AnimatePresence mode="popLayout">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isOpen = openQuestion === item.question
                    const CategoryIcon = CATEGORY_META[item.category].icon

                    return (
                      <motion.div
                        key={item.question}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className={`faq-item bento-card ${isOpen ? 'faq-item--open' : ''}`}
                      >
                        <button
                          type="button"
                          className="faq-question"
                          onClick={() => handleToggle(item.question)}
                          aria-expanded={isOpen}
                        >
                          <span className="faq-question__badge">
                            <CategoryIcon size={14} />
                            {item.category}
                          </span>
                          <span className="faq-question__text">{item.question}</span>
                          <ChevronDown size={18} className="faq-chevron" />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
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
                      </motion.div>
                    )
                  })
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="faq-empty bento-card"
                  >
                    <HelpCircle size={28} />
                    <h3>No matches found</h3>
                    <p>Try a different search term or browse another topic.</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQuery('')
                        setActiveCategory('All')
                      }}
                    >
                      Clear filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--accent">
        <div className="container">
          <div className="cta-panel bento-card page-reveal faq-cta">
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
