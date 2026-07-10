import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Clock, ArrowRight } from 'lucide-react'
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
              Let's start a<br />
              <em className="text-gold">conversation</em>
            </h1>
            <p className="lead">
              Have a question or want to learn more about our services? We'd love to hear from you.
            </p>
          </div>
          <div className="contact-quick bento-card page-reveal">
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
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <div className="section-header page-reveal">
              <span className="section-label">Visit Us</span>
              <h2>Contact details</h2>
            </div>
            <div className="contact-cards">
              <div className="contact-card bento-card page-reveal">
                <MapPin size={20} />
                <div>
                  <strong>Address</strong>
                  <p>{COMPANY.address}</p>
                </div>
              </div>
              <div className="contact-card bento-card page-reveal">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <p><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
                </div>
              </div>
              <div className="contact-card bento-card page-reveal">
                <Phone size={20} />
                <div>
                  <strong>Phone</strong>
                  {COMPANY.phones.map((p) => (
                    <p key={p}><a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a></p>
                  ))}
                </div>
              </div>
            </div>
            <div className="contact-meta bento-card page-reveal">
              <p><strong>Registration:</strong> {COMPANY.registration}</p>
              <p><strong>Type:</strong> {COMPANY.companyType}</p>
            </div>
          </div>

          <div className="contact-form-wrap page-reveal">
            {submitted ? (
              <div className="contact-success bento-card">
                <h3>Thank you!</h3>
                <p>Your message has been noted. We'll get back to you shortly.</p>
                <p className="contact-success__note">
                  For urgent enquiries, please call us directly.
                </p>
                <Button to="/" variant="secondary">Back to Home</Button>
              </div>
            ) : (
              <form className="contact-form bento-card" onSubmit={handleSubmit}>
                <span className="section-label">Message</span>
                <h2>Send us a note</h2>
                <Input label="Full Name" name="name" required />
                <Input label="Email" name="email" type="email" required />
                <Input label="Phone" name="phone" type="tel" />
                <div className="input-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="input-field" required rows={5} />
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
