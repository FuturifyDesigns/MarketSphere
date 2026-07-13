import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { BriefcaseBusiness, ImagePlus, Inbox, Settings, Store, Image } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { assertImageFile, urlToImageFile } from '../../lib/imageCrop'
import { supabase, removeStorageFile, storagePathFromPublicUrl, uploadPreparedFile } from '../../lib/supabase'
import { prepareCoverImage, prepareGalleryImage, prepareLogoImage, UPLOAD_LIMITS } from '../../lib/imageUpload'
import { syncProviderPrimaryCategory } from '../../lib/providerCategory'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { RoleOnboarding } from '../../components/onboarding/RoleOnboarding'
import { Button } from '../../components/ui/Button'
import { ImageCropModal } from '../../components/ui/ImageCropModal'
import { MediaEditActions } from '../../components/ui/MediaEditActions'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePhone,
  validateBusinessName,
  validateDescription,
  validateLocation,
  validateOptionalEmail,
  validatePhone,
  validateServiceDescription,
  validateServiceTitle,
  formatStatusLabel,
  type FieldErrors,
} from '../../lib/validation'
import type { Category, Enquiry, Provider, ProviderService } from '../../lib/types'
import './Dashboard.css'

type ProfileFields = 'business_name' | 'description' | 'location' | 'contact_email' | 'contact_phone'
type ServiceFields = 'title' | 'description'
type ProviderTab = 'profile' | 'inbox' | 'services'

export function ProviderDashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const location = useLocation()
  const { showToast } = useToast()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState<ProviderTab>('profile')
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
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileFields>>({})
  const [serviceErrors, setServiceErrors] = useState<FieldErrors<ServiceFields>>({})
  const [saveError, setSaveError] = useState('')
  const [logoCropFile, setLogoCropFile] = useState<File | null>(null)
  const [logoCropOpen, setLogoCropOpen] = useState(false)
  const [coverCropFile, setCoverCropFile] = useState<File | null>(null)
  const [coverCropOpen, setCoverCropOpen] = useState(false)
  const [galleryCropFile, setGalleryCropFile] = useState<File | null>(null)
  const [galleryCropOpen, setGalleryCropOpen] = useState(false)
  const [galleryEditingUrl, setGalleryEditingUrl] = useState<string | null>(null)
  const [loadingMediaEditor, setLoadingMediaEditor] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []))

    supabase
      .from('providers')
      .select('*, provider_services(*, categories(*))')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data) {
          let providerData = data
          if (data.status === 'pending') {
            const { data: approved } = await supabase
              .from('providers')
              .update({ status: 'approved', updated_at: new Date().toISOString() })
              .eq('id', data.id)
              .select('*, provider_services(*, categories(*))')
              .single()
            if (approved) providerData = approved
          }
          setProvider(providerData)
          setForm({
            business_name: providerData.business_name || '',
            description: providerData.description || '',
            location: providerData.location || '',
            contact_email: providerData.contact_email || '',
            contact_phone: providerData.contact_phone || '',
          })
        }
      })
  }, [user])

  useEffect(() => {
    const nextTab = (location.state as { tab?: ProviderTab } | null)?.tab
    if (nextTab) setTab(nextTab)
  }, [location.state])

  useEffect(() => {
    if (!provider) return

    const loadEnquiries = () => {
      void supabase
        .from('enquiries')
        .select('*, profiles(full_name, email)')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setEnquiries(data || []))
    }

    loadEnquiries()

    const channel = supabase
      .channel(`provider-enquiries-${provider.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enquiries', filter: `provider_id=eq.${provider.id}` },
        () => {
          loadEnquiries()
          showToast('New enquiry received.', 'info')
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'enquiries', filter: `provider_id=eq.${provider.id}` },
        () => loadEnquiries(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [provider, showToast])

  const reloadProvider = async (providerId: string) => {
    const { data } = await supabase
      .from('providers')
      .select('*, provider_services(*, categories(*))')
      .eq('id', providerId)
      .single()
    if (data) setProvider(data)
    return data
  }

  const applyAutoCategory = async (
    providerId: string,
    businessName: string,
    description: string,
    notify = true,
  ) => {
    if (!categories.length || !businessName.trim() || description.trim().length < 10) return null
    const matched = await syncProviderPrimaryCategory(providerId, businessName, description, categories)
    if (!matched) return null
    await reloadProvider(providerId)
    if (notify) showToast(`Auto-categorized under ${matched.name}.`, 'info')
    return matched
  }

  useEffect(() => {
    if (!provider || categories.length === 0) return
    const hasCategory = provider.provider_services?.some((service) => service.category_id)
    if (hasCategory) return
    void applyAutoCategory(
      provider.id,
      provider.business_name || form.business_name,
      provider.description || form.description,
      false,
    )
  }, [provider?.id, categories.length])

  const ensureProvider = async (): Promise<Provider | null> => {
    if (provider) return provider
    if (!user) return null

    const businessName =
      form.business_name.trim() ||
      profile?.full_name?.trim() ||
      'My Business'

    const payload = {
      user_id: user.id,
      business_name: businessName,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      status: 'approved' as const,
    }

    const { data, error } = await supabase
      .from('providers')
      .insert(payload)
      .select()
      .single()

    if (error) {
      const { data: existing } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        setProvider(existing)
        return existing
      }

      setUploadError('Could not prepare your listing for upload. Please try again.')
      return null
    }

    setProvider(data)
    setForm((prev) => ({
      business_name: prev.business_name.trim() ? prev.business_name : data.business_name,
      description: prev.description || data.description || '',
      location: prev.location || data.location || '',
      contact_email: prev.contact_email || data.contact_email || '',
      contact_phone: prev.contact_phone || data.contact_phone || '',
    }))
    refreshProfile()
    await applyAutoCategory(data.id, businessName, form.description.trim(), false)
    return data
  }

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
    let providerId = provider?.id
    let failed = false
    const wasUpdate = Boolean(provider)

    if (provider) {
      const { error } = await supabase
        .from('providers')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', provider.id)
      if (error) {
        failed = true
        setSaveError('Could not update profile. Please try again.')
        showToast('Could not update profile. Please try again.', 'error')
      }
    } else {
      const { data, error } = await supabase
        .from('providers')
        .insert({ ...payload, user_id: user.id, status: 'approved' })
        .select()
        .single()
      if (error) {
        failed = true
        setSaveError('Could not submit profile. Please try again.')
        showToast('Could not save profile. Please try again.', 'error')
      } else if (data) {
        setProvider(data)
        providerId = data.id
      }
    }

    setSaving(false)
    refreshProfile()

    if (failed || !providerId) return

    const matched = await applyAutoCategory(providerId, payload.business_name, payload.description, false)
    if (matched) {
      showToast(`Profile saved. Listed under ${matched.name}.`)
      return
    }

    showToast(
      wasUpdate
        ? 'Profile updated successfully.'
        : 'Profile saved successfully. Your listing is now live.',
    )
  }

  const handleLogoPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      assertImageFile(file)
      setUploadError('')
      setLogoCropFile(file)
      setLogoCropOpen(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not open logo image')
    }
  }

  const handleLogoCroppedUpload = async (croppedFile: File) => {
    setUploadingLogo(true)
    setUploadError('')

    try {
      const activeProvider = await ensureProvider()
      if (!activeProvider) return

      const prepared = await prepareLogoImage(croppedFile)
      const url = await uploadPreparedFile('provider-logos', `${activeProvider.id}/logo`, prepared)
      if (!url) throw new Error('Logo upload failed')

      await supabase.from('providers').update({ logo_url: url }).eq('id', activeProvider.id)
      setProvider({ ...activeProvider, logo_url: url })
      showToast('Business logo updated.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Logo upload failed')
      showToast(err instanceof Error ? err.message : 'Logo upload failed', 'error')
    } finally {
      setUploadingLogo(false)
      setLogoCropFile(null)
    }
  }

  const openLogoEditor = async () => {
    if (!provider?.logo_url) {
      logoInputRef.current?.click()
      return
    }

    setLoadingMediaEditor(true)
    setUploadError('')
    try {
      const file = await urlToImageFile(provider.logo_url, 'logo.jpg')
      setLogoCropFile(file)
      setLogoCropOpen(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not open logo for editing')
    } finally {
      setLoadingMediaEditor(false)
    }
  }

  const removeLogo = async () => {
    if (!provider?.logo_url) return
    if (!window.confirm('Remove your business logo?')) return

    setUploadingLogo(true)
    setUploadError('')

    try {
      const path = storagePathFromPublicUrl('provider-logos', provider.logo_url)
      if (path) await removeStorageFile('provider-logos', path)

      await supabase.from('providers').update({ logo_url: null }).eq('id', provider.id)
      setProvider({ ...provider, logo_url: null })
      showToast('Business logo removed.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not remove logo')
      showToast(err instanceof Error ? err.message : 'Could not remove logo', 'error')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      assertImageFile(file)
      setUploadError('')
      setCoverCropFile(file)
      setCoverCropOpen(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not open cover image')
    }
  }

  const openCoverEditor = async () => {
    if (!provider?.cover_url) {
      coverInputRef.current?.click()
      return
    }

    setLoadingMediaEditor(true)
    setUploadError('')
    try {
      const file = await urlToImageFile(provider.cover_url, 'cover.jpg')
      setCoverCropFile(file)
      setCoverCropOpen(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not open cover for editing')
    } finally {
      setLoadingMediaEditor(false)
    }
  }

  const handleCoverCroppedUpload = async (croppedFile: File) => {
    setUploadingCover(true)
    setUploadError('')

    try {
      const activeProvider = await ensureProvider()
      if (!activeProvider) return

      const prepared = await prepareCoverImage(croppedFile)
      const url = await uploadPreparedFile('provider-gallery', `${activeProvider.id}/cover`, prepared)
      if (!url) throw new Error('Cover upload failed')

      if (activeProvider.cover_url) {
        const oldPath = storagePathFromPublicUrl('provider-gallery', activeProvider.cover_url)
        if (oldPath) await removeStorageFile('provider-gallery', oldPath)
      }

      await supabase.from('providers').update({ cover_url: url }).eq('id', activeProvider.id)
      setProvider({ ...activeProvider, cover_url: url })
      showToast('Profile cover image updated.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Cover upload failed')
      showToast(err instanceof Error ? err.message : 'Cover upload failed', 'error')
    } finally {
      setUploadingCover(false)
      setCoverCropFile(null)
    }
  }

  const removeCover = async () => {
    if (!provider?.cover_url) return
    if (!window.confirm('Remove your profile cover image?')) return

    setUploadingCover(true)
    setUploadError('')

    try {
      const path = storagePathFromPublicUrl('provider-gallery', provider.cover_url)
      if (path) await removeStorageFile('provider-gallery', path)

      await supabase.from('providers').update({ cover_url: null }).eq('id', provider.id)
      setProvider({ ...provider, cover_url: null })
      showToast('Profile cover image removed.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not remove cover image')
      showToast(err instanceof Error ? err.message : 'Could not remove cover image', 'error')
    } finally {
      setUploadingCover(false)
    }
  }

  const openGalleryEditor = async (url: string) => {
    setLoadingMediaEditor(true)
    setUploadError('')
    try {
      const file = await urlToImageFile(url, 'gallery.jpg')
      setGalleryEditingUrl(url)
      setGalleryCropFile(file)
      setGalleryCropOpen(true)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not open photo for editing')
    } finally {
      setLoadingMediaEditor(false)
    }
  }

  const handleGalleryCroppedUpload = async (croppedFile: File) => {
    if (!galleryEditingUrl) return

    setUploadingGallery(true)
    setUploadError('')

    try {
      const activeProvider = await ensureProvider()
      if (!activeProvider) return

      const prepared = await prepareGalleryImage(croppedFile)
      const path = `${activeProvider.id}/${prepared.name}`
      const newUrl = await uploadPreparedFile('provider-gallery', path, prepared)
      if (!newUrl) throw new Error('Gallery upload failed')

      const gallery_urls = (activeProvider.gallery_urls || []).map((item) =>
        item === galleryEditingUrl ? newUrl : item,
      )
      await supabase.from('providers').update({ gallery_urls }).eq('id', activeProvider.id)

      const oldPath = storagePathFromPublicUrl('provider-gallery', galleryEditingUrl)
      if (oldPath) await removeStorageFile('provider-gallery', oldPath)

      setProvider({ ...activeProvider, gallery_urls })
      showToast('Gallery photo updated.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not save gallery photo')
      showToast(err instanceof Error ? err.message : 'Could not save gallery photo', 'error')
    } finally {
      setUploadingGallery(false)
      setGalleryCropFile(null)
      setGalleryEditingUrl(null)
    }
  }

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setUploadError('')
    setUploadingGallery(true)
    setGalleryUploadProgress(null)

    try {
      let activeProvider = await ensureProvider()
      if (!activeProvider) return

      const slotsLeft = UPLOAD_LIMITS.gallery.maxCount - (activeProvider.gallery_urls?.length || 0)
      if (slotsLeft <= 0) {
        setUploadError(`Gallery limit is ${UPLOAD_LIMITS.gallery.maxCount} images.`)
        return
      }

      const filesToUpload = files.slice(0, slotsLeft)
      if (files.length > slotsLeft) {
        setUploadError(
          `Only ${slotsLeft} more photo${slotsLeft === 1 ? '' : 's'} fit in your gallery. Extra files were skipped.`,
        )
      }

      setGalleryUploadProgress({ done: 0, total: filesToUpload.length })

      let uploadedCount = 0
      for (let index = 0; index < filesToUpload.length; index++) {
        const file = filesToUpload[index]

        try {
          assertImageFile(file)
          const prepared = await prepareGalleryImage(file)
          const path = `${activeProvider.id}/${prepared.name}`
          const url = await uploadPreparedFile('provider-gallery', path, prepared)
          if (!url) throw new Error('Gallery upload failed')

          const gallery_urls: string[] = [...(activeProvider.gallery_urls || []), url]
          await supabase.from('providers').update({ gallery_urls }).eq('id', activeProvider.id)
          activeProvider = { ...activeProvider, gallery_urls }
          setProvider(activeProvider)
          setGalleryUploadProgress({ done: index + 1, total: filesToUpload.length })
          uploadedCount += 1
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : `Could not upload ${file.name}`)
          showToast(err instanceof Error ? err.message : `Could not upload ${file.name}`, 'error')
          break
        }
      }

      if (uploadedCount > 0) {
        showToast(
          uploadedCount === 1
            ? 'Gallery photo uploaded.'
            : `${uploadedCount} gallery photos uploaded.`,
        )
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Gallery upload failed')
    } finally {
      setUploadingGallery(false)
      setGalleryUploadProgress(null)
    }
  }

  const removeGalleryImage = async (url: string) => {
    if (!provider) return
    if (!window.confirm('Remove this gallery photo?')) return

    const path = storagePathFromPublicUrl('provider-gallery', url)
    if (path) await removeStorageFile('provider-gallery', path)

    const gallery_urls = (provider.gallery_urls || []).filter((item) => item !== url)
    await supabase.from('providers').update({ gallery_urls }).eq('id', provider.id)
    setProvider({ ...provider, gallery_urls })
    showToast('Gallery photo removed.')
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
      showToast('Could not add service. Please try again.', 'error')
      return
    }
    if (data) {
      setProvider({
        ...provider,
        provider_services: [...(provider.provider_services || []), data],
      })
      setNewService({ title: '', description: '', category_id: '' })
      setServiceErrors({})
      showToast('Service added successfully.')
    }
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from('enquiries').update({ status }).eq('id', id)
    setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status: status as Enquiry['status'] } : e)))
    showToast(
      status === 'read' ? 'Enquiry marked as read.' : status === 'replied' ? 'Enquiry marked as replied.' : 'Enquiry updated.',
    )
  }

  const statusKey = provider?.status || 'not_created'
  const statusLabel = formatStatusLabel(statusKey)
  const galleryCount = provider?.gallery_urls?.length || 0
  const newEnquiryCount = enquiries.filter((e) => e.status === 'new').length
  const serviceCount = provider?.provider_services?.length || 0
  const displayName = provider?.business_name?.trim() || form.business_name.trim() || 'your business'

  return (
    <div className="dashboard provider-dashboard">
      <RoleOnboarding role="provider" />
      <div className="container">
        <header className="provider-dashboard__hero">
          <div>
            <span className="provider-dashboard__eyebrow">Provider dashboard</span>
            <h1>Manage {displayName}</h1>
            <p>Update your listing, respond to enquiries, and grow your services on Market Sphere Group.</p>
          </div>
          <div className="provider-dashboard__stats">
            <div className="provider-dashboard__stat">
              <BriefcaseBusiness size={18} />
              <strong>{serviceCount}</strong>
              <span>Services</span>
            </div>
            <div className="provider-dashboard__stat">
              <Inbox size={18} />
              <strong>{newEnquiryCount}</strong>
              <span>New</span>
            </div>
            <div className="provider-dashboard__stat">
              <Store size={18} />
              <strong className="provider-dashboard__stat-status">{statusLabel}</strong>
              <span>Status</span>
            </div>
          </div>
        </header>

        <div className="provider-dashboard__tabs" role="tablist" aria-label="Provider sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'profile'}
            className={tab === 'profile' ? 'provider-dashboard__tab--active' : ''}
            onClick={() => setTab('profile')}
          >
            <Settings size={16} /> Profile
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'services'}
            className={tab === 'services' ? 'provider-dashboard__tab--active' : ''}
            onClick={() => setTab('services')}
          >
            <BriefcaseBusiness size={16} /> Services
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'inbox'}
            className={tab === 'inbox' ? 'provider-dashboard__tab--active' : ''}
            onClick={() => setTab('inbox')}
          >
            <Inbox size={16} /> Inbox {newEnquiryCount > 0 ? `(${newEnquiryCount})` : ''}
          </button>
        </div>

        {tab === 'profile' && (
          <div className="provider-dashboard__profile-layout">
            <AccountProfileCard />

            <div className="provider-dashboard__panels">
              <section className="dashboard-panel provider-branding-panel">
                <div className="dashboard-panel__header">
                  <h2><ImagePlus size={20} /> Branding</h2>
                </div>

                <div className="provider-branding-panel__cover">
                  {provider?.cover_url ? (
                    <button
                      type="button"
                      className="provider-branding-panel__cover-btn"
                      onClick={() => void openCoverEditor()}
                      disabled={uploadingCover || loadingMediaEditor}
                      aria-label="Edit profile cover image"
                    >
                      <img src={provider.cover_url} alt="" className="provider-branding-panel__cover-img" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="provider-branding-panel__cover-placeholder"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                    >
                      <Image size={28} strokeWidth={1.75} />
                      <span>Add cover image</span>
                    </button>
                  )}
                  <div>
                    <p className="provider-branding-panel__title">Profile cover</p>
                    <p className="provider-branding-panel__hint">
                      Wide banner for your public profile · up to {UPLOAD_LIMITS.cover.maxWidth}×{UPLOAD_LIMITS.cover.maxHeight} px
                    </p>
                    <div className="provider-branding-panel__action-row">
                      <button
                        type="button"
                        className="provider-branding-panel__upload-btn"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                      >
                        {uploadingCover ? 'Uploading…' : provider?.cover_url ? 'Change cover' : 'Upload cover'}
                      </button>
                      {provider?.cover_url ? (
                        <MediaEditActions
                          onEdit={() => void openCoverEditor()}
                          onDelete={() => void removeCover()}
                          disabled={uploadingCover || loadingMediaEditor}
                        />
                      ) : null}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => void handleCoverPick(e)}
                      hidden
                    />
                  </div>
                </div>

                <div className="provider-branding-panel__logo">
                  {provider?.logo_url ? (
                    <button
                      type="button"
                      className="provider-branding-panel__logo-btn"
                      onClick={() => void openLogoEditor()}
                      disabled={uploadingLogo || loadingMediaEditor}
                      aria-label="Edit business logo"
                    >
                      <img src={provider.logo_url} alt="" className="provider-branding-panel__logo-img" />
                    </button>
                  ) : (
                    <div className="provider-branding-panel__logo-placeholder">Logo</div>
                  )}
                  <div>
                    <p className="provider-branding-panel__title">Business logo</p>
                    <p className="provider-branding-panel__hint">
                      Saved at up to {UPLOAD_LIMITS.logo.maxWidth}×{UPLOAD_LIMITS.logo.maxHeight} px
                    </p>
                    <div className="provider-branding-panel__action-row">
                      <button
                        type="button"
                        className="provider-branding-panel__upload-btn"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo || loadingMediaEditor}
                      >
                        {uploadingLogo ? 'Uploading…' : loadingMediaEditor ? 'Opening…' : 'Upload logo'}
                      </button>
                      {provider?.logo_url ? (
                        <MediaEditActions
                          onEdit={() => void openLogoEditor()}
                          onDelete={() => void removeLogo()}
                          disabled={uploadingLogo || loadingMediaEditor}
                        />
                      ) : null}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoPick}
                      hidden
                    />
                  </div>
                </div>

                <div className="provider-branding-panel__gallery">
                  <div className="dashboard-panel__header dashboard-panel__header--compact">
                    <h3>Gallery ({galleryCount}/{UPLOAD_LIMITS.gallery.maxCount})</h3>
                    <small>Up to {UPLOAD_LIMITS.gallery.maxWidth}px wide per image</small>
                  </div>
                  {galleryCount > 0 && (
                    <div className="gallery-grid">
                      {(provider?.gallery_urls || []).map((url) => (
                        <div key={url} className="gallery-item">
                          <button
                            type="button"
                            className="gallery-item__image-btn"
                            onClick={() => void openGalleryEditor(url)}
                            disabled={uploadingGallery || loadingMediaEditor}
                            aria-label="Edit gallery photo"
                          >
                            <img src={url} alt="" />
                          </button>
                          <MediaEditActions
                            compact
                            onEdit={() => void openGalleryEditor(url)}
                            onDelete={() => void removeGalleryImage(url)}
                            disabled={uploadingGallery || loadingMediaEditor}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {galleryCount < UPLOAD_LIMITS.gallery.maxCount && (
                    <label className="provider-branding-panel__gallery-upload">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleGalleryUpload}
                        disabled={uploadingGallery}
                      />
                      {uploadingGallery && galleryUploadProgress
                        ? `Uploading ${galleryUploadProgress.done}/${galleryUploadProgress.total}…`
                        : uploadingGallery
                          ? 'Uploading photos…'
                          : 'Add gallery photos'}
                    </label>
                  )}
                </div>

                {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
              </section>

              <section className="dashboard-panel">
                <div className="dashboard-panel__header">
                  <h2><Store size={20} /> Business details</h2>
                </div>

                <div className="dashboard-form dashboard-form--flush">
                  <Input
                    label="Business Name"
                    value={form.business_name}
                    onChange={(e) => {
                      setForm({ ...form, business_name: e.target.value })
                      setProfileErrors((prev) => clearFieldError(prev, 'business_name'))
                    }}
                    hint={FIELD_HINTS.businessName}
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
                    hint={FIELD_HINTS.description}
                    error={profileErrors.description}
                  />
                  <Input
                    label="Location"
                    value={form.location}
                    onChange={(e) => {
                      setForm({ ...form, location: e.target.value })
                      setProfileErrors((prev) => clearFieldError(prev, 'location'))
                    }}
                    hint={FIELD_HINTS.location}
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
                    hint={FIELD_HINTS.contactEmail}
                    error={profileErrors.contact_email}
                  />
                  <Input
                    label="Contact Phone"
                    type="tel"
                    inputMode="tel"
                    value={form.contact_phone}
                    onChange={(e) => {
                      setForm({ ...form, contact_phone: sanitizePhone(e.target.value) })
                      setProfileErrors((prev) => clearFieldError(prev, 'contact_phone'))
                    }}
                    hint={FIELD_HINTS.contactPhone}
                    error={profileErrors.contact_phone}
                  />
                  {saveError && tab === 'profile' && <p className="upload-error" role="alert">{saveError}</p>}
                  <Button onClick={() => void saveProfile()} disabled={saving}>
                    {saving ? 'Saving...' : provider ? 'Update Profile' : 'Save Profile'}
                  </Button>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'services' && (
          <section className="dashboard-panel">
            <div className="dashboard-panel__header">
              <h2><BriefcaseBusiness size={20} /> Your services</h2>
            </div>
            {provider?.provider_services?.length ? (
              <div className="provider-service-list">
                {provider.provider_services.map((s: ProviderService) => (
                  <div key={s.id} className="service-row">
                    <strong>{s.title}</strong>
                    {s.categories && <span className="service-tag">{s.categories.name}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <BriefcaseBusiness size={28} />
                <p>No services listed yet</p>
                <span>Add your first service below so customers can find what you offer.</span>
              </div>
            )}
            {provider ? (
              <div className="dashboard-form dashboard-form--flush provider-service-form">
                <h3>Add service</h3>
                <Input
                  label="Service Title"
                  value={newService.title}
                  onChange={(e) => {
                    setNewService({ ...newService, title: e.target.value })
                    setServiceErrors((prev) => clearFieldError(prev, 'title'))
                  }}
                  hint={FIELD_HINTS.serviceTitle}
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
                  hint={FIELD_HINTS.serviceDescription}
                  error={serviceErrors.description}
                />
                {saveError && tab === 'services' && <p className="upload-error" role="alert">{saveError}</p>}
                <Button onClick={() => void addService()}>Add Service</Button>
              </div>
            ) : (
              <p className="dashboard-empty">Create your profile first.</p>
            )}
          </section>
        )}

        {tab === 'inbox' && (
          <section className="dashboard-panel">
            <div className="dashboard-panel__header">
              <h2><Inbox size={20} /> Enquiry inbox</h2>
            </div>
            {enquiries.length > 0 ? (
              <div className="enquiry-list">
                {enquiries.map((e) => (
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
                        <Button size="sm" onClick={() => void updateEnquiryStatus(e.id, 'read')}>Mark Read</Button>
                        <Button size="sm" variant="secondary" onClick={() => void updateEnquiryStatus(e.id, 'replied')}>Mark Replied</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <Inbox size={28} />
                <p>No enquiries yet</p>
                <span>When customers contact you, their messages will appear here.</span>
              </div>
            )}
          </section>
        )}
      </div>

      <ImageCropModal
        file={logoCropFile}
        open={logoCropOpen}
        title="Edit business logo"
        outputSize={UPLOAD_LIMITS.logo.maxWidth}
        onClose={() => {
          setLogoCropOpen(false)
          setLogoCropFile(null)
        }}
        onConfirm={(file) => void handleLogoCroppedUpload(file)}
      />
      <ImageCropModal
        file={galleryCropFile}
        open={galleryCropOpen}
        title="Edit gallery photo"
        outputSize={UPLOAD_LIMITS.gallery.maxWidth}
        onClose={() => {
          setGalleryCropOpen(false)
          setGalleryCropFile(null)
          setGalleryEditingUrl(null)
        }}
        onConfirm={(file) => void handleGalleryCroppedUpload(file)}
      />
      <ImageCropModal
        file={coverCropFile}
        open={coverCropOpen}
        title="Edit profile cover"
        aspectRatio={16 / 9}
        outputWidth={UPLOAD_LIMITS.cover.maxWidth}
        outputHeight={UPLOAD_LIMITS.cover.maxHeight}
        onClose={() => {
          setCoverCropOpen(false)
          setCoverCropFile(null)
        }}
        onConfirm={(file) => void handleCoverCroppedUpload(file)}
      />
    </div>
  )
}
