import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Crop,
  Eye,
  EyeOff,
  FolderOpen,
  ImagePlus,
  LocateFixed,
  Megaphone,
  Pencil,
  Search,
  Store,
  Trash2,
  Upload,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { resolveCurrentLocationLabel } from '../../lib/geolocation'
import { assertImageFile, urlToImageFile } from '../../lib/imageCrop'
import { UPLOAD_LIMITS } from '../../lib/imageUpload'
import {
  SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS,
  SHOWCASE_AVAILABILITY_STATUS_LABELS,
  SHOWCASE_DEAL_LABELS,
  resolveShowcaseAvailabilityStatus,
  normalizeShowcaseUrl,
  showcaseAvailabilityLabel,
  showcaseAvailabilityOptions,
} from '../../lib/showcase'
import { uploadShowcaseImage } from '../../lib/showcaseUpload'
import { supabase } from '../../lib/supabase'
import type {
  ShowcaseAnnouncement,
  ShowcaseAnnouncementCategory,
  ShowcaseAvailabilityStatus,
  ShowcaseColumn,
  ShowcaseDealType,
  ShowcaseListing,
  ShowcaseListingStatus,
} from '../../lib/types'
import {
  FIELD_HINTS,
  type FieldErrors,
  validateCategoryName,
  validateDescription,
  validateListingSummary,
  validateListingTitle,
  validateName,
  validateOptionalEmail,
  validatePhone,
  validatePriceLabel,
  validateRequiredLocation,
} from '../../lib/validation'
import { Button } from '../ui/Button'
import { ImageCropModal } from '../ui/ImageCropModal'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

const DEAL_TYPES = Object.keys(SHOWCASE_DEAL_LABELS) as ShowcaseDealType[]
const STATUSES: ShowcaseListingStatus[] = ['draft', 'published', 'archived']
const ANNOUNCEMENT_CATEGORIES: ShowcaseAnnouncementCategory[] = [
  'job',
  'advertisement',
  'event',
  'notice',
  'general',
]
const MAX_IMAGES = UPLOAD_LIMITS.showcase.maxCount
const LIST_PAGE_SIZE = 8
const ANNOUNCEMENT_PAGE_SIZE = 6

type ShowcaseSubTab = 'listings' | 'announcements' | 'columns'

type ListingForm = {
  column_id: string
  title: string
  summary: string
  description: string
  location: string
  price_label: string
  deal_type: ShowcaseDealType
  status: ShowcaseListingStatus
  availability_status: ShowcaseAvailabilityStatus
  featured: boolean
  sort_order: number
  owner_name: string
  owner_phone: string
  owner_email: string
  image_urls: string[]
}

type ListingField =
  | 'column_id'
  | 'title'
  | 'summary'
  | 'description'
  | 'location'
  | 'price_label'
  | 'images'
  | 'owner_name'
  | 'owner_phone'
  | 'owner_email'

type AnnouncementForm = {
  column_id: string
  title: string
  body: string
  category: ShowcaseAnnouncementCategory
  badge: string
  image_url: string
  link_url: string
  link_label: string
  contact_phone: string
  contact_email: string
  expires_at: string
  pinned: boolean
  active: boolean
  sort_order: number
}

type AnnouncementField =
  | 'title'
  | 'body'
  | 'contact_phone'
  | 'contact_email'
  | 'link_url'

const emptyForm = (columnId = ''): ListingForm => ({
  column_id: columnId,
  title: '',
  summary: '',
  description: '',
  location: '',
  price_label: '',
  deal_type: 'sale',
  status: 'published',
  availability_status: 'available',
  featured: false,
  sort_order: 0,
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  image_urls: [],
})

const emptyAnnouncementForm = (columnId = ''): AnnouncementForm => ({
  column_id: columnId,
  title: '',
  body: '',
  category: 'job',
  badge: '',
  image_url: '',
  link_url: '',
  link_label: '',
  contact_phone: '',
  contact_email: '',
  expires_at: '',
  pinned: false,
  active: true,
  sort_order: 0,
})

function validateListingForm(form: ListingForm): FieldErrors<ListingField> {
  const next: FieldErrors<ListingField> = {}
  if (!form.column_id) next.column_id = 'Choose a showcase column.'
  const title = validateListingTitle(form.title)
  if (title) next.title = title
  const location = validateRequiredLocation(form.location)
  if (location) next.location = location
  const price = validatePriceLabel(form.price_label)
  if (price) next.price_label = price
  const summary = validateListingSummary(form.summary)
  if (summary) next.summary = summary
  const description = validateDescription(form.description, false, 20)
  if (description) next.description = description
  if (form.owner_name.trim()) {
    const ownerName = validateName(form.owner_name.trim(), 'Owner name')
    if (ownerName) next.owner_name = ownerName
  }
  const ownerPhone = validatePhone(form.owner_phone, true)
  if (ownerPhone) next.owner_phone = ownerPhone
  const ownerEmail = validateOptionalEmail(form.owner_email)
  if (ownerEmail) next.owner_email = ownerEmail
  return next
}

function validateAnnouncementForm(form: AnnouncementForm): FieldErrors<AnnouncementField> {
  const next: FieldErrors<AnnouncementField> = {}
  if (!form.title.trim()) {
    next.title = 'Title is required.'
  } else if (form.title.trim().length < 3) {
    next.title = 'Title must be at least 3 characters.'
  }
  if (!form.body.trim()) {
    next.body = 'Body / details are required.'
  } else if (form.body.trim().length < 8) {
    next.body = 'Details must be at least 8 characters.'
  }
  const ownerPhone = validatePhone(form.contact_phone, true)
  if (ownerPhone) next.contact_phone = ownerPhone
  const ownerEmail = validateOptionalEmail(form.contact_email)
  if (ownerEmail) next.contact_email = ownerEmail
  if (form.link_url.trim()) {
    try {
      new URL(form.link_url.trim().startsWith('http') ? form.link_url.trim() : `https://${form.link_url.trim()}`)
    } catch {
      next.link_url = 'Enter a valid URL.'
    }
  }
  return next
}

export function ShowcaseAdminPanel() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [subTab, setSubTab] = useState<ShowcaseSubTab>('listings')
  const [columns, setColumns] = useState<ShowcaseColumn[]>([])
  const [listings, setListings] = useState<ShowcaseListing[]>([])
  const [announcements, setAnnouncements] = useState<ShowcaseAnnouncement[]>([])

  // Listings filtering & editing state
  const [filterColumn, setFilterColumn] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | ShowcaseListingStatus>('all')
  const [listSearch, setListSearch] = useState('')
  const [listPage, setListPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListingForm>(emptyForm())
  const [errors, setErrors] = useState<FieldErrors<ListingField>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [locating, setLocating] = useState(false)

  // Announcements filtering & editing state
  const [annFilterColumn, setAnnFilterColumn] = useState('')
  const [annFilterCategory, setAnnFilterCategory] = useState<string>('all')
  const [annFilterStatus, setAnnFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [annSearch, setAnnSearch] = useState('')
  const [annPage, setAnnPage] = useState(1)
  const [annEditingId, setAnnEditingId] = useState<string | null>(null)
  const [annForm, setAnnForm] = useState<AnnouncementForm>(emptyAnnouncementForm())
  const [annErrors, setAnnErrors] = useState<FieldErrors<AnnouncementField>>({})
  const [annSaving, setAnnSaving] = useState(false)
  const [annUploading, setAnnUploading] = useState(false)

  // Photo Crop Modal state
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropTarget, setCropTarget] = useState<'listing' | 'announcement'>('listing')
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null)
  const [loadingCrop, setLoadingCrop] = useState(false)

  // Columns editing state
  const [columnDrafts, setColumnDrafts] = useState<Record<string, Partial<ShowcaseColumn>>>({})
  const [savingColumnId, setSavingColumnId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const annFileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [colsRes, listRes, annRes] = await Promise.all([
      supabase.from('showcase_columns').select('*').order('sort_order'),
      supabase
        .from('showcase_listings')
        .select('*, showcase_columns(id, slug, title, icon)')
        .order('updated_at', { ascending: false })
        .limit(300),
      supabase
        .from('showcase_announcements')
        .select('*, showcase_columns(id, slug, title, icon)')
        .order('pinned', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    if (colsRes.error) {
      showToast(colsRes.error.message || 'Could not load showcase columns.', 'error')
    }
    if (listRes.error) {
      showToast(listRes.error.message || 'Could not load showcase listings.', 'error')
    }
    if (annRes.error) {
      showToast(annRes.error.message || 'Could not load showcase announcements.', 'error')
    }

    setColumns(colsRes.data || [])
    setListings(listRes.data || [])
    setAnnouncements((annRes.data || []) as unknown as ShowcaseAnnouncement[])
    setLoading(false)

    setForm((prev) => {
      if (prev.column_id || !(colsRes.data && colsRes.data[0])) return prev
      return { ...prev, column_id: colsRes.data[0].id }
    })
  }, [showToast])

  useEffect(() => {
    void load()

    let timer: number | undefined
    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = undefined
        void load()
      }, 300)
    }

    const channel = supabase
      .channel(`admin-showcase-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_columns' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_listings' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showcase_announcements' }, schedule)
      .subscribe()

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [load])

  // Filter listings
  const filteredListings = useMemo(() => {
    const query = listSearch.trim().toLowerCase()
    return listings.filter((item) => {
      if (filterColumn && item.column_id !== filterColumn) return false
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      if (!query) return true
      const haystack = [
        item.title,
        item.location,
        item.price_label,
        item.owner_name,
        item.owner_phone,
        item.showcase_columns?.title,
        SHOWCASE_DEAL_LABELS[item.deal_type],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [listings, filterColumn, filterStatus, listSearch])

  const listPageCount = Math.max(1, Math.ceil(filteredListings.length / LIST_PAGE_SIZE))
  const safeListPage = Math.min(listPage, listPageCount)
  const pagedListings = useMemo(() => {
    const start = (safeListPage - 1) * LIST_PAGE_SIZE
    return filteredListings.slice(start, start + LIST_PAGE_SIZE)
  }, [filteredListings, safeListPage])

  // Filter announcements
  const filteredAnnouncements = useMemo(() => {
    const query = annSearch.trim().toLowerCase()
    return announcements.filter((item) => {
      if (annFilterColumn === 'global' && item.column_id !== null) return false
      if (annFilterColumn && annFilterColumn !== 'global' && item.column_id !== annFilterColumn) return false
      if (annFilterCategory !== 'all' && item.category !== annFilterCategory) return false
      if (annFilterStatus === 'active' && !item.active) return false
      if (annFilterStatus === 'inactive' && item.active) return false
      if (!query) return true
      const haystack = [
        item.title,
        item.body,
        item.badge,
        item.contact_phone,
        item.contact_email,
        item.showcase_columns?.title,
        SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS[item.category],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [announcements, annFilterColumn, annFilterCategory, annFilterStatus, annSearch])

  const annPageCount = Math.max(1, Math.ceil(filteredAnnouncements.length / ANNOUNCEMENT_PAGE_SIZE))
  const safeAnnPage = Math.min(annPage, annPageCount)
  const pagedAnnouncements = useMemo(() => {
    const start = (safeAnnPage - 1) * ANNOUNCEMENT_PAGE_SIZE
    return filteredAnnouncements.slice(start, start + ANNOUNCEMENT_PAGE_SIZE)
  }, [filteredAnnouncements, safeAnnPage])

  useEffect(() => {
    setListPage(1)
  }, [filterColumn, filterStatus, listSearch])

  useEffect(() => {
    setAnnPage(1)
  }, [annFilterColumn, annFilterCategory, annFilterStatus, annSearch])

  // --- Listing Handlers ---
  const resetForm = (columnId?: string) => {
    setEditingId(null)
    setErrors({})
    setForm(emptyForm(columnId || columns[0]?.id || filterColumn || ''))
  }

  const startEdit = (listing: ShowcaseListing) => {
    setEditingId(listing.id)
    setErrors({})
    setForm({
      column_id: listing.column_id,
      title: listing.title,
      summary: listing.summary || '',
      description: listing.description || '',
      location: listing.location || '',
      price_label: listing.price_label || '',
      deal_type: listing.deal_type,
      status: listing.status,
      availability_status: resolveShowcaseAvailabilityStatus(listing),
      featured: listing.featured,
      sort_order: listing.sort_order,
      owner_name: listing.owner_name || '',
      owner_phone: listing.owner_phone || '',
      owner_email: listing.owner_email || '',
      image_urls: listing.image_urls || [],
    })
  }

  const patchForm = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as ListingField]
        return next
      })
    }
  }

  const openCropForFile = (file: File, target: 'listing' | 'announcement' = 'listing') => {
    try {
      assertImageFile(file)
      setCropTarget(target)
      setEditingImageUrl(null)
      setCropFile(file)
      setCropOpen(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unsupported image.', 'error')
    }
  }

  const handleFilePick = async (files: FileList | null) => {
    if (!files?.length) return
    const remaining = MAX_IMAGES - form.image_urls.length
    if (remaining <= 0) {
      showToast(`You can upload up to ${MAX_IMAGES} photos per listing.`, 'error')
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    if (fileRef.current) fileRef.current.value = ''

    if (selected.length === 1) {
      openCropForFile(selected[0], 'listing')
      return
    }

    setUploading(true)
    const uploaded: string[] = []
    let failed = 0
    try {
      for (const file of selected) {
        try {
          assertImageFile(file)
          uploaded.push(await uploadShowcaseImage(file, editingId || 'draft'))
        } catch {
          failed += 1
        }
      }

      if (uploaded.length) {
        setForm((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, ...uploaded].slice(0, MAX_IMAGES),
        }))
        setErrors((prev) => {
          if (!prev.images) return prev
          const next = { ...prev }
          delete next.images
          return next
        })
        showToast(
          failed
            ? `Added ${uploaded.length} photo${uploaded.length === 1 ? '' : 's'}; ${failed} failed.`
            : `Added ${uploaded.length} photos.`,
        )
      } else {
        showToast('Could not upload the selected photos.', 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleAnnFilePick = (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (annFileRef.current) annFileRef.current.value = ''
    openCropForFile(file, 'announcement')
  }

  const openExistingCrop = async (url: string, target: 'listing' | 'announcement' = 'listing') => {
    setLoadingCrop(true)
    try {
      const file = await urlToImageFile(url, 'showcase.jpg')
      setCropTarget(target)
      setEditingImageUrl(url)
      setCropFile(file)
      setCropOpen(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not open photo for editing.', 'error')
    } finally {
      setLoadingCrop(false)
    }
  }

  const handleCroppedUpload = async (croppedFile: File) => {
    if (cropTarget === 'announcement') {
      setAnnUploading(true)
      try {
        const url = await uploadShowcaseImage(croppedFile, annEditingId || 'announcement-draft')
        setAnnForm((prev) => ({ ...prev, image_url: url }))
        showToast('Announcement flyer/banner attached.')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Banner upload failed.', 'error')
      } finally {
        setAnnUploading(false)
        setCropOpen(false)
        setCropFile(null)
        setEditingImageUrl(null)
      }
      return
    }

    setUploading(true)
    try {
      const url = await uploadShowcaseImage(croppedFile, editingId || 'draft')
      setForm((prev) => {
        if (editingImageUrl) {
          return {
            ...prev,
            image_urls: prev.image_urls.map((item) => (item === editingImageUrl ? url : item)),
          }
        }
        return { ...prev, image_urls: [...prev.image_urls, url].slice(0, MAX_IMAGES) }
      })
      setErrors((prev) => {
        if (!prev.images) return prev
        const next = { ...prev }
        delete next.images
        return next
      })
      showToast(editingImageUrl ? 'Photo updated.' : 'Photo added.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Photo upload failed.', 'error')
    } finally {
      setUploading(false)
      setCropOpen(false)
      setCropFile(null)
      setEditingImageUrl(null)
    }
  }

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, image_urls: prev.image_urls.filter((item) => item !== url) }))
  }

  const handleCurrentLocation = async () => {
    setLocating(true)
    try {
      const label = await resolveCurrentLocationLabel()
      patchForm('location', label)
      showToast('Location filled from your device.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not get your location.', 'error')
    } finally {
      setLocating(false)
    }
  }

  const saveListing = async () => {
    const nextErrors = validateListingForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      showToast('Fix the highlighted fields before saving.', 'error')
      return
    }

    setSaving(true)
    const payload = {
      column_id: form.column_id,
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      price_label: form.price_label.trim() || null,
      deal_type: form.deal_type,
      status: form.status,
      availability_status: form.availability_status,
      available: form.availability_status === 'available',
      featured: form.featured,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      owner_name: form.owner_name.trim() || null,
      owner_phone: form.owner_phone.trim() || null,
      owner_email: form.owner_email.trim() || null,
      image_urls: form.image_urls,
      updated_at: new Date().toISOString(),
      ...(editingId ? {} : { created_by: user?.id || null }),
    }

    const result = editingId
      ? await supabase.from('showcase_listings').update(payload).eq('id', editingId)
      : await supabase.from('showcase_listings').insert(payload)

    setSaving(false)

    if (result.error) {
      showToast(result.error.message || 'Could not save listing.', 'error')
      return
    }

    showToast(editingId ? 'Listing updated.' : 'Listing published to showcase.')
    resetForm(form.column_id)
    void load()
  }

  const setStatus = async (id: string, status: ShowcaseListingStatus) => {
    const { error } = await supabase
      .from('showcase_listings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      showToast(error.message || 'Could not update status.', 'error')
      return
    }
    showToast(`Listing marked ${status}.`)
    void load()
  }

  const setAvailabilityStatus = async (
    listing: ShowcaseListing,
    availability_status: ShowcaseAvailabilityStatus,
  ) => {
    const { error } = await supabase
      .from('showcase_listings')
      .update({
        availability_status,
        available: availability_status === 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing.id)
    if (error) {
      showToast(error.message || 'Could not update availability.', 'error')
      return
    }
    showToast(`Marked ${SHOWCASE_AVAILABILITY_STATUS_LABELS[availability_status].toLowerCase()}.`)
    if (editingId === listing.id) {
      setForm((prev) => ({ ...prev, availability_status }))
    }
    void load()
  }

  const deleteListing = async (id: string) => {
    if (!window.confirm('Delete this showcase listing permanently?')) return
    const { error } = await supabase.from('showcase_listings').delete().eq('id', id)
    if (error) {
      showToast(error.message || 'Could not delete listing.', 'error')
      return
    }
    showToast('Listing deleted.')
    if (editingId === id) resetForm()
    void load()
  }

  // --- Announcement Handlers ---
  const resetAnnouncementForm = (columnId?: string) => {
    setAnnEditingId(null)
    setAnnErrors({})
    setAnnForm(emptyAnnouncementForm(columnId || annFilterColumn || ''))
  }

  const startEditAnnouncement = (item: ShowcaseAnnouncement) => {
    setAnnEditingId(item.id)
    setAnnErrors({})
    setAnnForm({
      column_id: item.column_id || '',
      title: item.title,
      body: item.body,
      category: item.category,
      badge: item.badge || '',
      image_url: item.image_url || '',
      link_url: item.link_url || '',
      link_label: item.link_label || '',
      contact_phone: item.contact_phone || '',
      contact_email: item.contact_email || '',
      expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
      pinned: item.pinned,
      active: item.active,
      sort_order: item.sort_order,
    })
  }

  const patchAnnForm = <K extends keyof AnnouncementForm>(key: K, value: AnnouncementForm[K]) => {
    setAnnForm((prev) => ({ ...prev, [key]: value }))
    if (key in annErrors) {
      setAnnErrors((prev) => {
        const next = { ...prev }
        delete next[key as AnnouncementField]
        return next
      })
    }
  }

  const saveAnnouncement = async () => {
    const nextErrors = validateAnnouncementForm(annForm)
    setAnnErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      showToast('Please fix the highlighted announcement errors.', 'error')
      return
    }

    setAnnSaving(true)
    const rawLink = annForm.link_url.trim()
    const labelAsUrl = normalizeShowcaseUrl(annForm.link_label)
    const normalizedLink = normalizeShowcaseUrl(rawLink) || (!rawLink ? labelAsUrl : null)
    const normalizedLabel = labelAsUrl && !rawLink ? null : annForm.link_label.trim() || null
    const expiresAt = annForm.expires_at
      ? new Date(`${annForm.expires_at}T23:59:59.999`).toISOString()
      : null
    const payload = {
      column_id: annForm.column_id ? annForm.column_id : null,
      title: annForm.title.trim(),
      body: annForm.body.trim(),
      category: annForm.category,
      badge: annForm.badge.trim() || null,
      image_url: annForm.image_url.trim() || null,
      link_url: normalizedLink,
      link_label: normalizedLabel,
      contact_phone: annForm.contact_phone.trim() || null,
      contact_email: annForm.contact_email.trim() || null,
      expires_at: expiresAt,
      pinned: annForm.pinned,
      active: annForm.active,
      sort_order: Number.isFinite(annForm.sort_order) ? annForm.sort_order : 0,
      updated_at: new Date().toISOString(),
      ...(annEditingId ? {} : { created_by: user?.id || null }),
    }

    const result = annEditingId
      ? await supabase.from('showcase_announcements').update(payload).eq('id', annEditingId)
      : await supabase.from('showcase_announcements').insert(payload)

    setAnnSaving(false)

    if (result.error) {
      showToast(result.error.message || 'Could not save announcement.', 'error')
      return
    }

    showToast(
      annEditingId
        ? 'Announcement updated.'
        : 'Announcement featured in showcase.',
    )
    resetAnnouncementForm(annForm.column_id)
    void load()
  }

  const toggleAnnouncementActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('showcase_announcements')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      showToast(error.message || 'Could not update announcement status.', 'error')
      return
    }
    showToast(active ? 'Announcement activated.' : 'Announcement hidden.')
    void load()
  }

  const deleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement permanently?')) return
    const { error } = await supabase.from('showcase_announcements').delete().eq('id', id)
    if (error) {
      showToast(error.message || 'Could not delete announcement.', 'error')
      return
    }
    showToast('Announcement deleted.')
    if (annEditingId === id) resetAnnouncementForm()
    void load()
  }

  // --- Column Settings Handlers ---
  const columnValue = (column: ShowcaseColumn, key: 'title' | 'tagline' | 'description') => {
    const draft = columnDrafts[column.id]
    if (draft && key in draft) return (draft[key] as string | null) ?? ''
    return column[key] ?? ''
  }

  const patchColumnDraft = (id: string, patch: Partial<ShowcaseColumn>) => {
    setColumnDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const saveColumn = async (column: ShowcaseColumn) => {
    const draft = columnDrafts[column.id] || {}
    const titleValue = String(draft.title ?? column.title)
    const title = validateCategoryName(titleValue)
    if (title) {
      showToast(title.replace('Category name', 'Column title'), 'error')
      return
    }
    const taglineValue = String(draft.tagline ?? column.tagline ?? '')
    const taglineErr = validateDescription(taglineValue, true, 3)
    if (taglineErr) {
      showToast(taglineErr.replace('Description', 'Tagline'), 'error')
      return
    }
    const descriptionValue = String(draft.description ?? column.description ?? '')
    const descriptionErr = validateDescription(descriptionValue, true, 5)
    if (descriptionErr) {
      showToast(descriptionErr, 'error')
      return
    }

    setSavingColumnId(column.id)
    const { error } = await supabase
      .from('showcase_columns')
      .update({
        title: titleValue.trim(),
        tagline: taglineValue.trim() || null,
        description: descriptionValue.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', column.id)
    setSavingColumnId(null)

    if (error) {
      showToast(error.message || 'Could not save column.', 'error')
      return
    }

    setColumnDrafts((prev) => {
      const next = { ...prev }
      delete next[column.id]
      return next
    })
    showToast('Column updated.')
    void load()
  }

  if (loading) {
    return (
      <section className="dashboard-panel admin-dashboard__panel">
        <p>Loading showcase…</p>
      </section>
    )
  }

  return (
    <div className="admin-dashboard__stack">
      <div className="admin-dashboard__subtabs" style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant={subTab === 'listings' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSubTab('listings')}
        >
          <Store size={15} /> Listings ({listings.length})
        </Button>
        <Button
          type="button"
          variant={subTab === 'announcements' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSubTab('announcements')}
        >
          <Megaphone size={15} /> Announcements &amp; Ads ({announcements.length})
        </Button>
        <Button
          type="button"
          variant={subTab === 'columns' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSubTab('columns')}
        >
          <FolderOpen size={15} /> Column Settings ({columns.length})
        </Button>
      </div>

      {subTab === 'listings' && (
        <div className="showcase-admin-layout">
          <section className="dashboard-panel admin-dashboard__panel showcase-admin-list-panel">
            <div className="dashboard-panel__header">
              <h2>
                <Store size={20} /> Showcase listings
              </h2>
              <span className="admin-dashboard__count">{filteredListings.length} shown</span>
            </div>

            <div className="showcase-admin-list__toolbar">
              <label className="showcase-admin-list__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search title, location, owner…"
                  aria-label="Search listings"
                />
              </label>
              <select
                id="showcase-filter-column"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                aria-label="Filter by column"
              >
                <option value="">All columns</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
              <select
                id="showcase-filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | ShowcaseListingStatus)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="showcase-admin-list" data-lenis-prevent data-modal-scroll>
              {pagedListings.map((listing) => {
                const dealType = listing.deal_type in SHOWCASE_DEAL_LABELS ? listing.deal_type : 'other'
                const status = resolveShowcaseAvailabilityStatus(listing)
                const options = showcaseAvailabilityOptions(dealType)
                return (
                  <article
                    key={listing.id}
                    className={`showcase-admin-row${editingId === listing.id ? ' is-editing' : ''}`}
                  >
                    {listing.image_urls[0] ? (
                      <img src={listing.image_urls[0]} alt="" className="showcase-admin-row__thumb" />
                    ) : (
                      <div className="showcase-admin-row__thumb showcase-admin-row__thumb--empty" aria-hidden />
                    )}
                    <div className="showcase-admin-row__body">
                      <div className="showcase-admin-row__top">
                        <strong className="showcase-admin-row__title">{listing.title}</strong>
                        <div className="showcase-admin-row__actions">
                          <button
                            type="button"
                            className="showcase-admin-row__icon-btn"
                            title="Edit"
                            aria-label={`Edit ${listing.title}`}
                            onClick={() => startEdit(listing)}
                          >
                            <Pencil size={14} />
                          </button>
                          <div className="showcase-admin-row__avail" role="group" aria-label="Availability">
                            {options.map((option) => (
                              <button
                                key={option}
                                type="button"
                                className={`showcase-admin-row__text-btn${status === option ? ' is-active' : ''}${
                                  option !== 'available' ? ' is-closed' : ''
                                }`}
                                title={`Mark ${SHOWCASE_AVAILABILITY_STATUS_LABELS[option]}`}
                                aria-pressed={status === option}
                                onClick={() => void setAvailabilityStatus(listing, option)}
                              >
                                {SHOWCASE_AVAILABILITY_STATUS_LABELS[option]}
                              </button>
                            ))}
                          </div>
                          {listing.status !== 'published' ? (
                            <button
                              type="button"
                              className="showcase-admin-row__icon-btn showcase-admin-row__icon-btn--accent"
                              title="Publish"
                              aria-label={`Publish ${listing.title}`}
                              onClick={() => void setStatus(listing.id, 'published')}
                            >
                              <Upload size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="showcase-admin-row__icon-btn"
                              title="Unpublish"
                              aria-label={`Unpublish ${listing.title}`}
                              onClick={() => void setStatus(listing.id, 'draft')}
                            >
                              <EyeOff size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="showcase-admin-row__icon-btn showcase-admin-row__icon-btn--danger"
                            title="Delete"
                            aria-label={`Delete ${listing.title}`}
                            onClick={() => void deleteListing(listing.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="showcase-admin-row__meta">
                        {listing.showcase_columns?.title || 'Column'}
                        {listing.location ? ` · ${listing.location}` : ''}
                        {listing.price_label ? ` · ${listing.price_label}` : ''}
                      </p>
                      <div className="showcase-admin-row__badges">
                        <span className="status-badge">{SHOWCASE_DEAL_LABELS[dealType]}</span>
                        <span
                          className={`status-badge status-badge--${listing.status === 'published' ? 'approved' : listing.status === 'draft' ? 'pending' : 'rejected'}`}
                        >
                          {listing.status}
                        </span>
                        <span className={`status-badge status-badge--${status === 'available' ? 'approved' : 'rejected'}`}>
                          {showcaseAvailabilityLabel(listing)}
                        </span>
                        {listing.featured ? <span className="status-badge">Featured</span> : null}
                      </div>
                    </div>
                  </article>
                )
              })}
              {filteredListings.length === 0 ? (
                <p className="admin-dashboard__empty">
                  No listings match. Adjust filters or add a listing in the form.
                </p>
              ) : null}
            </div>

            {filteredListings.length > LIST_PAGE_SIZE ? (
              <div className="showcase-admin-list__pager">
                <button
                  type="button"
                  className="showcase-admin-row__icon-btn"
                  disabled={safeListPage <= 1}
                  onClick={() => setListPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {safeListPage} / {listPageCount}
                </span>
                <button
                  type="button"
                  className="showcase-admin-row__icon-btn"
                  disabled={safeListPage >= listPageCount}
                  onClick={() => setListPage((page) => Math.min(listPageCount, page + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </section>

          <section className="dashboard-panel admin-dashboard__panel showcase-admin-form-panel">
            <div className="dashboard-panel__header">
              <h2>{editingId ? 'Edit listing' : 'Add listing'}</h2>
            </div>
            <p className="admin-dashboard__hint">
              Required: column, title, location, summary, and description. Photos are optional — text-only
              listings are fine.
            </p>
            <div className="dashboard-form dashboard-form--flush">
              <div className={`input-group ${errors.column_id ? 'input-group--error' : ''}`}>
                <label htmlFor="showcase-column">Column</label>
                <select
                  id="showcase-column"
                  value={form.column_id}
                  onChange={(e) => patchForm('column_id', e.target.value)}
                  aria-invalid={errors.column_id ? true : undefined}
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
                {errors.column_id ? (
                  <span className="input-error" role="alert">
                    {errors.column_id}
                  </span>
                ) : null}
              </div>

              <Input
                label="Title"
                value={form.title}
                onChange={(e) => patchForm('title', e.target.value)}
                hint={FIELD_HINTS.listingTitle}
                error={errors.title}
                required
              />

              <div className="input-group">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 14rem' }}>
                    <Input
                      label="Location"
                      value={form.location}
                      onChange={(e) => patchForm('location', e.target.value)}
                      hint={FIELD_HINTS.location}
                      error={errors.location}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={locating}
                    onClick={() => void handleCurrentLocation()}
                    style={{ marginBottom: errors.location ? '1.35rem' : '0.15rem' }}
                  >
                    <LocateFixed size={14} /> {locating ? 'Locating…' : 'Use my location'}
                  </Button>
                </div>
              </div>

              <Textarea
                label="Prices"
                value={form.price_label}
                onChange={(e) => patchForm('price_label', e.target.value)}
                hint={FIELD_HINTS.priceLabel}
                error={errors.price_label}
                rows={4}
                placeholder={'1000sqm — P400,000\n1023sqm — P400,000\n3000sqm — P900,000'}
              />

              <div className="input-group">
                <label htmlFor="showcase-deal-type">Deal type</label>
                <select
                  id="showcase-deal-type"
                  value={form.deal_type}
                  onChange={(e) => {
                    const deal_type = e.target.value as ShowcaseDealType
                    const options = showcaseAvailabilityOptions(deal_type)
                    const availability_status = options.includes(form.availability_status)
                      ? form.availability_status
                      : options[0]
                    setForm((prev) => ({ ...prev, deal_type, availability_status }))
                  }}
                >
                  {DEAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SHOWCASE_DEAL_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="showcase-availability">Availability</label>
                <select
                  id="showcase-availability"
                  value={form.availability_status}
                  onChange={(e) =>
                    patchForm('availability_status', e.target.value as ShowcaseAvailabilityStatus)
                  }
                >
                  {showcaseAvailabilityOptions(form.deal_type).map((option) => (
                    <option key={option} value={option}>
                      {option === 'available' &&
                      (form.deal_type === 'opportunity' || form.deal_type === 'project')
                        ? 'Open'
                        : SHOWCASE_AVAILABILITY_STATUS_LABELS[option]}
                    </option>
                  ))}
                </select>
                <span className="input-hint">
                  For sale &amp; rent listings, choose Available, Sold, or Tenanted yourself.
                </span>
              </div>

              <div className="input-group">
                <label htmlFor="showcase-status">Status</label>
                <select
                  id="showcase-status"
                  value={form.status}
                  onChange={(e) => patchForm('status', e.target.value as ShowcaseListingStatus)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Short summary"
                rows={2}
                value={form.summary}
                onChange={(e) => patchForm('summary', e.target.value)}
                hint={FIELD_HINTS.listingSummary}
                error={errors.summary}
                required
              />
              <Textarea
                label="Full description"
                rows={4}
                value={form.description}
                onChange={(e) => patchForm('description', e.target.value)}
                hint={FIELD_HINTS.description}
                error={errors.description}
                required
              />

              <label className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => patchForm('featured', e.target.checked)}
                />
                <span>Featured badge on column page</span>
              </label>

              <p className="admin-dashboard__hint" style={{ marginTop: '0.5rem' }}>
                Owner contacts (optional) — shown on the public listing card so buyers can reach the owner directly.
              </p>
              <Input
                label="Owner name"
                value={form.owner_name}
                onChange={(e) => patchForm('owner_name', e.target.value)}
                error={errors.owner_name}
                hint="Person or business that owns this listing"
              />
              <Input
                label="Owner phone"
                value={form.owner_phone}
                onChange={(e) => patchForm('owner_phone', e.target.value)}
                error={errors.owner_phone}
                hint={FIELD_HINTS.contactPhone}
              />
              <Input
                label="Owner email"
                type="email"
                value={form.owner_email}
                onChange={(e) => patchForm('owner_email', e.target.value)}
                error={errors.owner_email}
                hint="Optional email for direct enquiries"
              />

              <div className={`input-group ${errors.images ? 'input-group--error' : ''}`}>
                <label>Photos ({form.image_urls.length}/{MAX_IMAGES}) — optional</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0' }}>
                  {form.image_urls.map((url) => (
                    <div key={url} style={{ position: 'relative' }}>
                      <img
                        src={url}
                        alt=""
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ position: 'absolute', top: 2, right: 2, padding: '0.15rem' }}
                        onClick={() => removeImage(url)}
                        aria-label="Remove photo"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        style={{ position: 'absolute', bottom: 2, right: 2, padding: '0.15rem' }}
                        onClick={() => void openExistingCrop(url, 'listing')}
                        aria-label="Crop photo"
                        disabled={loadingCrop || uploading}
                      >
                        <Crop size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => void handleFilePick(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={uploading || loadingCrop || form.image_urls.length >= MAX_IMAGES}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus size={14} />{' '}
                  {uploading ? 'Uploading…' : loadingCrop ? 'Opening editor…' : 'Add photos'}
                </Button>
                {errors.images ? (
                  <span className="input-error" role="alert">
                    {errors.images}
                  </span>
                ) : (
                  <span className="input-hint">
                    Optional — select one photo to crop, or multiple to upload · up to {MAX_IMAGES}.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button onClick={() => void saveListing()} disabled={saving || uploading || locating}>
                  {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish listing'}
                </Button>
                {editingId ? (
                  <Button variant="ghost" onClick={() => resetForm(form.column_id)}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      )}

      {subTab === 'announcements' && (
        <div className="showcase-admin-layout">
          <section className="dashboard-panel admin-dashboard__panel showcase-admin-list-panel">
            <div className="dashboard-panel__header">
              <h2>
                <Megaphone size={20} /> Column Announcements &amp; Ads
              </h2>
              <span className="admin-dashboard__count">{filteredAnnouncements.length} shown</span>
            </div>

            <div className="showcase-admin-list__toolbar">
              <label className="showcase-admin-list__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  value={annSearch}
                  onChange={(e) => setAnnSearch(e.target.value)}
                  placeholder="Search title, badge, column…"
                  aria-label="Search announcements"
                />
              </label>
              <select
                id="showcase-ann-filter-column"
                value={annFilterColumn}
                onChange={(e) => setAnnFilterColumn(e.target.value)}
                aria-label="Filter announcements by column"
              >
                <option value="">All columns</option>
                <option value="global">Global only (All columns)</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
              <select
                id="showcase-ann-filter-category"
                value={annFilterCategory}
                onChange={(e) => setAnnFilterCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <select
                id="showcase-ann-filter-status"
                value={annFilterStatus}
                onChange={(e) => setAnnFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                aria-label="Filter by active status"
              >
                <option value="all">All status</option>
                <option value="active">Active only</option>
                <option value="inactive">Hidden only</option>
              </select>
            </div>

            <div className="showcase-admin-list" data-lenis-prevent data-modal-scroll>
              {pagedAnnouncements.map((item) => (
                <article
                  key={item.id}
                  className={`showcase-admin-row${annEditingId === item.id ? ' is-editing' : ''}`}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="showcase-admin-row__thumb" />
                  ) : (
                    <div className="showcase-admin-row__thumb showcase-admin-row__thumb--empty" aria-hidden>
                      <Megaphone size={18} style={{ opacity: 0.5 }} />
                    </div>
                  )}
                  <div className="showcase-admin-row__body">
                    <div className="showcase-admin-row__top">
                      <strong className="showcase-admin-row__title">{item.title}</strong>
                      <div className="showcase-admin-row__actions">
                        <button
                          type="button"
                          className="showcase-admin-row__icon-btn"
                          title="Edit"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => startEditAnnouncement(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={`showcase-admin-row__icon-btn${item.active ? ' showcase-admin-row__icon-btn--accent' : ''}`}
                          title={item.active ? 'Hide announcement' : 'Show announcement'}
                          aria-label={item.active ? `Hide ${item.title}` : `Show ${item.title}`}
                          onClick={() => void toggleAnnouncementActive(item.id, !item.active)}
                        >
                          {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                          type="button"
                          className="showcase-admin-row__icon-btn showcase-admin-row__icon-btn--danger"
                          title="Delete"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => void deleteAnnouncement(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="showcase-admin-row__meta">
                      {item.showcase_columns?.title ? `Column: ${item.showcase_columns.title}` : 'All Showcase Columns (Global)'}
                      {item.contact_phone ? ` · 📞 ${item.contact_phone}` : ''}
                      {item.link_url ? ` · 🔗 ${item.link_label || 'Link attached'}` : ''}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.body}
                    </p>
                    <div className="showcase-admin-row__badges">
                      <span className="status-badge status-badge--approved">
                        {SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS[item.category]}
                      </span>
                      {item.badge ? (
                        <span className="status-badge" style={{ borderColor: 'rgba(201,162,75,0.6)' }}>
                          {item.badge}
                        </span>
                      ) : null}
                      <span className={`status-badge status-badge--${item.active ? 'approved' : 'rejected'}`}>
                        {item.active ? 'Active' : 'Hidden'}
                      </span>
                      {item.pinned ? <span className="status-badge">📌 Pinned</span> : null}
                      {item.expires_at ? (
                        <span className="status-badge" style={{ color: '#fbbf24' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                          {new Date(item.expires_at).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {filteredAnnouncements.length === 0 ? (
                <p className="admin-dashboard__empty">
                  No announcements found. Add a job opening or advertisement in the form to feature it on a column!
                </p>
              ) : null}
            </div>

            {filteredAnnouncements.length > ANNOUNCEMENT_PAGE_SIZE ? (
              <div className="showcase-admin-list__pager">
                <button
                  type="button"
                  className="showcase-admin-row__icon-btn"
                  disabled={safeAnnPage <= 1}
                  onClick={() => setAnnPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {safeAnnPage} / {annPageCount}
                </span>
                <button
                  type="button"
                  className="showcase-admin-row__icon-btn"
                  disabled={safeAnnPage >= annPageCount}
                  onClick={() => setAnnPage((page) => Math.min(annPageCount, page + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </section>

          <section className="dashboard-panel admin-dashboard__panel showcase-admin-form-panel">
            <div className="dashboard-panel__header">
              <h2>{annEditingId ? 'Edit announcement' : 'Add announcement / advertisement'}</h2>
            </div>
            <p className="admin-dashboard__hint">
              Feature advertisements, job openings, urgent notices, or opportunities based on particular showcase columns.
            </p>
            <div className="dashboard-form dashboard-form--flush">
              <div className="input-group">
                <label htmlFor="ann-column">Target Showcase Column</label>
                <select
                  id="ann-column"
                  value={annForm.column_id}
                  onChange={(e) => patchAnnForm('column_id', e.target.value)}
                >
                  <option value="">All Columns / Global Spotlight</option>
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title} (/{column.slug})
                    </option>
                  ))}
                </select>
                <span className="input-hint">
                  Choose a column like &quot;Career Development&quot; for job openings, &quot;Real Estate&quot; for properties ads, or leave as Global.
                </span>
              </div>

              <div className="input-group">
                <label htmlFor="ann-category">Category / Type</label>
                <select
                  id="ann-category"
                  value={annForm.category}
                  onChange={(e) => patchAnnForm('category', e.target.value as ShowcaseAnnouncementCategory)}
                >
                  {ANNOUNCEMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {SHOWCASE_ANNOUNCEMENT_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Custom Badge (optional)"
                value={annForm.badge}
                onChange={(e) => patchAnnForm('badge', e.target.value)}
                placeholder="e.g. Hiring, Sponsored Ad, Hot Opportunity, Urgent"
                hint="Short tag shown on the banner top"
              />

              <Input
                label="Announcement Title"
                value={annForm.title}
                onChange={(e) => patchAnnForm('title', e.target.value)}
                placeholder="e.g. Junior Graphic Designer Wanted or Special Real Estate Expo Promo"
                error={annErrors.title}
                required
              />

              <Textarea
                label="Announcement Body / Details"
                rows={4}
                value={annForm.body}
                onChange={(e) => patchAnnForm('body', e.target.value)}
                placeholder="Describe the opportunity, job requirements, discount details, or notice..."
                error={annErrors.body}
                required
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Link URL (creates a button)"
                  value={annForm.link_url}
                  onChange={(e) => patchAnnForm('link_url', e.target.value)}
                  placeholder="https://example.com/apply"
                  error={annErrors.link_url}
                  hint="Paste a website URL here. URLs included in the details also become buttons."
                />
                <Input
                  label="Button Text (optional)"
                  value={annForm.link_label}
                  onChange={(e) => patchAnnForm('link_label', e.target.value)}
                  placeholder="e.g. Apply Now or Visit Website"
                  hint="If a URL is pasted here by mistake, it will still be used as the button link."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label="Contact Phone / WhatsApp"
                  value={annForm.contact_phone}
                  onChange={(e) => patchAnnForm('contact_phone', e.target.value)}
                  placeholder="+267 74013060"
                  error={annErrors.contact_phone}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={annForm.contact_email}
                  onChange={(e) => patchAnnForm('contact_email', e.target.value)}
                  placeholder="jobs@company.com"
                  error={annErrors.contact_email}
                />
              </div>

              <Input
                id="ann-expiry"
                className="showcase-announcement-date"
                label="Expiration Date (optional)"
                type="date"
                value={annForm.expires_at}
                onChange={(e) => patchAnnForm('expires_at', e.target.value)}
                hint="Announcement will automatically stop showing publicly at the end of this date."
              />

              <div className="input-group">
                <label>Banner Flyer / Image (optional)</label>
                {annForm.image_url ? (
                  <div style={{ position: 'relative', width: 140, height: 80, margin: '0.4rem 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(201,162,75,0.4)' }}>
                    <img
                      src={annForm.image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ position: 'absolute', top: 2, right: 2, padding: '0.15rem' }}
                      onClick={() => patchAnnForm('image_url', '')}
                      aria-label="Remove photo"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ position: 'absolute', bottom: 2, right: 2, padding: '0.15rem' }}
                      onClick={() => void openExistingCrop(annForm.image_url, 'announcement')}
                      aria-label="Crop photo"
                      disabled={loadingCrop || annUploading}
                    >
                      <Crop size={12} />
                    </button>
                  </div>
                ) : null}
                <input
                  ref={annFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={(e) => handleAnnFilePick(e.target.files)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={annUploading || loadingCrop}
                  onClick={() => annFileRef.current?.click()}
                >
                  <ImagePlus size={14} />{' '}
                  {annUploading ? 'Uploading…' : annForm.image_url ? 'Replace flyer' : 'Attach flyer image'}
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', margin: '0.4rem 0 0.8rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={annForm.pinned}
                    onChange={(e) => patchAnnForm('pinned', e.target.checked)}
                  />
                  <span>📌 Pin at top of column / hub</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={annForm.active}
                    onChange={(e) => patchAnnForm('active', e.target.checked)}
                  />
                  <span>Active (live now)</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button onClick={() => void saveAnnouncement()} disabled={annSaving || annUploading}>
                  {annSaving ? 'Saving…' : annEditingId ? 'Save changes' : 'Feature announcement'}
                </Button>
                {annEditingId ? (
                  <Button variant="ghost" onClick={() => resetAnnouncementForm(annForm.column_id)}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      )}

      {subTab === 'columns' && (
        <section className="dashboard-panel admin-dashboard__panel">
          <div className="dashboard-panel__header">
            <h2>Showcase columns</h2>
          </div>
          <p className="admin-dashboard__hint">
            Edit field titles, taglines and descriptions shown on public Showcase pages. Marketing chrome (hero copy,
            section labels) is editable live with Edit website.
          </p>
          <div className="admin-card-list">
            {columns.map((column) => (
              <article key={column.id} className="admin-card admin-card--stacked">
                <strong>
                  {column.title} <span className="admin-card__meta">/{column.slug}</span>
                </strong>
                <div className="dashboard-form dashboard-form--flush" style={{ width: '100%', marginTop: '0.75rem' }}>
                  <Input
                    label="Title"
                    value={columnValue(column, 'title')}
                    onChange={(e) => patchColumnDraft(column.id, { title: e.target.value })}
                  />
                  <Input
                    label="Tagline"
                    value={columnValue(column, 'tagline')}
                    onChange={(e) => patchColumnDraft(column.id, { tagline: e.target.value })}
                  />
                  <Textarea
                    label="Description"
                    rows={3}
                    value={columnValue(column, 'description')}
                    onChange={(e) => patchColumnDraft(column.id, { description: e.target.value })}
                  />
                  <Button
                    size="sm"
                    disabled={savingColumnId === column.id || !columnDrafts[column.id]}
                    onClick={() => void saveColumn(column)}
                  >
                    {savingColumnId === column.id ? 'Saving…' : 'Save column'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title={
          cropTarget === 'announcement'
            ? 'Crop announcement banner'
            : editingImageUrl
            ? 'Recrop listing photo'
            : 'Crop listing photo'
        }
        outputWidth={UPLOAD_LIMITS.showcase.maxWidth}
        outputHeight={
          cropTarget === 'announcement'
            ? Math.round(UPLOAD_LIMITS.showcase.maxWidth * 0.5)
            : Math.round(UPLOAD_LIMITS.showcase.maxWidth * 0.625)
        }
        aspectRatio={cropTarget === 'announcement' ? 2 / 1 : 16 / 10}
        onClose={() => {
          setCropOpen(false)
          setCropFile(null)
          setEditingImageUrl(null)
        }}
        onConfirm={(file) => void handleCroppedUpload(file)}
      />
    </div>
  )
}
