import { useEffect, useState } from 'react'
import { Inbox, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, uploadFile } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Category, Enquiry, Provider, ProviderService } from '../../lib/types'
import './Dashboard.css'

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
    setSaving(true)
    if (provider) {
      await supabase.from('providers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', provider.id)
    } else {
      const { data } = await supabase
        .from('providers')
        .insert({ ...form, user_id: user.id })
        .select()
        .single()
      setProvider(data)
    }
    setSaving(false)
    refreshProfile()
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !provider) return
    const url = await uploadFile('provider-logos', `${provider.id}/logo`, file)
    if (url) {
      await supabase.from('providers').update({ logo_url: url }).eq('id', provider.id)
      setProvider({ ...provider, logo_url: url })
    }
  }

  const addService = async () => {
    if (!provider || !newService.title) return
    const { data } = await supabase
      .from('provider_services')
      .insert({
        provider_id: provider.id,
        title: newService.title,
        description: newService.description,
        category_id: newService.category_id || null,
      })
      .select('*, categories(*)')
      .single()
    if (data) {
      setProvider({
        ...provider,
        provider_services: [...(provider.provider_services || []), data],
      })
      setNewService({ title: '', description: '', category_id: '' })
    }
  }

  const updateEnquiryStatus = async (id: string, status: string) => {
    await supabase.from('enquiries').update({ status }).eq('id', id)
    setEnquiries(enquiries.map((e) => (e.id === id ? { ...e, status: status as Enquiry['status'] } : e)))
  }

  const statusLabel = provider?.status || 'not_created'

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
          <div className="dashboard-form">
            {provider?.logo_url && (
              <img src={provider.logo_url} alt="" className="dashboard-logo-preview" />
            )}
            <div className="input-group">
              <label>Business Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={!provider} />
              {!provider && <small>Save your profile first to upload a logo</small>}
            </div>
            <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
            <div className="input-group">
              <label htmlFor="desc">Description</label>
              <textarea id="desc" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input label="Contact Email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <Input label="Contact Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : provider ? 'Update Profile' : 'Submit for Approval'}
            </Button>
            {statusLabel === 'pending' && (
              <p className="dashboard-note">Your profile is pending admin approval.</p>
            )}
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
                <Input label="Service Title" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} />
                <div className="input-group">
                  <label>Category</label>
                  <select value={newService.category_id} onChange={(e) => setNewService({ ...newService, category_id: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="svc-desc">Description</label>
                  <textarea id="svc-desc" className="input-field" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} rows={2} />
                </div>
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
