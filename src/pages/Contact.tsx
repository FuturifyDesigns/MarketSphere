import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Clock, ArrowRight, MessageSquare, Building2, Send } from 'lucide-react'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import './Contact.css'

export function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="page contact-page">
      <section className="contact-hero">
        <div className="container contact-hero__inner">
          <div className="contact-hero__content page-enter-hero">
            <span className="section-label">Get in Touch</span>
            <h1 className="display-xl">
              Let&apos;s start a<br />
              <em className="text-gold">conversation</em>
            </h1>
            <p className="lead">
              Whether you need a service, want to partner with us, or have a question —
              our team is ready to help you move forward.
            </p>
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
              <h3>We&apos;re here to help</h3>
              <p>Reach out for enquiries, partnerships, or provider onboarding.</p>
            </div>
            <div className="contact-quick bento-card">
              <div className="contact-quick__item">
                <Clock size={18} />
                <div>
                  <strong>Response time</strong>
                  <p>Within 1–2 business days</p>
                </div>
              </div>
              <div className="contact-quick__item">
                <MapPin size={18} />
                <div>
                  <strong>Head office</strong>
                  <p>{COMPANY.headOffice}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section contact-main">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="section-header page-reveal">
              <span className="section-label">Reach Us</span>
              <h2 className="display-lg">Contact details</h2>
              <p className="contact-info__lead">
                Visit our office, send an email, or call — we&apos;d love to hear from you.
              </p>
            </div>

            <div className="contact-cards">
              <a href={`mailto:${COMPANY.email}`} className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><Mail size={20} /></div>
                <div>
                  <strong>Email us</strong>
                  <p>{COMPANY.email}</p>
                  <span className="contact-card__hint">Best for detailed enquiries</span>
                </div>
              </a>
              <div className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><Phone size={20} /></div>
                <div>
                  <strong>Call us</strong>
                  {COMPANY.phones.map((p) => (
                    <p key={p}><a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a></p>
                  ))}
                  <span className="contact-card__hint">Mon–Fri, business hours</span>
                </div>
              </div>
              <div className="contact-card bento-card page-reveal">
                <div className="contact-card__icon"><MapPin size={20} /></div>
                <div>
                  <strong>Visit us</strong>
                  <p>{COMPANY.address}</p>
                  <span className="contact-card__hint">{COMPANY.operationalArea}</span>
                </div>
              </div>
            </div>

            <div className="contact-meta bento-card page-reveal">
              <Building2 size={18} />
              <div>
                <p><strong>Registration:</strong> {COMPANY.registration}</p>
                <p><strong>Type:</strong> {COMPANY.companyType}</p>
              </div>
            </div>
          </div>

          <div className="contact-form-wrap page-reveal">
            {submitted ? (
              <div className="contact-success bento-card">
                <div className="contact-success__icon" aria-hidden="true">✓</div>
                <h3>Thank you!</h3>
                <p>Your message has been noted. We&apos;ll get back to you within 1–2 business days.</p>
                <p className="contact-success__note">
                  For urgent enquiries, please call us directly.
                </p>
                <Button to="/" variant="secondary">Back to Home</Button>
              </div>
            ) : (
              <form className="contact-form bento-card" onSubmit={handleSubmit}>
                <div className="contact-form__header">
                  <div className="contact-form__icon"><Send size={20} /></div>
                  <div>
                    <span className="section-label">Send a message</span>
                    <h2>Tell us how we can help</h2>
                  </div>
                </div>
                <div className="contact-form__fields">
                  <Input label="Full Name" name="name" required />
                  <Input label="Email" name="email" type="email" required />
                  <Input label="Phone" name="phone" type="tel" />
                  <div className="input-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" className="input-field" required rows={5} placeholder="How can we help you?" />
                  </div>
                </div>
                <Button type="submit" size="lg">
                  Send Message <ArrowRight size={16} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
