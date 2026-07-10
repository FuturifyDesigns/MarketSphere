import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
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
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Get in Touch</span>
          <h1>Contact Market Sphere Group</h1>
          <p className="lead">
            Have a question or want to learn more about our services? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <h2>Visit Us</h2>
            <div className="contact-item">
              <MapPin size={18} />
              <div>
                <strong>Address</strong>
                <p>{COMPANY.address}</p>
              </div>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <div>
                <strong>Email</strong>
                <p><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></p>
              </div>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <div>
                <strong>Phone</strong>
                {COMPANY.phones.map((p) => (
                  <p key={p}><a href={`tel:${p.replace(/\s/g, '')}`}>{p}</a></p>
                ))}
              </div>
            </div>
            <div className="contact-meta">
              <p><strong>Registration:</strong> {COMPANY.registration}</p>
              <p><strong>Type:</strong> {COMPANY.companyType}</p>
            </div>
          </div>

          <div className="contact-form-wrap">
            {submitted ? (
              <div className="contact-success">
                <h3>Thank you!</h3>
                <p>Your message has been noted. We'll get back to you shortly.</p>
                <p className="contact-success__note">
                  For urgent enquiries, please call us directly.
                </p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <h2>Send a Message</h2>
                <Input label="Full Name" name="name" required />
                <Input label="Email" name="email" type="email" required />
                <Input label="Phone" name="phone" type="tel" />
                <div className="input-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" className="input-field" required rows={5} />
                </div>
                <Button type="submit" size="lg">Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
