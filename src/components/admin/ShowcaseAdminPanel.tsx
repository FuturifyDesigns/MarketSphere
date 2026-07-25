import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Store, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { SHOWCASE_DEAL_LABELS } from '../../lib/showcase'
import { uploadShowcaseImage } from '../../lib/showcaseUpload'
import { supabase } from '../../lib/supabase'
import type { ShowcaseColumn, ShowcaseDealType, ShowcaseListing, ShowcaseListingStatus } from '../../lib/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

const DEAL_TYPES = Object.keys(SHOWCASE_DEAL_LABELS) as ShowcaseDealType[]
const STATUSES: ShowcaseListingStatus[] = ['draft', 'published', 'archived']
const MAX_IMAGES = 6

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

export function ShowcaseAdminPanel() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [columns, setColumns] = useState<ShowcaseColumn[]>([])
  const [listings, setListings] = useState<ShowcaseListing[]>([])
  const [filterColumn, setFilterColumn] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListingForm>(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    setForm(emptyForm(columnId || columns[0]?.id || filterColumn || ''))
  }

  const startEdit = (listing: ShowcaseListing) => {
    setEditingId(listing.id)
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

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    const remaining = MAX_IMAGES - form.image_urls.length
    if (remaining <= 0) {
      showToast(`You can upload up to ${MAX_IMAGES} photos per listing.`, 'error')
      return
    }

    setUploading(true)
    try {
      const selected = Array.from(files).slice(0, remaining)
      const urls: string[] = []
      for (const file of selected) {
        urls.push(await uploadShowcaseImage(file, editingId || 'draft'))
      }
      setForm((prev) => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }))
      showToast(urls.length === 1 ? 'Photo added.' : `${urls.length} photos added.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Photo upload failed.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, image_urls: prev.image_urls.filter((item) => item !== url) }))
  }

  const saveListing = async () => {
    if (!form.column_id) {
      showToast('Choose a showcase column.', 'error')
      return
    }
    if (!form.title.trim()) {
      showToast('Add a listing title.', 'error')
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

  if (loading) {
    return (
      <section className="dashboard-panel admin-dashboard__panel">
        <p>Loading showcase…</p>
      </section>
    )
  }

  return (
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
                  <span className={`status-badge status-badge--${listing.status === 'published' ? 'approved' : listing.status === 'draft' ? 'pending' : 'rejected'}`}>
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
              No listings yet. Add a property, project, or opportunity in the form — it appears on the public Showcase page when published.
            </p>
          ) : null}
        </div>
      </section>

      <section className="dashboard-panel admin-dashboard__panel">
        <div className="dashboard-panel__header">
          <h2>{editingId ? 'Edit listing' : 'Add listing'}</h2>
        </div>
        <p className="admin-dashboard__hint">
          Only admins can publish showcase ads. Customers see published listings under Showcase in the navbar.
        </p>
        <div className="dashboard-form dashboard-form--flush">
          <div className="input-group">
            <label htmlFor="showcase-column">Column</label>
            <select
              id="showcase-column"
              value={form.column_id}
              onChange={(e) => setForm({ ...form, column_id: e.target.value })}
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            hint="e.g. 3-bedroom house in Phakalane"
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            hint="Town / area across Botswana"
          />
          <Input
            label="Price label"
            value={form.price_label}
            onChange={(e) => setForm({ ...form, price_label: e.target.value })}
            hint="e.g. P1.2M · P4,500 / month · Free mentoring"
          />

          <div className="input-group">
            <label htmlFor="showcase-deal-type">Deal type</label>
            <select
              id="showcase-deal-type"
              value={form.deal_type}
              onChange={(e) => setForm({ ...form, deal_type: e.target.value as ShowcaseDealType })}
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
              onChange={(e) => setForm({ ...form, status: e.target.value as ShowcaseListingStatus })}
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
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <Textarea
            label="Full description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            <span>Featured on column page</span>
          </label>

          <div className="input-group">
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
                </div>
              ))}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading || form.image_urls.length >= MAX_IMAGES}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={14} /> {uploading ? 'Uploading…' : 'Add photos'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Button onClick={() => void saveListing()} disabled={saving || uploading}>
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
  )
}
