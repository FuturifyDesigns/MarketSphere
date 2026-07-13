import { useMemo, useState } from 'react'
import { ChevronDown, ArrowRight, Search, HelpCircle, Users, CreditCard, Building2, Layers, Pencil } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { EditableSection } from '../components/cms/EditableSection'
import { EditableText } from '../components/cms/EditableText'
import { EditableButton } from '../components/cms/EditableButton'
import { useSiteContent } from '../context/SiteContentContext'
import { useSectionFieldEdit } from '../context/SectionEditContext'
import type { FaqItem } from '../lib/siteContentDefaults'
import { CmsExtraSections } from '../components/cms/CmsExtraSections'
import { useToast } from '../context/ToastContext'
import './FAQ.css'

type FaqBlock = {
  hero: {
    eyebrow: string
    title: string
    titleEmphasis: string
    lead: string
    statAnswers: string
    statTopics: string
    statSupport: string
  }
  categories: string[]
  items: FaqItem[]
}

const CATEGORY_META: Record<string, { icon: typeof HelpCircle; label: string }> = {
  All: { icon: Layers, label: 'All topics' },
  Platform: { icon: HelpCircle, label: 'Using the platform' },
  Providers: { icon: Users, label: 'For providers' },
  Payments: { icon: CreditCard, label: 'Payments' },
  Company: { icon: Building2, label: 'About us' },
}

export function FAQ() {
  const { getBlock, updateField } = useSiteContent()
  const canEditFaqList = useSectionFieldEdit()
  const { showToast } = useToast()
  const faq = getBlock<FaqBlock>('faq')
  const items = faq.items || []
  const categories = (faq.categories?.length ? faq.categories : ['All', 'Platform', 'Providers', 'Payments', 'Company']) as string[]

  const [openQuestion, setOpenQuestion] = useState<string | null>(items[0]?.question ?? null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory
      if (!matchesCategory) return false
      if (!normalized) return true
      return (
        item.question.toLowerCase().includes(normalized) ||
        item.answer.toLowerCase().includes(normalized)
      )
    })
  }, [activeCategory, items, query])

  const handleToggle = (question: string) => {
    setOpenQuestion((current) => (current === question ? null : question))
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setOpenQuestion(null)
  }

  const updateItem = async (id: string, field: keyof FaqItem, value: string) => {
    const next = items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    try {
      await updateField('faq', 'items', next)
      showToast('FAQ updated — live for all visitors.')
    } catch {
      showToast('Could not save FAQ item.', 'error')
    }
  }

  const addItem = async () => {
    const next: FaqItem = {
      id: `faq-${crypto.randomUUID()}`,
      category: 'Platform',
      question: 'New question',
      answer: 'Add your answer here.',
    }
    try {
      await updateField('faq', 'items', [...items, next])
      setOpenQuestion(next.question)
      showToast('FAQ item added.')
    } catch {
      showToast('Could not add FAQ item.', 'error')
    }
  }

  const removeItem = async (id: string) => {
    try {
      await updateField('faq', 'items', items.filter((item) => item.id !== id))
      showToast('FAQ item removed.')
    } catch {
      showToast('Could not remove FAQ item.', 'error')
    }
  }

  const titleLines = faq.hero.title.split('\n')

  return (
    <div className="page faq-page">
      <EditableSection id="faq-hero" label="Hero" className="faq-hero">
        <div className="faq-hero__glow" aria-hidden="true" />
        <div className="container faq-hero__inner">
          <div className="faq-hero__content page-enter-hero">
            <EditableText contentKey="faq" path="hero.eyebrow" as="span" className="section-label" />
            <h1 className="display-xl">
              {titleLines[0] ? (
                <EditableText contentKey="faq" path="hero.title" as="span" multiline />
              ) : null}
              <br />
              <em className="text-gold">
                <EditableText contentKey="faq" path="hero.titleEmphasis" as="span" />
              </em>
            </h1>
            <EditableText contentKey="faq" path="hero.lead" as="p" className="lead" multiline />

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
              <EditableText contentKey="faq" path="hero.statAnswers" as="span" className="faq-stat__value" />
              <span className="faq-stat__label">Answers</span>
            </div>
            <div className="faq-stat">
              <EditableText contentKey="faq" path="hero.statTopics" as="span" className="faq-stat__value" />
              <span className="faq-stat__label">Topics</span>
            </div>
            <div className="faq-stat">
              <EditableText contentKey="faq" path="hero.statSupport" as="span" className="faq-stat__value" />
              <span className="faq-stat__label">Support reply</span>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="faq-list" label="Questions" className="section faq-body">
        <div className="container faq-body__inner">
          <aside className="faq-sidebar page-reveal">
            <p className="faq-sidebar__title">Browse by topic</p>
            <div className="faq-categories" role="tablist" aria-label="FAQ categories">
              {categories.map((category) => {
                const meta = CATEGORY_META[category] ?? CATEGORY_META.All
                const Icon = meta.icon
                const count =
                  category === 'All'
                    ? items.length
                    : items.filter((item) => item.category === category).length

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
                      <strong>{meta.label}</strong>
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
                {activeCategory === 'All' ? 'All questions' : (CATEGORY_META[activeCategory]?.label ?? activeCategory)}
              </h2>
              <p className="faq-main__meta">
                {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
                {query ? ` for “${query}”` : ''}
              </p>
              {canEditFaqList ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => void addItem()}>
                  Add FAQ item
                </Button>
              ) : null}
            </div>

            <div className="faq-list">
              <AnimatePresence mode="popLayout">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isOpen = openQuestion === item.question
                    const CategoryIcon = CATEGORY_META[item.category]?.icon ?? HelpCircle

                    return (
                      <motion.div
                        key={item.id}
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
                              {canEditFaqList ? (
                                <div className="cms-editable cms-editable--active" style={{ padding: '8px 0' }}>
                                  <label style={{ display: 'block', marginBottom: 8 }}>
                                    <small>Question</small>
                                    <input
                                      className="cms-editable__input"
                                      value={item.question}
                                      onChange={(e) => void updateItem(item.id, 'question', e.target.value)}
                                    />
                                  </label>
                                  <label style={{ display: 'block', marginBottom: 8 }}>
                                    <small>Answer</small>
                                    <textarea
                                      className="cms-editable__input"
                                      rows={4}
                                      value={item.answer}
                                      onChange={(e) => void updateItem(item.id, 'answer', e.target.value)}
                                    />
                                  </label>
                                  <label style={{ display: 'block', marginBottom: 8 }}>
                                    <small>Category</small>
                                    <select
                                      className="cms-editable__input"
                                      value={item.category}
                                      onChange={(e) => void updateItem(item.id, 'category', e.target.value)}
                                    >
                                      {categories.filter((c) => c !== 'All').map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <button
                                    type="button"
                                    className="cms-editable__cancel"
                                    onClick={() => void removeItem(item.id)}
                                  >
                                    Remove item
                                  </button>
                                </div>
                              ) : (
                                <p>{item.answer}</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {canEditFaqList && !isOpen ? (
                          <button
                            type="button"
                            className="cms-editable__trigger"
                            style={{ position: 'absolute', top: 12, right: 12 }}
                            onClick={() => setOpenQuestion(item.question)}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        ) : null}
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
      </EditableSection>

      <EditableSection id="faq-support" label="Support CTA" className="section section--accent">
        <div className="container">
          <div className="cta-panel bento-card page-reveal faq-cta">
            <EditableText contentKey="faq" path="supportCta.eyebrow" as="span" className="section-label" />
            <EditableText contentKey="faq" path="supportCta.title" as="h2" className="display-lg" />
            <EditableText contentKey="faq" path="supportCta.body" as="p" multiline />
            <div className="cta-panel__actions">
              <EditableButton
                contentKey="faq"
                labelPath="supportCta.primaryLabel"
                hrefPath="supportCta.primaryHref"
                to="/contact"
                size="lg"
              >
                <ArrowRight size={16} />
              </EditableButton>
              <EditableButton
                contentKey="faq"
                labelPath="supportCta.secondaryLabel"
                hrefPath="supportCta.secondaryHref"
                to="/register"
                variant="secondary"
                size="lg"
              />
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="faq-extra" label="Extra sections" as="div">
        <div className="container">
          <CmsExtraSections contentKey="faq" />
        </div>
      </EditableSection>
    </div>
  )
}
