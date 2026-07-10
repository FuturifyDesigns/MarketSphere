import { useEffect, useState } from 'react'
import { BarChart3, Check, FolderOpen, Users, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Category, Profile, Provider, Testimonial } from '../../lib/types'
import './Dashboard.css'

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, providers: 0, pending: 0, enquiries: 0 })
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([])
  const [allProviders, setAllProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [tab, setTab] = useState<'overview' | 'providers' | 'users' | 'categories' | 'testimonials'>('overview')
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' })
  const [newTestimonial, setNewTestimonial] = useState({ client_name: '', content: '', service_type: '' })

  const loadData = async () => {
    const [usersRes, providersRes, pendingRes, enquiriesRes, catsRes, testRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('providers').select('*'),
      supabase.from('providers').select('*').eq('status', 'pending'),
      supabase.from('enquiries').select('id', { count: 'exact' }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
    ])

    setStats({
      users: usersRes.data?.length || 0,
      providers: providersRes.data?.filter((p) => p.status === 'approved').length || 0,
      pending: pendingRes.data?.length || 0,
      enquiries: enquiriesRes.count || 0,
    })
    setPendingProviders(pendingRes.data || [])
    setAllProviders(providersRes.data || [])
    setUsers(usersRes.data || [])
    setCategories(catsRes.data || [])
    setTestimonials(testRes.data || [])
  }

  useEffect(() => { loadData() }, [])

  const updateProviderStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('providers').update({ status }).eq('id', id)
    loadData()
  }

  const addCategory = async () => {
    if (!newCategory.name) return
    const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-')
    await supabase.from('categories').insert({ ...newCategory, slug })
    setNewCategory({ name: '', slug: '', description: '' })
    loadData()
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    loadData()
  }

  const addTestimonial = async () => {
    if (!newTestimonial.client_name || !newTestimonial.content) return
    await supabase.from('testimonials').insert({ ...newTestimonial, rating: 5, approved: true })
    setNewTestimonial({ client_name: '', content: '', service_type: '' })
    loadData()
  }

  const toggleTestimonial = async (id: string, approved: boolean) => {
    await supabase.from('testimonials').update({ approved }).eq('id', id)
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
          {(['overview', 'providers', 'users', 'categories', 'testimonials'] as const).map((t) => (
            <button key={t} className={tab === t ? 'tab--active' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="stats-grid">
            <div className="stat-card"><Users size={20} /><strong>{stats.users}</strong><span>Total Users</span></div>
            <div className="stat-card"><Check size={20} /><strong>{stats.providers}</strong><span>Approved Providers</span></div>
            <div className="stat-card"><BarChart3 size={20} /><strong>{stats.pending}</strong><span>Pending Approval</span></div>
            <div className="stat-card"><FolderOpen size={20} /><strong>{stats.enquiries}</strong><span>Total Enquiries</span></div>
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
                <div>
                  <strong>{u.full_name || 'Unnamed'}</strong>
                  <span>{u.email}</span>
                </div>
                <span className="status-badge">{u.role}</span>
              </div>
            ))}
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
            <Input label="Name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
            <Input label="Slug" value={newCategory.slug} onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })} />
            <Input label="Description" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} />
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
            <Input label="Client Name" value={newTestimonial.client_name} onChange={(e) => setNewTestimonial({ ...newTestimonial, client_name: e.target.value })} />
            <Input label="Service Type" value={newTestimonial.service_type} onChange={(e) => setNewTestimonial({ ...newTestimonial, service_type: e.target.value })} />
            <div className="input-group">
              <label htmlFor="test-content">Content</label>
              <textarea id="test-content" className="input-field" value={newTestimonial.content} onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })} rows={3} />
            </div>
            <Button onClick={addTestimonial}>Add Testimonial</Button>
          </div>
        )}
      </div>
    </div>
  )
}
