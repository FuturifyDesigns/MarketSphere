import { useState, type FormEvent } from 'react'
import { CheckCircle2, Send, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePersonName,
  validateClientName,
  validateServiceType,
  validateTestimonialContent,
  type FieldErrors,
} from '../../lib/validation'
import { clientRateLimitMessage, isClientRateLimited, markClientRateLimited } from '../../lib/clientRateLimit'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import './TestimonialSubmitForm.css'

type Fields = 'client_name' | 'service_type' | 'content'
const RATE_LIMIT_MS = 60_000

export function TestimonialSubmitForm() {
  const { showToast } = useToast()
  const { locked, runLocked } = useSubmitLock()
  const [form, setForm] = useState({
    client_name: '',
    service_type: '',
    content: '',
    rating: 5,
    companyWebsite: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Fields>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const update = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'client_name' || key === 'service_type' || key === 'content') {
      setFieldErrors((prev) => clearFieldError(prev, key))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || locked) return
    setError('')

    if (form.companyWebsite.trim()) {
      setSubmitted(true)
      return
    }

    const errors = collectErrors<Fields>([
      ['client_name', validateClientName(form.client_name)],
      ['service_type', validateServiceType(form.service_type)],
      ['content', validateTestimonialContent(form.content)],
    ])
    setFieldErrors(errors)
    if (hasErrors(errors)) return

    if (isClientRateLimited('testimonial', RATE_LIMIT_MS)) {
      const msg = clientRateLimitMessage(RATE_LIMIT_MS)
      setError(msg)
      showToast(msg, 'error')
      return
    }

    await runLocked(async () => {
      setLoading(true)
      try {
        const { error: rpcError } = await supabase.rpc('submit_testimonial', {
          p_client_name: form.client_name.trim(),
          p_content: form.content.trim(),
          p_service_type: form.service_type.trim() || null,
          p_rating: form.rating,
          p_honeypot: form.companyWebsite.trim() || null,
        })

        if (rpcError) {
          const msg =
            rpcError.message?.includes('Too many') || rpcError.message?.includes('busy')
              ? rpcError.message
              : 'Could not send your story. Please try again.'
          setError(msg)
          showToast(msg, 'error')
          return
        }

        markClientRateLimited('testimonial')
        setSubmitted(true)
        showToast('Thank you — your story was sent for review.', 'info')
      } catch {
        setError('Could not send your story. Please try again.')
        showToast('Could not send your story. Please try again.', 'error')
      } finally {
        setLoading(false)
      }
    })
  }

  if (submitted) {
    return (
      <div className="testimonial-submit testimonial-submit--success" role="status">
        <CheckCircle2 size={28} aria-hidden="true" />
        <h3>Thank you for sharing</h3>
        <p>
          Your testimonial was received and is waiting for admin review. Once approved, it will appear in the stories above.
        </p>
      </div>
    )
  }

  return (
    <form className="testimonial-submit" onSubmit={handleSubmit} noValidate>
      <div className="testimonial-submit__header">
        <h3>Share your story</h3>
        <p>Tell us about your experience. Submissions are reviewed before they go live.</p>
      </div>

      <div className="testimonial-submit__rating" role="group" aria-label="Rating">
        <span className="testimonial-submit__rating-label">Your rating</span>
        <div className="testimonial-submit__stars">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={
                value <= form.rating
                  ? 'testimonial-submit__star testimonial-submit__star--on'
                  : 'testimonial-submit__star'
              }
              onClick={() => update('rating', value)}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              aria-pressed={value <= form.rating}
            >
              <Star size={18} fill={value <= form.rating ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>

      <div className="testimonial-submit__fields">
        <Input
          label="Your name"
          value={form.client_name}
          onChange={(e) => update('client_name', sanitizePersonName(e.target.value))}
          hint={FIELD_HINTS.clientName}
          error={fieldErrors.client_name}
          autoComplete="name"
        />
        <Input
          label="Service (optional)"
          value={form.service_type}
          onChange={(e) => update('service_type', e.target.value)}
          hint={FIELD_HINTS.serviceType}
          error={fieldErrors.service_type}
          placeholder="e.g. Real Estate"
        />
        <Textarea
          label="Your experience"
          rows={4}
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          hint={FIELD_HINTS.testimonialContent}
          error={fieldErrors.content}
        />
      </div>

      {/* Honeypot */}
      <input
        type="text"
        name="companyWebsite"
        value={form.companyWebsite}
        onChange={(e) => update('companyWebsite', e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="testimonial-submit__honeypot"
        aria-hidden="true"
      />

      {error ? (
        <p className="testimonial-submit__error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={loading || locked}>
        {loading ? 'Sending…' : (
          <>
            Submit for review <Send size={16} />
          </>
        )}
      </Button>
    </form>
  )
}
