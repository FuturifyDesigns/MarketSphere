import { useEffect, useState, type ChangeEvent } from 'react'
import { Inbox, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, removeStorageFile, storagePathFromPublicUrl, uploadPreparedFile } from '../../lib/supabase'
import { prepareGalleryImage, prepareLogoImage, UPLOAD_LIMITS } from '../../lib/imageUpload'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  hasErrors,
  validateBusinessName,
  validateDescription,
  validateLocation,
  validateOptionalEmail,
  validatePhone,
  validateServiceDescription,
  validateServiceTitle,
  type FieldErrors,
} from '../../lib/validation'
import type { Category, Enquiry, Provider, ProviderService } from '../../lib/types'
import './Dashboard.css'

type ProfileFields = 'business_name' | 'description' | 'location' | 'contact_email' | 'contact_phone'
type ServiceFields = 'title' | 'description'

export function ProviderDashboard() {
  const { user, refreshProfile } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState<'profile' | 'inbox' | 'services'>('profile')
  const [form, setForm] = useState({
    business_name: '',
    description: '',
    location: '',
    contact_email: '',
    contact_phone: '',
  })
  const [newService, setNewService] = useState({ title: '', description: '', category_id: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileFields>>({})
  const [serviceErrors, setServiceErrors] = useState<FieldErrors<ServiceFields>>({})
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []))

    supabase
      .from('providers')
      .select('*, provider_services(*, categories(*))')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProvider(data)
          setForm({
            business_name: data.business_name || '',
            description: data.description || '',
            location: data.location || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
          })
        }
      })
  }, [user])

  useEffect(() => {
    if (!provider) return
    supabase
      .from('enquiries')
      .select('*, profiles(full_name, email)')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEnquiries(data || []))
  }, [provider])

  const saveProfile = async () => {
    if (!user) return
    setSaveError('')

    const errors = collectErrors<ProfileFields>([
      ['business_name', validateBusinessName(form.business_name)],
      ['description', validateDescription(form.description, false, 20)],
      ['location', validateLocation(form.location)],
      ['contact_email', validateOptionalEmail(form.contact_email)],
      ['contact_phone', validatePhone(form.contact_phone, true)],
    ])
    setProfileErrors(errors)
    if (hasErrors(errors)) return

    const payload = {
      business_name: form.business_name.trim(),
      description: form.description.trim(),
      location: form.location.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
    }

    setSaving(true)
    if (provider) {
      const { error } = await supabase
        .from('providers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', provider.id)
      if (error) setSaveError('Could not update profile. Please try again.')
    } else {
      const { data, error } = await supabase
        .from('providers')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
      if (error) {
        setSaveError('Could not submit profile. Please try again.')
      } else {
        setProvider(data)
      }
    }
    setSaving(false)
    refreshProfile()
  }

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !provider) return

    setUploadError('')
    setUploadingLogo(true)

    try {
      const prepared = await prepareLogoImage(file)
      const url = await uploadPreparedFile('provider-logos', `${provider.id}/logo`, prepared)
      if (!url) throw new Error('Logo upload failed')

      await supabase.from('providers').update({ logo_url: url }).eq('id', provider.id)
      setProvider({ ...provider, logo_url: url })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !provider) return

    const currentCount = provider.gallery_urls?.length || 0
    if (currentCount >= UPLOAD_LIMITS.gallery.maxCount) {
      setUploadError(`Gallery limit is ${UPLOAD_LIMITS.gallery.maxCount} images.`)
      return
    }

    setUploadError('')
    setUploadingGallery(true)

    try {
      const prepared = await prepareGalleryImage(file)
      const path = `${provider.id}/${prepared.name}`
      const url = await uploadPreparedFile('provider-gallery', path, prepared)
      if (!url) throw new Error('Gallery upload failed')

      const gallery_urls = [...(provider.gallery_urls || []), url]
      await supabase.from('providers').update({ gallery_urls }).eq('id', provider.id)
      setProvider({ ...provider, gallery_urls })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gallery upload failed')
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeGalleryImage = async (url: string) => {
    if (!provider) return

    const path = storagePathFromPublicUrl('provider-gallery', url)
    if (path) await removeStorageFile('provider-gallery', path)

    const gallery_urls = (provider.gallery_urls || []).filter((item) => item !== url)
    await supabase.from('providers').update({ gallery_urls }).eq('id', provider.id)
    setProvider({ ...provider, gallery_urls })
  }

  const addService = async () => {
    if (!provider) return
    setSaveError('')

    const errors = collectErrors<ServiceFields>([
      ['title', validateServiceTitle(newService.title)],
      ['description', validateServiceDescription(newService.description)],
    ])
    setServiceErrors(errors)
    if (hasErrors(errors)) return

    const { data, error } = await supabase
      .from('provider_services')
      .insert({
        provider_id: provider.id,
        title: newService.title.trim(),
        description: newService.description.trim() || null,
        category_id: newService.category_id || null,
      })
      .select('*, categories(*)')
      .single()
    if (error) {
      setSaveError('Could not add service. Please try again.')
      return
    }
    if (data) {
      setProvider({
        ...provider,
        provider_services: [...(provider.provider_services || []), data],
      })
      setNewService({ title: '', description: '', category_id: '' })
      setServiceErrors({})
    }
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from('enquiries').update({ status }).eq('id', id)
    setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status: status as Enquiry['status'] } : e)))
  }

  const statusLabel = provider?.status || 'not_created'
  const galleryCount = provider?.gallery_urls?.length || 0

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Provider Dashboard</h1>
          <p>Manage your business profile and enquiries</p>
          {provider && (
            <span className={`status-badge status-badge--${statusLabel}`}>
              Status: {statusLabel}
            </span>
          )}
        </div>

        <div className="dashboard-tabs">
          <button className={tab === 'profile' ? 'tab--active' : ''} onClick={() => setTab('profile')}>
            <Settings size={16} /> Profile
          </button>
          <button className={tab === 'services' ? 'tab--active' : ''} onClick={() => setTab('services')}>
            Services
          </button>
          <button className={tab === 'inbox' ? 'tab--active' : ''} onClick={() => setTab('inbox')}>
            <Inbox size={16} /> Inbox {enquiries.filter((e) => e.status === 'new').length > 0 && `(${enquiries.filter((e) => e.status === 'new').length})`}
          </button>
        </div>

        {tab === 'profile' && (
          <div className="dashboard-profile-layout">
            <AccountProfileCard />
            <div className="dashboard-form">
              {provider?.logo_url && (
                <img src={provider.logo_url} alt="" className="dashboard-logo-preview" />
              )}
              <div className="input-group">
                <label>Business Logo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={!provider || uploadingLogo}
                />
                {!provider && <small>Save your profile first to upload a logo</small>}
                {uploadingLogo && <small>Compressing and uploading logo…</small>}
              </div>

              <div className="input-group gallery-upload">
                <label>Gallery ({galleryCount}/{UPLOAD_LIMITS.gallery.maxCount})</label>
                {galleryCount > 0 && (
                  <div className="gallery-grid">
                    {(provider?.gallery_urls || []).map((url) => (
                      <div key={url} className="gallery-item">
                        <img src={url} alt="" />
                        <button type="button" onClick={() => removeGalleryImage(url)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
                {provider && galleryCount < UPLOAD_LIMITS.gallery.maxCount && (
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleGalleryUpload}
                    disabled={uploadingGallery}
                  />
                )}
                {!provider && <small>Save your profile first to upload gallery photos</small>}
                {uploadingGallery && <small>Compressing and uploading photo…</small>}
                <small>Images are compressed automatically to stay within free storage limits.</small>
              </div>

              {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}

              <Input
                label="Business Name"
                value={form.business_name}
                onChange={(e) => {
                  setForm({ ...form, business_name: e.target.value })
                  setProfileErrors((prev) => clearFieldError(prev, 'business_name'))
                }}
                error={profileErrors.business_name}
              />
              <Textarea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value })
                  setProfileErrors((prev) => clearFieldError(prev, 'description'))
                }}
                error={profileErrors.description}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => {
                  setForm({ ...form, location: e.target.value })
                  setProfileErrors((prev) => clearFieldError(prev, 'location'))
                }}
                error={profileErrors.location}
              />
              <Input
                label="Contact Email"
                type="email"
                value={form.contact_email}
                onChange={(e) => {
                  setForm({ ...form, contact_email: e.target.value })
                  setProfileErrors((prev) => clearFieldError(prev, 'contact_email'))
                }}
                error={profileErrors.contact_email}
              />
              <Input
                label="Contact Phone"
                type="tel"
                value={form.contact_phone}
                onChange={(e) => {
                  setForm({ ...form, contact_phone: e.target.value })
                  setProfileErrors((prev) => clearFieldError(prev, 'contact_phone'))
                }}
                error={profileErrors.contact_phone}
              />
              {saveError && tab === 'profile' && <p className="upload-error" role="alert">{saveError}</p>}
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : provider ? 'Update Profile' : 'Submit for Approval'}
              </Button>
              {statusLabel === 'pending' && (
                <p className="dashboard-note">Your profile is pending admin approval.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div className="dashboard-form">
            {provider?.provider_services?.map((s: ProviderService) => (
              <div key={s.id} className="service-row">
                <strong>{s.title}</strong>
                {s.categories && <span className="service-tag">{s.categories.name}</span>}
              </div>
            ))}
            {provider && (
              <>
                <h3>Add Service</h3>
                <Input
                  label="Service Title"
                  value={newService.title}
                  onChange={(e) => {
                    setNewService({ ...newService, title: e.target.value })
                    setServiceErrors((prev) => clearFieldError(prev, 'title'))
                  }}
                  error={serviceErrors.title}
                />
                <div className="input-group">
                  <label htmlFor="service-category">Category</label>
                  <select
                    id="service-category"
                    value={newService.category_id}
                    onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Textarea
                  label="Description (optional)"
                  rows={2}
                  value={newService.description}
                  onChange={(e) => {
                    setNewService({ ...newService, description: e.target.value })
                    setServiceErrors((prev) => clearFieldError(prev, 'description'))
                  }}
                  error={serviceErrors.description}
                />
                {saveError && tab === 'services' && <p className="upload-error" role="alert">{saveError}</p>}
                <Button onClick={addService}>Add Service</Button>
              </>
            )}
            {!provider && <p className="dashboard-empty">Create your profile first.</p>}
          </div>
        )}

        {tab === 'inbox' && (
          <div className="enquiry-list">
            {enquiries.length > 0 ? enquiries.map((e) => (
              <div key={e.id} className="enquiry-detail">
                <div className="enquiry-detail__header">
                  <strong>{e.subject}</strong>
                  <span className={`status-badge status-badge--${e.status}`}>{e.status}</span>
                </div>
                <p className="enquiry-detail__from">
                  From: {(e.profiles as { full_name: string; email: string })?.full_name} ({(e.profiles as { email: string })?.email})
                </p>
                <p className="enquiry-detail__msg">{e.message}</p>
                {e.status === 'new' && (
                  <div className="enquiry-actions">
                    <Button size="sm" onClick={() => updateEnquiryStatus(e.id, 'read')}>Mark Read</Button>
                    <Button size="sm" variant="secondary" onClick={() => updateEnquiryStatus(e.id, 'replied')}>Mark Replied</Button>
                  </div>
                )}
              </div>
            )) : (
              <p className="dashboard-empty">No enquiries yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
