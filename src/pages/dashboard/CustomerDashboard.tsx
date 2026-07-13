import { useEffect, useState } from 'react'
import { ArrowRight, Heart, MessageSquare, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { ProviderCard } from '../../components/ui/ProviderCard'
import { Button } from '../../components/ui/Button'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import type { Enquiry, Provider } from '../../lib/types'
import './Dashboard.css'

export function CustomerDashboard() {
  const { user, profile } = useAuth()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [favorites, setFavorites] = useState<Provider[]>([])

  useEffect(() => {
    if (!user) return

    supabase
      .from('enquiries')
      .select('*, providers(business_name)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setEnquiries(data || []))

    supabase
      .from('favorites')
      .select('providers(*)')
      .eq('customer_id', user.id)
      .then(({ data }) => {
        setFavorites(
          (data || [])
            .map((f) => f.providers as unknown as Provider)
            .filter(Boolean)
        )
      })
  }, [user])

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there'

  return (
    <div className="dashboard customer-dashboard">
      <div className="container">
        <header className="customer-dashboard__hero">
          <div>
            <span className="customer-dashboard__eyebrow">Customer dashboard</span>
            <h1>Welcome back, {firstName}</h1>
            <p>Track your enquiries, manage your profile, and revisit saved providers.</p>
          </div>
          <div className="customer-dashboard__stats">
            <div className="customer-dashboard__stat">
              <MessageSquare size={18} />
              <strong>{enquiries.length}</strong>
              <span>Enquiries</span>
            </div>
            <div className="customer-dashboard__stat">
              <Heart size={18} />
              <strong>{favorites.length}</strong>
              <span>Saved</span>
            </div>
          </div>
        </header>

        <div className="customer-dashboard__layout">
          <AccountProfileCard />

          <div className="customer-dashboard__panels">
            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2><MessageSquare size={20} /> My Enquiries</h2>
                <Button to="/browse" variant="ghost" size="sm">
                  Browse providers <ArrowRight size={14} />
                </Button>
              </div>
              {enquiries.length > 0 ? (
                <div className="enquiry-list">
                  {enquiries.map((e) => (
                    <div key={e.id} className="enquiry-item">
                      <div>
                        <strong>{e.subject}</strong>
                        <span className="enquiry-provider">
                          to {(e.providers as { business_name: string })?.business_name}
                        </span>
                      </div>
                      <span className={`status-badge status-badge--${e.status}`}>{e.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <MessageSquare size={28} />
                  <p>No enquiries yet</p>
                  <span>Find a provider and send your first message.</span>
                  <Button to="/browse" size="sm">
                    Browse providers <Search size={14} />
                  </Button>
                </div>
              )}
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel__header">
                <h2><Heart size={20} /> Saved Providers</h2>
                <Button to="/browse" variant="ghost" size="sm">
                  Find more <ArrowRight size={14} />
                </Button>
              </div>
              {favorites.length > 0 ? (
                <div className="providers-grid">
                  {favorites.map((p, i) => (
                    <ProviderCard key={p.id} provider={p} index={i} />
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <Heart size={28} />
                  <p>No saved providers yet</p>
                  <span>Save favourites while browsing to find them quickly here.</span>
                  <Button to="/browse" size="sm">
                    Find providers <Search size={14} />
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
