import { useEffect, useState } from 'react'
import { BarChart3, Check, FolderOpen, Mail, Users, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  sanitizePersonName,
  sanitizeSlug,
  slugify,
  validateCategoryName,
  validateClientName,
  validateDescription,
  validateServiceType,
  validateSlug,
  validateTestimonialContent,
  type FieldErrors,
} from '../../lib/validation'
import type { Category, ContactMessage, Profile, Provider, Testimonial } from '../../lib/types'
import './Dashboard.css'

type CategoryFields = 'name' | 'slug' | 'description'
type TestimonialFields = 'client_name' | 'service_type' | 'content'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, providers: 0, pending: 0, enquiries: 0, contacts: 0 })
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([])
  const [allProviders, setAllProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [tab, setTab] = useState<'overview' | 'providers' | 'users' | 'categories' | 'testimonials' | 'contacts'>('overview')
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' })
  const [newTestimonial, setNewTestimonial] = useState({ client_name: '', content: '', service_type: '' })
  const [categoryErrors, setCategoryErrors] = useState<FieldErrors<CategoryFields>>({})
  const [testimonialErrors, setTestimonialErrors] = useState<FieldErrors<TestimonialFields>>({})
  const [formError, setFormError] = useState('')

  const loadData = async () => {
    const [usersRes, providersRes, pendingRes, enquiriesRes, catsRes, testRes, contactsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('providers').select('*'),
      supabase.from('providers').select('*').eq('status', 'pending'),
      supabase.from('enquiries').select('id', { count: 'exact' }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ])

    setStats({
      users: usersRes.data?.length || 0,
      providers: providersRes.data?.filter((p) => p.status === 'approved').length || 0,
      pending: pendingRes.data?.length || 0,
      enquiries: enquiriesRes.count || 0,
      contacts: contactsRes.data?.filter((m) => m.status === 'new').length || 0,
    })
    setPendingProviders(pendingRes.data || [])
    setAllProviders(providersRes.data || [])
    setUsers(usersRes.data || [])
    setCategories(catsRes.data || [])
    setTestimonials(testRes.data || [])
    setContactMessages(contactsRes.data || [])
  }

  useEffect(() => { loadData() }, [])

  const updateProviderStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('providers').update({ status }).eq('id', id)
    loadData()
  }

  const addCategory = async () => {
    setFormError('')
    const slug = newCategory.slug.trim() || slugify(newCategory.name)

    const errors = collectErrors<CategoryFields>([
      ['name', validateCategoryName(newCategory.name)],
      ['slug', validateSlug(slug)],
      ['description', validateDescription(newCategory.description, true, 5)],
    ])
    setCategoryErrors(errors)
    if (hasErrors(errors)) return

    const { error } = await supabase.from('categories').insert({
      name: newCategory.name.trim(),
      slug,
      description: newCategory.description.trim() || null,
    })
    if (error) {
      setFormError('Could not add category. The slug may already exist.')
      return
    }

    setNewCategory({ name: '', slug: '', description: '' })
    setCategoryErrors({})
    loadData()
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  const addTestimonial = async () => {
    setFormError('')

    const errors = collectErrors<TestimonialFields>([
      ['client_name', validateClientName(newTestimonial.client_name)],
      ['service_type', validateServiceType(newTestimonial.service_type)],
      ['content', validateTestimonialContent(newTestimonial.content)],
    ])
    setTestimonialErrors(errors)
    if (hasErrors(errors)) return

    const { error } = await supabase.from('testimonials').insert({
      client_name: newTestimonial.client_name.trim(),
      content: newTestimonial.content.trim(),
      service_type: newTestimonial.service_type.trim() || null,
      rating: 5,
      approved: true,
    })
    if (error) {
      setFormError('Could not add testimonial. Please try again.')
      return
    }

    setNewTestimonial({ client_name: '', content: '', service_type: '' })
    setTestimonialErrors({})
    loadData()
  }

  const toggleTestimonial = async (id: string, approved: boolean) => {
    await supabase.from('testimonials').update({ approved }).eq('id', id)
    loadData()
  }

  const updateContactStatus = async (id: string, status: ContactMessage['status']) => {
    await supabase.from('contact_messages').update({ status }).eq('id', id)
    loadData()
  }

  return (
    <div className="dashboard dashboard--admin">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage providers, users, categories, and platform content</p>
        </div>

        <div className="dashboard-tabs">
          {(['overview', 'providers', 'users', 'contacts', 'categories', 'testimonials'] as const).map((t) => (
            <button key={t} className={tab === t ? 'tab--active' : ''} onClick={() => setTab(t)}>
              {t === 'contacts' ? `Contacts${stats.contacts > 0 ? ` (${stats.contacts})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="dashboard-profile-layout">
            <AccountProfileCard />
            <div className="stats-grid">
            <div className="stat-card"><Users size={20} /><strong>{stats.users}</strong><span>Total Users</span></div>
            <div className="stat-card"><Check size={20} /><strong>{stats.providers}</strong><span>Approved Providers</span></div>
            <div className="stat-card"><BarChart3 size={20} /><strong>{stats.pending}</strong><span>Pending Approval</span></div>
            <div className="stat-card"><FolderOpen size={20} /><strong>{stats.enquiries}</strong><span>Total Enquiries</span></div>
            </div>
          </div>
        )}

        {tab === 'providers' && (
          <div>
            {pendingProviders.length > 0 && (
              <>
                <h3 className="dashboard-subtitle">Pending Approval</h3>
                <div className="admin-list">
                  {pendingProviders.map((p) => (
                    <div key={p.id} className="admin-row">
                      <div>
                        <strong>{p.business_name}</strong>
                        <span>{p.location}</span>
                      </div>
                      <div className="admin-actions">
                        <Button size="sm" onClick={() => updateProviderStatus(p.id, 'approved')}>
                          <Check size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateProviderStatus(p.id, 'rejected')}>
                          <X size={14} /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h3 className="dashboard-subtitle">All Providers</h3>
            <div className="admin-list">
              {allProviders.map((p) => (
                <div key={p.id} className="admin-row">
                  <div>
                    <strong>{p.business_name}</strong>
                    <span className={`status-badge status-badge--${p.status}`}>{p.status}</span>
                  </div>
                  {p.status !== 'approved' && p.status !== 'rejected' && (
                    <div className="admin-actions">
                      <Button size="sm" onClick={() => updateProviderStatus(p.id, 'approved')}>Approve</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-list">
            {users.map((u) => (
              <div key={u.id} className="admin-row">
                <div className="admin-row__identity">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="admin-row__avatar" />
                  ) : (
                    <div className="admin-row__avatar admin-row__avatar--placeholder" aria-hidden="true">
                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong>{u.full_name || 'Unnamed'}</strong>
                    <span>{u.email}</span>
                  </div>
                </div>
                <span className="status-badge">{u.role}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="enquiry-list">
            {contactMessages.length > 0 ? contactMessages.map((m) => (
              <div key={m.id} className="enquiry-detail">
                <div className="enquiry-detail__header">
                  <strong>{m.full_name}</strong>
                  <span className={`status-badge status-badge--${m.status}`}>{m.status}</span>
                </div>
                <p className="enquiry-detail__from">
                  <Mail size={14} /> {m.email}
                  {m.phone && <> · {m.phone}</>}
                </p>
                <p className="enquiry-detail__msg">{m.message}</p>
                {m.status === 'new' && (
                  <div className="enquiry-actions">
                    <Button size="sm" onClick={() => updateContactStatus(m.id, 'read')}>Mark Read</Button>
                    <Button size="sm" variant="secondary" onClick={() => updateContactStatus(m.id, 'replied')}>Mark Replied</Button>
                  </div>
                )}
              </div>
            )) : (
              <p className="dashboard-empty">No contact messages yet.</p>
            )}
          </div>
        )}

        {tab === 'categories' && (
          <div className="dashboard-form">
            <h3>Existing Categories</h3>
            <div className="admin-list">
              {categories.map((c) => (
                <div key={c.id} className="admin-row">
                  <div><strong>{c.name}</strong><span>{c.slug}</span></div>
                  <Button size="sm" variant="ghost" onClick={() => deleteCategory(c.id)}>Delete</Button>
                </div>
              ))}
            </div>
            <h3>Add Category</h3>
            <Input
              label="Name"
              value={newCategory.name}
              onChange={(e) => {
                const name = e.target.value
                setNewCategory((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug ? prev.slug : slugify(name),
                }))
                setCategoryErrors((prev) => clearFieldError(prev, 'name'))
              }}
              hint={FIELD_HINTS.categoryName}
              error={categoryErrors.name}
            />
            <Input
              label="Slug"
              value={newCategory.slug}
              onChange={(e) => {
                setNewCategory({ ...newCategory, slug: sanitizeSlug(e.target.value) })
                setCategoryErrors((prev) => clearFieldError(prev, 'slug'))
              }}
              hint={FIELD_HINTS.categorySlug}
              error={categoryErrors.slug}
            />
            <Textarea
              label="Description (optional)"
              rows={2}
              value={newCategory.description}
              onChange={(e) => {
                setNewCategory({ ...newCategory, description: e.target.value })
                setCategoryErrors((prev) => clearFieldError(prev, 'description'))
              }}
              hint={FIELD_HINTS.categoryDescription}
              error={categoryErrors.description}
            />
            {formError && tab === 'categories' && <p className="upload-error" role="alert">{formError}</p>}
            <Button onClick={addCategory}>Add Category</Button>
          </div>
        )}

        {tab === 'testimonials' && (
          <div className="dashboard-form">
            <h3>Client Testimonials</h3>
            <div className="admin-list">
              {testimonials.map((t) => (
                <div key={t.id} className="admin-row">
                  <div>
                    <strong>{t.client_name}</strong>
                    <span>{t.content.slice(0, 80)}…</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toggleTestimonial(t.id, !t.approved)}>
                    {t.approved ? 'Hide' : 'Show'}
                  </Button>
                </div>
              ))}
            </div>
            <h3>Add Testimonial</h3>
            <Input
              label="Client Name"
              value={newTestimonial.client_name}
              onChange={(e) => {
                setNewTestimonial({ ...newTestimonial, client_name: sanitizePersonName(e.target.value) })
                setTestimonialErrors((prev) => clearFieldError(prev, 'client_name'))
              }}
              hint={FIELD_HINTS.clientName}
              error={testimonialErrors.client_name}
            />
            <Input
              label="Service Type (optional)"
              value={newTestimonial.service_type}
              onChange={(e) => {
                setNewTestimonial({ ...newTestimonial, service_type: e.target.value })
                setTestimonialErrors((prev) => clearFieldError(prev, 'service_type'))
              }}
              hint={FIELD_HINTS.serviceType}
              error={testimonialErrors.service_type}
            />
            <Textarea
              label="Content"
              rows={3}
              value={newTestimonial.content}
              onChange={(e) => {
                setNewTestimonial({ ...newTestimonial, content: e.target.value })
                setTestimonialErrors((prev) => clearFieldError(prev, 'content'))
              }}
              hint={FIELD_HINTS.testimonialContent}
              error={testimonialErrors.content}
            />
            {formError && tab === 'testimonials' && <p className="upload-error" role="alert">{formError}</p>}
            <Button onClick={addTestimonial}>Add Testimonial</Button>
          </div>
        )}
      </div>
    </div>
  )
}
