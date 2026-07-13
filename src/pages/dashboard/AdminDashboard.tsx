import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  FolderOpen,
  Inbox,
  LayoutGrid,
  Mail,
  MessageSquare,
  Quote,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  formatStatusLabel,
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
import type { Category, ContactMessage, Enquiry, Profile, Provider, Testimonial } from '../../lib/types'
import './Dashboard.css'

type CategoryFields = 'name' | 'slug' | 'description'
type TestimonialFields = 'client_name' | 'service_type' | 'content'
type AdminTab = 'overview' | 'providers' | 'users' | 'enquiries' | 'contacts' | 'categories' | 'testimonials'

type AdminStats = {
  users: number
  providers: number
  enquiries: number
  contacts: number
  suspended: number
}

function computeStats(
  users: Profile[],
  providers: Provider[],
  enquiries: Enquiry[],
  contacts: ContactMessage[],
): AdminStats {
  return {
    users: users.length,
    providers: providers.filter((provider) => provider.status === 'approved').length,
    enquiries: enquiries.length,
    contacts: contacts.filter((message) => message.status === 'new').length,
    suspended: providers.filter((provider) => provider.status === 'rejected').length,
  }
}

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: typeof Users }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'providers', label: 'Providers', icon: Shield },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
  { id: 'contacts', label: 'Contacts', icon: Mail },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'testimonials', label: 'Testimonials', icon: Quote },
]

export function AdminDashboard() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [tab, setTab] = useState<AdminTab>('overview')
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' })
  const [newTestimonial, setNewTestimonial] = useState({ client_name: '', content: '', service_type: '' })
  const [categoryErrors, setCategoryErrors] = useState<FieldErrors<CategoryFields>>({})
  const [testimonialErrors, setTestimonialErrors] = useState<FieldErrors<TestimonialFields>>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)

  const stats = useMemo(
    () => computeStats(users, providers, enquiries, contactMessages),
    [users, providers, enquiries, contactMessages],
  )

  const loadData = useCallback(async () => {
    const [usersRes, providersRes, enquiriesRes, catsRes, testRes, contactsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('providers').select('*').order('created_at', { ascending: false }),
      supabase
        .from('enquiries')
        .select('*, providers(business_name), profiles(full_name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ])

    setUsers(usersRes.data || [])
    setProviders(providersRes.data || [])
    setEnquiries(enquiriesRes.data || [])
    setCategories(catsRes.data || [])
    setTestimonials(testRes.data || [])
    setContactMessages(contactsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonials' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => void loadData())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadData])

  const updateProviderStatus = async (id: string, status: Provider['status']) => {
    setProviders((current) =>
      current.map((provider) => (provider.id === id ? { ...provider, status } : provider)),
    )
    const { error } = await supabase.from('providers').update({ status }).eq('id', id)
    if (error) void loadData()
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

    const payload = {
      name: newCategory.name.trim(),
      slug,
      description: newCategory.description.trim() || null,
    }

    const { data, error } = await supabase.from('categories').insert(payload).select().single()
    if (error || !data) {
      setFormError('Could not add category. The slug may already exist.')
      return
    }

    setCategories((current) => [...current, data])
    setNewCategory({ name: '', slug: '', description: '' })
    setCategoryErrors({})
  }

  const deleteCategory = async (id: string) => {
    setCategories((current) => current.filter((category) => category.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) void loadData()
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

    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        client_name: newTestimonial.client_name.trim(),
        content: newTestimonial.content.trim(),
        service_type: newTestimonial.service_type.trim() || null,
        rating: 5,
        approved: true,
      })
      .select()
      .single()

    if (error || !data) {
      setFormError('Could not add testimonial. Please try again.')
      return
    }

    setTestimonials((current) => [data, ...current])
    setNewTestimonial({ client_name: '', content: '', service_type: '' })
    setTestimonialErrors({})
  }

  const toggleTestimonial = async (id: string, approved: boolean) => {
    setTestimonials((current) =>
      current.map((testimonial) => (testimonial.id === id ? { ...testimonial, approved } : testimonial)),
    )
    const { error } = await supabase.from('testimonials').update({ approved }).eq('id', id)
    if (error) void loadData()
  }

  const updateContactStatus = async (id: string, status: ContactMessage['status']) => {
    setContactMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, status } : message)),
    )
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
    if (error) void loadData()
  }

  const updateEnquiryStatus = async (id: string, status: Enquiry['status']) => {
    setEnquiries((current) =>
      current.map((enquiry) => (enquiry.id === id ? { ...enquiry, status } : enquiry)),
    )
    const { error } = await supabase.from('enquiries').update({ status }).eq('id', id)
    if (error) void loadData()
  }

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'Admin'

  return (
    <div className="dashboard admin-dashboard">
      <div className="container">
        <header className="admin-dashboard__hero">
          <div>
            <span className="admin-dashboard__eyebrow">Admin dashboard</span>
            <h1>Hello, {firstName}</h1>
            <p>Monitor platform activity, manage listings, and keep Market Sphere Group running smoothly.</p>
          </div>
          <div className="admin-dashboard__stats">
            <div className="admin-dashboard__stat">
              <Users size={18} />
              <strong>{stats.users}</strong>
              <span>Users</span>
            </div>
            <div className="admin-dashboard__stat">
              <Shield size={18} />
              <strong>{stats.providers}</strong>
              <span>Providers</span>
            </div>
            <div className="admin-dashboard__stat">
              <MessageSquare size={18} />
              <strong>{stats.enquiries}</strong>
              <span>Enquiries</span>
            </div>
            <div className="admin-dashboard__stat">
              <Inbox size={18} />
              <strong>{stats.contacts}</strong>
              <span>New contacts</span>
            </div>
          </div>
        </header>

        <div className="admin-dashboard__tabs" role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'admin-dashboard__tab--active' : ''}
              onClick={() => setTab(id)}
            >
              <Icon size={16} />
              {label}
              {id === 'contacts' && stats.contacts > 0 ? ` (${stats.contacts})` : ''}
            </button>
          ))}
        </div>

        {loading && tab === 'overview' ? (
          <p className="admin-dashboard__loading">Loading dashboard…</p>
        ) : null}

        {tab === 'overview' && (
          <div className="admin-dashboard__overview">
            <AccountProfileCard />
            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2><BarChart3 size={20} /> Platform snapshot</h2>
              </div>
              <div className="admin-dashboard__snapshot-grid">
                <div className="admin-dashboard__snapshot-card">
                  <strong>{stats.providers}</strong>
                  <span>Live providers</span>
                </div>
                <div className="admin-dashboard__snapshot-card">
                  <strong>{stats.enquiries}</strong>
                  <span>Customer enquiries</span>
                </div>
                <div className="admin-dashboard__snapshot-card">
                  <strong>{stats.contacts}</strong>
                  <span>Unread contact forms</span>
                </div>
                <div className="admin-dashboard__snapshot-card">
                  <strong>{stats.suspended}</strong>
                  <span>Suspended listings</span>
                </div>
              </div>
              <p className="admin-dashboard__live-note">Updates appear here automatically as activity happens.</p>
            </section>
          </div>
        )}

        {tab === 'providers' && (
          <section className="dashboard-panel admin-dashboard__panel">
            <div className="dashboard-panel__header">
              <h2><Shield size={20} /> Provider listings</h2>
              <span className="admin-dashboard__count">{providers.length} total</span>
            </div>
            {providers.length > 0 ? (
              <div className="admin-card-list">
                {providers.map((provider) => (
                  <article key={provider.id} className="admin-card">
                    <div className="admin-card__main">
                      {provider.logo_url ? (
                        <img src={provider.logo_url} alt="" className="admin-card__thumb" />
                      ) : (
                        <div className="admin-card__thumb admin-card__thumb--placeholder">
                          {provider.business_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong>{provider.business_name}</strong>
                        <p>{provider.location || 'No location set'}</p>
                        <span className={`status-badge status-badge--${provider.status}`}>
                          {formatStatusLabel(provider.status)}
                        </span>
                      </div>
                    </div>
                    <div className="admin-card__actions">
                      {provider.status !== 'approved' ? (
                        <Button size="sm" onClick={() => void updateProviderStatus(provider.id, 'approved')}>
                          <Check size={14} /> Activate
                        </Button>
                      ) : null}
                      {provider.status !== 'rejected' ? (
                        <Button size="sm" variant="ghost" onClick={() => void updateProviderStatus(provider.id, 'rejected')}>
                          <X size={14} /> Suspend
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <Shield size={28} />
                <p>No provider listings yet</p>
              </div>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section className="dashboard-panel admin-dashboard__panel">
            <div className="dashboard-panel__header">
              <h2><Users size={20} /> Registered users</h2>
              <span className="admin-dashboard__count">{users.length} total</span>
            </div>
            <div className="admin-card-list">
              {users.map((user) => (
                <article key={user.id} className="admin-card">
                  <div className="admin-card__main">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="admin-card__avatar" />
                    ) : (
                      <div className="admin-card__avatar admin-card__avatar--placeholder" aria-hidden="true">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{user.full_name || 'Unnamed user'}</strong>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <span className="status-badge">{formatStatusLabel(user.role)}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'enquiries' && (
          <section className="dashboard-panel admin-dashboard__panel">
            <div className="dashboard-panel__header">
              <h2><MessageSquare size={20} /> Platform enquiries</h2>
              <span className="admin-dashboard__count">{enquiries.length} total</span>
            </div>
            {enquiries.length > 0 ? (
              <div className="enquiry-list">
                {enquiries.map((enquiry) => (
                  <div key={enquiry.id} className="enquiry-detail">
                    <div className="enquiry-detail__header">
                      <strong>{enquiry.subject}</strong>
                      <span className={`status-badge status-badge--${enquiry.status}`}>
                        {formatStatusLabel(enquiry.status)}
                      </span>
                    </div>
                    <p className="enquiry-detail__from">
                      From {(enquiry.profiles as { full_name?: string; email?: string } | null)?.full_name || 'Customer'}
                      {' · '}
                      to {(enquiry.providers as { business_name?: string } | null)?.business_name || 'Provider'}
                    </p>
                    <p className="enquiry-detail__msg">{enquiry.message}</p>
                    {enquiry.status === 'new' && (
                      <div className="enquiry-actions">
                        <Button size="sm" onClick={() => void updateEnquiryStatus(enquiry.id, 'read')}>Mark read</Button>
                        <Button size="sm" variant="secondary" onClick={() => void updateEnquiryStatus(enquiry.id, 'replied')}>
                          Mark replied
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <MessageSquare size={28} />
                <p>No enquiries yet</p>
              </div>
            )}
          </section>
        )}

        {tab === 'contacts' && (
          <section className="dashboard-panel admin-dashboard__panel">
            <div className="dashboard-panel__header">
              <h2><Mail size={20} /> Contact messages</h2>
              <span className="admin-dashboard__count">{contactMessages.length} total</span>
            </div>
            {contactMessages.length > 0 ? (
              <div className="enquiry-list">
                {contactMessages.map((message) => (
                  <div key={message.id} className="enquiry-detail">
                    <div className="enquiry-detail__header">
                      <strong>{message.full_name}</strong>
                      <span className={`status-badge status-badge--${message.status}`}>
                        {formatStatusLabel(message.status)}
                      </span>
                    </div>
                    <p className="enquiry-detail__from">
                      <Mail size={14} /> {message.email}
                      {message.phone ? <> · {message.phone}</> : null}
                    </p>
                    <p className="enquiry-detail__msg">{message.message}</p>
                    {message.status === 'new' && (
                      <div className="enquiry-actions">
                        <Button size="sm" onClick={() => void updateContactStatus(message.id, 'read')}>Mark read</Button>
                        <Button size="sm" variant="secondary" onClick={() => void updateContactStatus(message.id, 'replied')}>
                          Mark replied
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <Mail size={28} />
                <p>No contact messages yet</p>
              </div>
            )}
          </section>
        )}

        {tab === 'categories' && (
          <div className="admin-dashboard__split">
            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2><FolderOpen size={20} /> Categories</h2>
                <span className="admin-dashboard__count">{categories.length} total</span>
              </div>
              <div className="admin-card-list">
                {categories.map((category) => (
                  <article key={category.id} className="admin-card">
                    <div>
                      <strong>{category.name}</strong>
                      <p>{category.slug}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => void deleteCategory(category.id)}>
                      Delete
                    </Button>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2>Add category</h2>
              </div>
              <div className="dashboard-form dashboard-form--flush">
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
                {formError && tab === 'categories' ? <p className="upload-error" role="alert">{formError}</p> : null}
                <Button onClick={() => void addCategory()}>Add category</Button>
              </div>
            </section>
          </div>
        )}

        {tab === 'testimonials' && (
          <div className="admin-dashboard__split">
            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2><Quote size={20} /> Testimonials</h2>
                <span className="admin-dashboard__count">{testimonials.length} total</span>
              </div>
              <div className="admin-card-list">
                {testimonials.map((testimonial) => (
                  <article key={testimonial.id} className="admin-card admin-card--stacked">
                    <div>
                      <strong>{testimonial.client_name}</strong>
                      <p>{testimonial.content}</p>
                      <span className={`status-badge${testimonial.approved ? ' status-badge--approved' : ''}`}>
                        {testimonial.approved ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => void toggleTestimonial(testimonial.id, !testimonial.approved)}>
                      {testimonial.approved ? 'Hide' : 'Show'}
                    </Button>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2>Add testimonial</h2>
              </div>
              <div className="dashboard-form dashboard-form--flush">
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
                {formError && tab === 'testimonials' ? <p className="upload-error" role="alert">{formError}</p> : null}
                <Button onClick={() => void addTestimonial()}>Add testimonial</Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
