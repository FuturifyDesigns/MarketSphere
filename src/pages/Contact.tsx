import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Clock, ArrowRight, MessageSquare, Building2, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSiteContent } from '../context/SiteContentContext'
import type { CmsStringItem } from '../lib/cmsTypes'
import { EditableSection } from '../components/cms/EditableSection'
import { EditableText } from '../components/cms/EditableText'
import { CmsStringList } from '../components/cms/CmsStringList'
import { CmsExtraSections } from '../components/cms/CmsExtraSections'
import { useToast } from '../context/ToastContext'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePersonName,
  sanitizePhone,
  validateEmail,
  validateMessage,
  validateName,
  validatePhone,
  type FieldErrors,
} from '../lib/validation'
import { clientRateLimitMessage, isClientRateLimited, markClientRateLimited } from '../lib/clientRateLimit'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import './Contact.css'

type ContactFields = 'name' | 'email' | 'phone' | 'message'

const CONTACT_RATE_LIMIT_MS = 60_000

export function Contact() {
  const { showToast } = useToast()
  const { getBlock } = useSiteContent()
  const company = getBlock<{
    headOffice: string
    registration: string
    companyType: string
    email: string
    address: string
    operationalArea: string
    phones: CmsStringItem[]
  }>('company')
  const phones = company.phones || []
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', companyWebsite: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ContactFields>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (key: ContactFields, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => clearFieldError(prev, key))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Honeypot: bots fill hidden fields — silently accept without sending.
    if (form.companyWebsite.trim()) {
      setSubmitted(true)
      return
    }

    const errors = collectErrors<ContactFields>([
      ['name', validateName(form.name, 'Full name')],
      ['email', validateEmail(form.email)],
      ['phone', validatePhone(form.phone, true)],
      ['message', validateMessage(form.message)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    if (isClientRateLimited('contact', CONTACT_RATE_LIMIT_MS)) {
      const msg = clientRateLimitMessage(CONTACT_RATE_LIMIT_MS)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase.rpc('submit_contact_message', {
      p_full_name: form.name.trim(),
      p_email: form.email.trim(),
      p_phone: form.phone.trim() || null,
      p_message: form.message.trim(),
      p_honeypot: form.companyWebsite.trim() || null,
    })

    setLoading(false)

    if (insertError) {
      const msg =
        insertError.message?.includes('Too many') || insertError.message?.includes('busy')
          ? insertError.message
          : 'Could not send your message. Please try again or email us directly.'
      setError(msg)
      showToast(msg, 'error')
      return
    }

    markClientRateLimited('contact')
    setForm({ name: '', email: '', phone: '', message: '', companyWebsite: '' })
    setSubmitted(true)
    showToast('Message sent. Our team has been notified and will get back to you soon.')
  }

  return (
    <div className="page contact-page">
      <EditableSection id="contact-hero" label="Hero" className="contact-hero">
        <div className="container contact-hero__inner">
          <div className="contact-hero__content page-enter-hero">
            <EditableText contentKey="contact" path="hero.eyebrow" as="span" className="section-label" />
            <h1 className="display-xl">
              <EditableText contentKey="contact" path="hero.title" as="span" />
              <br />
              <em className="text-gold">
                <EditableText contentKey="contact" path="hero.titleEmphasis" as="span" />
              </em>
            </h1>
            <EditableText contentKey="contact" path="hero.lead" as="p" className="lead" multiline />
            <div className="contact-hero__actions">
              <Button to="/browse" size="lg">
                Browse Providers <ArrowRight size={16} />
              </Button>
              <Button to="/services" variant="secondary" size="lg">Our Services</Button>
            </div>
          </div>

          <div className="contact-hero__visual page-reveal">
            <div className="contact-hero__card bento-card">
              <div className="contact-hero__card-glow" aria-hidden="true" />
              <MessageSquare size={32} strokeWidth={1.25} />
              <h3>
                <EditableText contentKey="contact" path="hero.cardTitle" as="span" />
              </h3>
              <EditableText contentKey="contact" path="hero.cardBody" as="p" multiline />
            </div>
            <div className="contact-quick bento-card">
              <div className="contact-quick__item">
                <Clock size={18} />
                <div>
                  <strong>Response time</strong>
                  <p><EditableText contentKey="contact" path="hero.responseTime" as="span" /></p>
                </div>
              </div>
              <div className="contact-quick__item">
                <MapPin size={18} />
                <div>
                  <strong>
                    <EditableText contentKey="contact" path="hero.headOfficeLabel" as="span" />
                  </strong>
                  <p><EditableText contentKey="company" path="headOffice" as="span" multiline /></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </EditableSection>

      <EditableSection id="contact-details" label="Contact details" className="section contact-main">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="section-header page-reveal">
              <EditableText contentKey="contact" path="details.sectionEyebrow" as="span" className="section-label" />
              <EditableText contentKey="contact" path="details.sectionTitle" as="h2" className="display-lg" />
              <EditableText contentKey="contact" path="details.sectionLead" as="p" className="contact-info__lead" multiline />
            </div>

            <div className="contact-cards">
              <a href={`mailto:${company.email}`} className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><Mail size={20} /></div>
                <div>
                  <strong><EditableText contentKey="contact" path="details.emailLabel" as="span" /></strong>
                  <p>
                    <a href={`mailto:${company.email}`}>
                      <EditableText contentKey="company" path="email" as="span" />
                    </a>
                  </p>
                  <span className="contact-card__hint">
                    <EditableText contentKey="contact" path="details.emailHint" as="span" />
                  </span>
                </div>
              </a>
              <div className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><Phone size={20} /></div>
                <div>
                  <strong><EditableText contentKey="contact" path="details.phoneLabel" as="span" /></strong>
                  {phones.map((phone, index) => (
                    <p key={phone.id}>
                      <a href={`tel:${phone.text.replace(/\s/g, '')}`}>
                        <EditableText contentKey="company" path={`phones.${index}.text`} as="span" />
                      </a>
                    </p>
                  ))}
                  <CmsStringList contentKey="company" path="phones" items={phones} placeholder="Phone number" />
                  <span className="contact-card__hint">
                    <EditableText contentKey="contact" path="details.phoneHint" as="span" />
                  </span>
                </div>
              </div>
              <div className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><MapPin size={20} /></div>
                <div>
                  <strong><EditableText contentKey="contact" path="details.visitLabel" as="span" /></strong>
                  <p><EditableText contentKey="company" path="address" as="span" multiline /></p>
                  <span className="contact-card__hint">
                    <EditableText contentKey="company" path="operationalArea" as="span" />
                  </span>
                </div>
              </div>
            </div>

            <div className="contact-meta bento-card page-reveal">
              <Building2 size={18} />
              <div>
                <p>
                  <strong>
                    <EditableText contentKey="contact" path="details.registrationLabel" as="span" />
                  </strong>{' '}
                  <EditableText contentKey="company" path="registration" as="span" />
                </p>
                <p>
                  <strong>
                    <EditableText contentKey="contact" path="details.typeLabel" as="span" />
                  </strong>{' '}
                  <EditableText contentKey="company" path="companyType" as="span" />
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form-wrap page-reveal">
            {submitted ? (
              <div className="contact-success bento-card">
                <div className="contact-success__icon" aria-hidden="true">✓</div>
                <EditableText contentKey="contact" path="form.successTitle" as="h3" />
                <EditableText contentKey="contact" path="form.successBody" as="p" multiline />
                <p className="contact-success__note">
                  <EditableText contentKey="contact" path="form.successNote" as="span" multiline />
                </p>
                <Button to="/" variant="secondary">Back to Home</Button>
              </div>
            ) : (
              <form className="contact-form bento-card" onSubmit={handleSubmit} noValidate>
                <div className="contact-form__header">
                  <div className="contact-form__icon"><Send size={20} /></div>
                  <div>
                    <EditableText contentKey="contact" path="form.eyebrow" as="span" className="section-label" />
                    <EditableText contentKey="contact" path="form.title" as="h2" />
                  </div>
                </div>
                <div className="contact-form__fields">
                  <div className="contact-form__hp" aria-hidden="true">
                    <label htmlFor="companyWebsite">Company website</label>
                    <input
                      id="companyWebsite"
                      name="companyWebsite"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.companyWebsite}
                      onChange={(e) => setForm((prev) => ({ ...prev, companyWebsite: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Full Name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => updateField('name', sanitizePersonName(e.target.value))}
                    hint={FIELD_HINTS.fullName}
                    error={fieldErrors.name}
                  />
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    hint={FIELD_HINTS.email}
                    error={fieldErrors.email}
                  />
                  <Input
                    label="Phone (optional)"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', sanitizePhone(e.target.value))}
                    hint={FIELD_HINTS.phone}
                    error={fieldErrors.phone}
                  />
                  <Textarea
                    label="Message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    hint={FIELD_HINTS.message}
                    error={fieldErrors.message}
                  />
                </div>
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? 'Sending…' : <EditableText contentKey="contact" path="form.submitLabel" as="span" />}{' '}
                  <ArrowRight size={16} />
                </Button>
                <p className="contact-form__privacy">
                  <EditableText contentKey="contact" path="form.privacyNote" as="span" multiline />
                </p>
                {error && <p className="contact-form__error" role="alert">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </EditableSection>

      <EditableSection id="contact-extra" label="Extra sections" as="div">
        <div className="container">
          <CmsExtraSections contentKey="contact" />
        </div>
      </EditableSection>
    </div>
  )
}
