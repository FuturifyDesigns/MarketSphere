import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Heart, Mail, MapPin, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { Provider } from '../lib/types'
import './ProviderProfile.css'

export function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [enquiry, setEnquiry] = useState({ subject: '', message: '' })
  const [enquirySent, setEnquirySent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('providers')
      .select('*, provider_services(*, categories(*))')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProvider(data)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase
      .from('favorites')
      .select('*')
      .eq('customer_id', user.id)
      .eq('provider_id', id)
      .maybeSingle()
      .then(({ data }) => setIsFavorite(!!data))
  }, [user, id])

  const toggleFavorite = async () => {
    if (!user || !id) return
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('customer_id', user.id).eq('provider_id', id)
      setIsFavorite(false)
    } else {
      await supabase.from('favorites').insert({ customer_id: user.id, provider_id: id })
      setIsFavorite(true)
    }
  }

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    await supabase.from('enquiries').insert({
      customer_id: user.id,
      provider_id: id,
      subject: enquiry.subject,
      message: enquiry.message,
    })
    setEnquirySent(true)
    setShowEnquiry(false)
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>
  if (!provider) return <div className="container section"><p>Provider not found.</p></div>

  return (
    <div className="page provider-profile-page">
      <section className="provider-hero">
        <div className="container provider-hero__inner">
          <div className="provider-hero__logo">
            {provider.logo_url ? (
              <img src={provider.logo_url} alt="" />
            ) : (
              <div className="provider-hero__placeholder">{provider.business_name.charAt(0)}</div>
            )}
          </div>
          <div className="provider-hero__info">
            <h1>{provider.business_name}</h1>
            {provider.location && (
              <p className="provider-location"><MapPin size={16} /> {provider.location}</p>
            )}
            <div className="provider-hero__actions">
              {user && profile?.role === 'customer' && (
                <>
                  <Button onClick={() => setShowEnquiry(true)}>Send Enquiry</Button>
                  <button className="favorite-btn" onClick={toggleFavorite}>
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    {isFavorite ? 'Saved' : 'Save'}
                  </button>
                </>
              )}
              {!user && <Button to="/login">Sign In to Enquire</Button>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container provider-content">
          <div className="provider-main">
            {provider.description && (
              <div className="provider-section">
                <h2>About</h2>
                <p>{provider.description}</p>
              </div>
            )}

            {provider.provider_services && provider.provider_services.length > 0 && (
              <div className="provider-section">
                <h2>Services Offered</h2>
                <div className="provider-services-list">
                  {provider.provider_services.map((s) => (
                    <div key={s.id} className="provider-service-item">
                      <h3>{s.title}</h3>
                      {s.categories && <span className="service-tag">{s.categories.name}</span>}
                      {s.description && <p>{s.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {provider.gallery_urls && provider.gallery_urls.length > 0 && (
              <div className="provider-section">
                <h2>Gallery</h2>
                <div className="provider-gallery">
                  {provider.gallery_urls.map((url, i) => (
                    <img key={i} src={url} alt="" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="provider-sidebar">
            <div className="contact-card">
              <h3>Contact</h3>
              {provider.contact_email && (
                <p><Mail size={14} /> <a href={`mailto:${provider.contact_email}`}>{provider.contact_email}</a></p>
              )}
              {provider.contact_phone && (
                <p><Phone size={14} /> <a href={`tel:${provider.contact_phone}`}>{provider.contact_phone}</a></p>
              )}
            </div>
          </aside>
        </div>
      </section>

      {showEnquiry && (
        <div className="modal-overlay" onClick={() => setShowEnquiry(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Send Enquiry</h2>
            <form onSubmit={submitEnquiry}>
              <Input
                label="Subject"
                value={enquiry.subject}
                onChange={(e) => setEnquiry({ ...enquiry, subject: e.target.value })}
                required
              />
              <div className="input-group">
                <label htmlFor="enquiry-msg">Message</label>
                <textarea
                  id="enquiry-msg"
                  className="input-field"
                  value={enquiry.message}
                  onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                  required
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={() => setShowEnquiry(false)}>Cancel</Button>
                <Button type="submit">Send</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {enquirySent && (
        <div className="toast">Enquiry sent successfully!</div>
      )}
    </div>
  )
}
