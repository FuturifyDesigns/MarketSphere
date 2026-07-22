import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BarChart3,
  Check,
  FolderOpen,
  Inbox,
  LayoutGrid,
  Mail,
  MessageSquare,
  Pencil,
  Quote,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { banUser, deleteUser, unbanUser } from '../../lib/adminUsers'
import { isProfileBanned } from '../../lib/accountGuard'
import { supabase } from '../../lib/supabase'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { SiteContentPanel } from '../../components/admin/SiteContentPanel'
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
type AdminTab = 'overview' | 'providers' | 'users' | 'enquiries' | 'contacts' | 'categories' | 'testimonials' | 'site-content'

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
  { id: 'site-content', label: 'Site Content', icon: Pencil },
]

export function AdminDashboard() {
  const { profile, user } = useAuth()
  const location = useLocation()
  const { showToast } = useToast()
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
  const [banTarget, setBanTarget] = useState<Profile | null>(null)
  const [banReason, setBanReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [userActionLoading, setUserActionLoading] = useState(false)

  const stats = useMemo(
    () => computeStats(users, providers, enquiries, contactMessages),
    [users, providers, enquiries, contactMessages],
  )

  /** Actionable counts shown as live badges on tabs. */
  const tabBadges = useMemo((): Partial<Record<AdminTab, number>> => {
    const pendingProviders = providers.filter((provider) => provider.status === 'pending').length
    const newEnquiries = enquiries.filter((enquiry) => enquiry.status === 'new').length
    const newContacts = contactMessages.filter((message) => message.status === 'new').length
    const pendingTestimonials = testimonials.filter((item) => !item.approved).length

    return {
      overview: pendingProviders + newEnquiries + newContacts + pendingTestimonials,
      providers: pendingProviders,
      enquiries: newEnquiries,
      contacts: newContacts,
      testimonials: pendingTestimonials,
    }
  }, [providers, enquiries, contactMessages, testimonials])

  const loadData = useCallback(async () => {
    const [usersRes, providersRes, enquiriesRes, catsRes, testRes, contactsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('providers').select('*').order('created_at', { ascending: false }).limit(200),
      supabase
        .from('enquiries')
        .select('*, providers(business_name), profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200),
    ])

    const nextContacts = contactsRes.data || []
    setUsers(usersRes.data || [])
    setProviders(providersRes.data || [])
    setEnquiries(enquiriesRes.data || [])
    setCategories(catsRes.data || [])
    setTestimonials(testRes.data || [])
    setContactMessages(nextContacts)
    setLoading(false)
    contactCountRef.current = nextContacts.length
    return nextContacts.length
  }, [])

  const loadDataRef = useRef(loadData)
  loadDataRef.current = loadData
  const contactCountRef = useRef(0)

  useEffect(() => {
    void loadData()

    let timer: number | undefined
    const scheduleRefresh = (opts?: { toastNewContact?: boolean }) => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = undefined
        const previousCount = contactCountRef.current
        void loadDataRef.current().then((nextCount) => {
          if (opts?.toastNewContact && nextCount > previousCount) {
            showToast('New contact message received.', 'info')
          }
        })
      }, 350)
    }

    const channel = supabase
      .channel(`admin-dashboard-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'providers' }, () => {
        scheduleRefresh()
        showToast('New provider application received.', 'info')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'providers' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'providers' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enquiries' }, () => {
        scheduleRefresh()
        showToast('New enquiry received.', 'info')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'enquiries' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'enquiries' }, () => scheduleRefresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'testimonials' }, () => {
        scheduleRefresh()
        showToast('New testimonial waiting for review.', 'info')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'testimonials' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'testimonials' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, () => {
        scheduleRefresh({ toastNewContact: true })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contact_messages' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contact_messages' }, () => scheduleRefresh())
      .subscribe()

    // Fallback poll while the admin tab is open (covers missed realtime events).
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadDataRef.current()
      }
    }, 20_000)

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      window.clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [loadData, showToast])

  useEffect(() => {
    const nextTab = (location.state as { tab?: AdminTab } | null)?.tab
    if (nextTab) setTab(nextTab)
  }, [location.state])

  const confirmBanUser = async () => {
    if (!banTarget) return
    if (!banReason.trim()) {
      showToast('Add a ban reason so the user knows why they were suspended.', 'error')
      return
    }

    setUserActionLoading(true)
    const { error } = await banUser(banTarget.id, banReason.trim())
    setUserActionLoading(false)

    if (error) {
      showToast(error.message || 'Could not ban user.', 'error')
      return
    }

    showToast(`${banTarget.full_name || banTarget.email} has been banned.`)
    setBanTarget(null)
    setBanReason('')
    void loadData()
  }

  const handleUnbanUser = async (target: Profile) => {
    setUserActionLoading(true)
    const { error } = await unbanUser(target.id)
    setUserActionLoading(false)

    if (error) {
      showToast(error.message || 'Could not lift ban.', 'error')
      return
    }

    showToast(`${target.full_name || target.email} can sign in again.`)
    void loadData()
  }

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return

    setUserActionLoading(true)
    const { error } = await deleteUser(deleteTarget.id)
    setUserActionLoading(false)

    if (error) {
      showToast(error.message || 'Could not delete user.', 'error')
      return
    }

    showToast(`${deleteTarget.full_name || deleteTarget.email} was deleted.`)
    setDeleteTarget(null)
    void loadData()
  }

  const updateProviderStatus = async (id: string, status: Provider['status']) => {
    setProviders((current) =>
      current.map((provider) => (provider.id === id ? { ...provider, status } : provider)),
    )
    const { error } = await supabase.from('providers').update({ status }).eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not update provider status.', 'error')
      return
    }
    showToast(status === 'approved' ? 'Provider activated.' : 'Provider suspended.')
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
      showToast('Could not add category.', 'error')
      return
    }

    setCategories((current) => [...current, data])
    setNewCategory({ name: '', slug: '', description: '' })
    setCategoryErrors({})
    showToast('Category added.')
  }

  const deleteCategory = async (id: string) => {
    setCategories((current) => current.filter((category) => category.id !== id))
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not delete category.', 'error')
      return
    }
    showToast('Category deleted.')
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
      showToast('Could not add testimonial.', 'error')
      return
    }

    setTestimonials((current) => [data, ...current])
    setNewTestimonial({ client_name: '', content: '', service_type: '' })
    setTestimonialErrors({})
    showToast('Testimonial added.')
  }

  const toggleTestimonial = async (id: string, approved: boolean) => {
    setTestimonials((current) =>
      current.map((testimonial) => (testimonial.id === id ? { ...testimonial, approved } : testimonial)),
    )
    const { error } = await supabase.from('testimonials').update({ approved }).eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not update testimonial.', 'error')
      return
    }
    showToast(approved ? 'Testimonial approved and now live.' : 'Testimonial removed from the site.')
  }

  const deleteTestimonial = async (id: string) => {
    setTestimonials((current) => current.filter((testimonial) => testimonial.id !== id))
    const { error } = await supabase.from('testimonials').delete().eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not delete testimonial.', 'error')
      return
    }
    showToast('Testimonial deleted.')
  }

  const updateContactStatus = async (id: string, status: ContactMessage['status']) => {
    setContactMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, status } : message)),
    )
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not update contact message.', 'error')
      return
    }
    showToast(status === 'read' ? 'Contact message marked as read.' : 'Contact message marked as replied.')
  }

  const updateEnquiryStatus = async (id: string, status: Enquiry['status']) => {
    setEnquiries((current) =>
      current.map((enquiry) => (enquiry.id === id ? { ...enquiry, status } : enquiry)),
    )
    const { error } = await supabase.from('enquiries').update({ status }).eq('id', id)
    if (error) {
      void loadData()
      showToast('Could not update enquiry.', 'error')
      return
    }
    showToast(status === 'read' ? 'Enquiry marked as read.' : 'Enquiry marked as replied.')
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
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => {
            const badge = tabBadges[id] ?? 0
            const badgeLabel =
              badge > 0
                ? `${badge > 99 ? '99+' : badge} awaiting attention`
                : undefined

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-label={badgeLabel ? `${label}, ${badgeLabel}` : label}
                className={tab === id ? 'admin-dashboard__tab--active' : ''}
                onClick={() => setTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
                {badge > 0 ? (
                  <span className="admin-dashboard__tab-badge" aria-hidden="true">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </button>
            )
          })}
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
                          {(provider.business_name?.trim()?.charAt(0) || '?').toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong>{provider.business_name?.trim() || 'Unnamed provider'}</strong>
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
              {users.map((account) => (
                <article key={account.id} className="admin-card">
                  <div className="admin-card__main">
                    {account.avatar_url ? (
                      <img src={account.avatar_url} alt="" className="admin-card__avatar" />
                    ) : (
                      <div className="admin-card__avatar admin-card__avatar--placeholder" aria-hidden="true">
                        {(account.full_name || account.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong>{account.full_name || 'Unnamed user'}</strong>
                      <p>{account.email}</p>
                      <div className="admin-card__badges">
                        <span className="status-badge">{formatStatusLabel(account.role)}</span>
                        {isProfileBanned(account) ? (
                          <span className="status-badge status-badge--rejected">Banned</span>
                        ) : null}
                      </div>
                      {isProfileBanned(account) && account.ban_reason ? (
                        <p className="admin-card__note">{account.ban_reason}</p>
                      ) : null}
                    </div>
                  </div>
                  {account.id !== user?.id ? (
                    <div className="admin-card__actions">
                      {isProfileBanned(account) ? (
                        <Button size="sm" onClick={() => void handleUnbanUser(account)} disabled={userActionLoading}>
                          Lift ban
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setBanTarget(account); setBanReason('') }}>
                          Ban user
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(account)} disabled={userActionLoading}>
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="admin-card__note">This is your account</span>
                  )}
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
                    <div className="enquiry-actions">
                      <a
                        className="btn btn--primary btn--sm"
                        href={`mailto:${message.email}?subject=${encodeURIComponent('Re: your message to Market Sphere Group')}&body=${encodeURIComponent(`Hi ${message.full_name},\n\nThanks for contacting Market Sphere Group.\n\nRegarding your message:\n"${message.message}"\n\n`)}`}
                      >
                        Reply to email
                      </a>
                      {message.status === 'new' ? (
                        <Button size="sm" variant="secondary" onClick={() => void updateContactStatus(message.id, 'read')}>
                          Mark read
                        </Button>
                      ) : null}
                      {message.status !== 'replied' && message.status !== 'closed' ? (
                        <Button size="sm" variant="secondary" onClick={() => void updateContactStatus(message.id, 'replied')}>
                          Mark replied
                        </Button>
                      ) : null}
                    </div>
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

        {tab === 'site-content' && <SiteContentPanel />}

        {tab === 'testimonials' && (
          <div className="admin-dashboard__split">
            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2><Quote size={20} /> Testimonials</h2>
                <span className="admin-dashboard__count">
                  {testimonials.filter((t) => !t.approved).length} pending · {testimonials.length} total
                </span>
              </div>
              <div className="admin-card-list">
                {[...testimonials]
                  .sort((a, b) => Number(a.approved) - Number(b.approved))
                  .map((testimonial) => (
                  <article key={testimonial.id} className="admin-card admin-card--stacked">
                    <div>
                      <strong>{testimonial.client_name}</strong>
                      {testimonial.service_type ? <p className="admin-card__meta">{testimonial.service_type}</p> : null}
                      <p>{testimonial.content}</p>
                      <span className={`status-badge${testimonial.approved ? ' status-badge--approved' : ' status-badge--pending'}`}>
                        {testimonial.approved ? 'Live on site' : 'Pending review'}
                      </span>
                    </div>
                    <div className="admin-card__actions">
                      <Button size="sm" variant={testimonial.approved ? 'ghost' : 'primary'} onClick={() => void toggleTestimonial(testimonial.id, !testimonial.approved)}>
                        {testimonial.approved ? 'Unpublish' : 'Approve'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void deleteTestimonial(testimonial.id)}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </article>
                ))}
                {testimonials.length === 0 ? (
                  <p className="admin-dashboard__empty">No testimonials yet. Public submissions will appear here for review.</p>
                ) : null}
              </div>
            </section>

            <section className="dashboard-panel admin-dashboard__panel">
              <div className="dashboard-panel__header">
                <h2>Publish directly</h2>
              </div>
              <p className="admin-dashboard__hint">
                Add a testimonial as an admin — it goes live immediately. Public submissions still require Approve.
              </p>
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
                <Button onClick={() => void addTestimonial()}>Publish testimonial</Button>
              </div>
            </section>
          </div>
        )}
      </div>

      {banTarget ? (
        <div className="modal-overlay" onClick={() => setBanTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Ban {banTarget.full_name || banTarget.email}</h2>
            <p className="admin-modal__copy">The user will be signed out immediately and cannot log in until the ban is lifted.</p>
            <Textarea
              label="Reason shown to the user"
              rows={4}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              hint="Explain why this account is being suspended."
            />
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setBanTarget(null)}>Cancel</Button>
              <Button onClick={() => void confirmBanUser()} disabled={userActionLoading}>
                {userActionLoading ? 'Banning…' : 'Confirm ban'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete {deleteTarget.full_name || deleteTarget.email}</h2>
            <p className="admin-modal__copy">
              This permanently removes the account and signs the user out if they are currently active.
            </p>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button onClick={() => void confirmDeleteUser()} disabled={userActionLoading}>
                {userActionLoading ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
