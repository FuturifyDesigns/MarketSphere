import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageSquare } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { ProviderCard } from '../../components/ui/ProviderCard'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import type { Enquiry, Provider } from '../../lib/types'
import './Dashboard.css'

export function CustomerDashboard() {
  const { user } = useAuth()
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

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <p>Manage your enquiries and saved providers</p>
        </div>

        <div className="dashboard-grid">
          <AccountProfileCard />

          <section className="dashboard-section">
            <h2><MessageSquare size={18} /> My Enquiries</h2>
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
              <p className="dashboard-empty">
                No enquiries yet. <Link to="/browse">Browse providers</Link> to get started.
              </p>
            )}
          </section>

          <section className="dashboard-section">
            <h2><Heart size={18} /> Saved Providers</h2>
            {favorites.length > 0 ? (
              <div className="providers-grid">
                {favorites.map((p, i) => (
                  <ProviderCard key={p.id} provider={p} index={i} />
                ))}
              </div>
            ) : (
              <p className="dashboard-empty">
                No saved providers. <Link to="/browse">Find providers</Link> to save your favourites.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
