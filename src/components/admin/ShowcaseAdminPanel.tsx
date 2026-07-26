import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Crop, ImagePlus, LocateFixed, Store, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { resolveCurrentLocationLabel } from '../../lib/geolocation'
import { assertImageFile, urlToImageFile } from '../../lib/imageCrop'
import { UPLOAD_LIMITS } from '../../lib/imageUpload'
import { SHOWCASE_DEAL_LABELS } from '../../lib/showcase'
import { uploadShowcaseImage } from '../../lib/showcaseUpload'
import { supabase } from '../../lib/supabase'
import type { ShowcaseColumn, ShowcaseDealType, ShowcaseListing, ShowcaseListingStatus } from '../../lib/types'
import {
  FIELD_HINTS,
  type FieldErrors,
  validateDescription,
  validateListingSummary,
  validateListingTitle,
  validatePriceLabel,
  validateRequired,
  validateRequiredLocation,
} from '../../lib/validation'
import { Button } from '../ui/Button'
import { ImageCropModal } from '../ui/ImageCropModal'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

const DEAL_TYPES = Object.keys(SHOWCASE_DEAL_LABELS) as ShowcaseDealType[]
const STATUSES: ShowcaseListingStatus[] = ['draft', 'published', 'archived']
const MAX_IMAGES = UPLOAD_LIMITS.showcase.maxCount

type ListingForm = {
  column_id: string
  title: string
  summary: string
  description: string
  location: string
  price_label: string
  deal_type: ShowcaseDealType
  status: ShowcaseListingStatus
  featured: boolean
  sort_order: number
  image_urls: string[]
}

type ListingField = 'column_id' | 'title' | 'summary' | 'description' | 'location' | 'price_label' | 'images'

const emptyForm = (columnId = ''): ListingForm => ({
  column_id: columnId,
  title: '',
  summary: '',
  description: '',
  location: '',
  price_label: '',
  deal_type: 'sale',
  status: 'published',
  featured: false,
  sort_order: 0,
  image_urls: [],
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
  if (form.image_urls.length < 1) next.images = 'Add at least one photo.'
  return next
}

export function ShowcaseAdminPanel() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [columns, setColumns] = useState<ShowcaseColumn[]>([])
  const [listings, setListings] = useState<ShowcaseListing[]>([])
  const [filterColumn, setFilterColumn] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListingForm>(emptyForm())
  const [errors, setErrors] = useState<FieldErrors<ListingField>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null)
  const [loadingCrop, setLoadingCrop] = useState(false)
  const [columnDrafts, setColumnDrafts] = useState<Record<string, Partial<ShowcaseColumn>>>({})
  const [savingColumnId, setSavingColumnId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const [colsRes, listRes] = await Promise.all([
      supabase.from('showcase_columns').select('*').order('sort_order'),
      supabase
        .from('showcase_listings')
        .select('*, showcase_columns(id, slug, title, icon)')
        .order('updated_at', { ascending: false })
        .limit(300),
    ])

    if (colsRes.error) {
      showToast(colsRes.error.message || 'Could not load showcase columns.', 'error')
    }
    if (listRes.error) {
      showToast(listRes.error.message || 'Could not load showcase listings.', 'error')
    }

    setColumns(colsRes.data || [])
    setListings(listRes.data || [])
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
      .subscribe()

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [load])

  const filtered = useMemo(() => {
    if (!filterColumn) return listings
    return listings.filter((item) => item.column_id === filterColumn)
  }, [listings, filterColumn])

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
      featured: listing.featured,
      sort_order: listing.sort_order,
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

  const openCropForFile = (file: File) => {
    try {
      assertImageFile(file)
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

    // One file: open crop editor. Multiple: batch-upload (re-crop later if needed).
    if (selected.length === 1) {
      openCropForFile(selected[0])
      if (files.length > remaining) {
        showToast(`Only ${remaining} photo slot${remaining === 1 ? '' : 's'} left — extra files were skipped.`, 'error')
      }
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

      if (files.length > remaining) {
        showToast(`Only ${remaining} photo slots left — extra files were skipped.`, 'error')
      }
    } finally {
      setUploading(false)
    }
  }

  const openExistingCrop = async (url: string) => {
    setLoadingCrop(true)
    try {
      const file = await urlToImageFile(url, 'showcase.jpg')
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

  const useCurrentLocation = async () => {
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
      featured: form.featured,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
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
    const title = validateRequired(String(draft.title ?? column.title), 'Column title', 2, 80)
    if (title) {
      showToast(title, 'error')
      return
    }

    setSavingColumnId(column.id)
    const { error } = await supabase
      .from('showcase_columns')
      .update({
        title: String(draft.title ?? column.title).trim(),
        tagline: String(draft.tagline ?? column.tagline ?? '').trim() || null,
        description: String(draft.description ?? column.description ?? '').trim() || null,
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
      <div className="admin-dashboard__split">
        <section className="dashboard-panel admin-dashboard__panel">
          <div className="dashboard-panel__header">
            <h2>
              <Store size={20} /> Showcase listings
            </h2>
            <span className="admin-dashboard__count">{filtered.length} shown</span>
          </div>

          <div className="dashboard-form dashboard-form--flush" style={{ marginBottom: '1rem' }}>
            <div className="input-group">
              <label htmlFor="showcase-filter-column">Filter by column</label>
              <select
                id="showcase-filter-column"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
              >
                <option value="">All columns</option>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-card-list">
            {filtered.map((listing) => (
              <article key={listing.id} className="admin-card admin-card--stacked">
                <div>
                  {listing.image_urls[0] ? (
                    <img
                      src={listing.image_urls[0]}
                      alt=""
                      className="admin-card__avatar"
                      style={{ width: 64, height: 48, borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : null}
                  <strong>{listing.title}</strong>
                  <p className="admin-card__meta">
                    {listing.showcase_columns?.title || 'Column'}
                    {listing.location ? ` · ${listing.location}` : ''}
                    {listing.price_label ? ` · ${listing.price_label}` : ''}
                  </p>
                  <div className="admin-card__badges">
                    <span className="status-badge">{SHOWCASE_DEAL_LABELS[listing.deal_type]}</span>
                    <span
                      className={`status-badge status-badge--${listing.status === 'published' ? 'approved' : listing.status === 'draft' ? 'pending' : 'rejected'}`}
                    >
                      {listing.status}
                    </span>
                    {listing.featured ? <span className="status-badge">Featured</span> : null}
                  </div>
                </div>
                <div className="admin-card__actions">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(listing)}>
                    Edit
                  </Button>
                  {listing.status !== 'published' ? (
                    <Button size="sm" onClick={() => void setStatus(listing.id, 'published')}>
                      Publish
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void setStatus(listing.id, 'draft')}>
                      Unpublish
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => void deleteListing(listing.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </article>
            ))}
            {filtered.length === 0 ? (
              <p className="admin-dashboard__empty">
                No listings yet. Add a property, project, or opportunity in the form — it appears on the public
                Showcase page when published.
              </p>
            ) : null}
          </div>
        </section>

        <section className="dashboard-panel admin-dashboard__panel">
          <div className="dashboard-panel__header">
            <h2>{editingId ? 'Edit listing' : 'Add listing'}</h2>
          </div>
          <p className="admin-dashboard__hint">
            Required: column, title, location, summary, description, and at least one photo. Use crop to frame
            photos before upload.
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
                  onClick={() => void useCurrentLocation()}
                  style={{ marginBottom: errors.location ? '1.35rem' : '0.15rem' }}
                >
                  <LocateFixed size={14} /> {locating ? 'Locating…' : 'Use my location'}
                </Button>
              </div>
            </div>

            <Input
              label="Price label"
              value={form.price_label}
              onChange={(e) => patchForm('price_label', e.target.value)}
              hint={FIELD_HINTS.priceLabel}
              error={errors.price_label}
            />

            <div className="input-group">
              <label htmlFor="showcase-deal-type">Deal type</label>
              <select
                id="showcase-deal-type"
                value={form.deal_type}
                onChange={(e) => patchForm('deal_type', e.target.value as ShowcaseDealType)}
              >
                {DEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SHOWCASE_DEAL_LABELS[type]}
                  </option>
                ))}
              </select>
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

            <div className={`input-group ${errors.images ? 'input-group--error' : ''}`}>
              <label>Photos ({form.image_urls.length}/{MAX_IMAGES})</label>
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
                      onClick={() => void openExistingCrop(url)}
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
                  Select one photo to crop, or multiple to upload together · up to {MAX_IMAGES} · ~
                  {Math.round(UPLOAD_LIMITS.showcase.maxBytes / 1000)}KB each after compression.
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

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title={editingImageUrl ? 'Recrop listing photo' : 'Crop listing photo'}
        outputWidth={UPLOAD_LIMITS.showcase.maxWidth}
        outputHeight={Math.round(UPLOAD_LIMITS.showcase.maxWidth * 0.625)}
        aspectRatio={16 / 10}
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
