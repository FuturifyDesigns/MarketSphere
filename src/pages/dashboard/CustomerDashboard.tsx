import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowRight, Heart, MessageSquare, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { ProviderCard } from '../../components/ui/ProviderCard'
import { Button } from '../../components/ui/Button'
import { AccountProfileCard } from '../../components/dashboard/AccountProfileCard'
import { RoleOnboarding, type RoleOnboardingHandle } from '../../components/onboarding/RoleOnboarding'
import { DashboardTutorialButton } from '../../components/dashboard/DashboardTutorialButton'
import { formatStatusLabel } from '../../lib/validation'
import type { Enquiry, Provider } from '../../lib/types'
import './Dashboard.css'

export function CustomerDashboard() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const { showToast } = useToast()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [favorites, setFavorites] = useState<Provider[]>([])

  const loadDashboardData = useCallback(async () => {
    if (!user) return

    const [enquiriesRes, favoritesRes] = await Promise.all([
      supabase
        .from('enquiries')
        .select('*, providers(business_name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('favorites')
        .select('providers(*)')
        .eq('customer_id', user.id),
    ])

    setEnquiries(enquiriesRes.data || [])
    setFavorites(
      (favoritesRes.data || [])
        .map((favorite) => favorite.providers as unknown as Provider)
        .filter(Boolean),
    )
  }, [user])

  const loadDashboardDataRef = useRef(loadDashboardData)
  loadDashboardDataRef.current = loadDashboardData

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    if (!user) return

    let timer: number | undefined
    const scheduleRefresh = (message?: string) => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        timer = undefined
        void loadDashboardDataRef.current()
        if (message) showToast(message, 'info')
      }, 300)
    }

    const channel = supabase
      .channel(`customer-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enquiries', filter: `customer_id=eq.${user.id}` },
        () => scheduleRefresh(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'enquiries', filter: `customer_id=eq.${user.id}` },
        () => scheduleRefresh('Enquiry status updated.'),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'enquiries', filter: `customer_id=eq.${user.id}` },
        () => scheduleRefresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'favorites', filter: `customer_id=eq.${user.id}` },
        () => scheduleRefresh(),
      )
      .subscribe()

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadDashboardDataRef.current()
      }
    }, 20_000)

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
      window.clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [showToast, user])

  useEffect(() => {
    const highlight = (location.state as { enquirySent?: boolean } | null)?.enquirySent
    if (highlight) {
      showToast('Your enquiry is in your dashboard. The provider has been notified.', 'success')
    }
  }, [location.state, showToast])

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'there'
  const onboardingRef = useRef<RoleOnboardingHandle>(null)

  return (
    <div className="dashboard customer-dashboard">
      <RoleOnboarding ref={onboardingRef} role="customer" />
      <div className="container">
        <header className="customer-dashboard__hero">
          <div>
            <span className="customer-dashboard__eyebrow">Customer dashboard</span>
            <h1>Welcome back, {firstName}</h1>
            <p>Track your enquiries, manage your profile, and revisit saved providers.</p>
            <DashboardTutorialButton onClick={() => onboardingRef.current?.replay()} />
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
          <div data-onboarding="customer-profile">
            <AccountProfileCard />
          </div>

          <div className="customer-dashboard__panels">
            <section className="dashboard-panel" data-onboarding="customer-enquiries">
              <div className="dashboard-panel__header">
                <h2><MessageSquare size={20} /> My Enquiries</h2>
                <span data-onboarding="customer-browse">
                  <Button to="/browse" variant="ghost" size="sm">
                    Browse providers <ArrowRight size={14} />
                  </Button>
                </span>
              </div>
              {enquiries.length > 0 ? (
                <div className="enquiry-list">
                  {enquiries.map((enquiry) => (
                    <div key={enquiry.id} className="enquiry-item">
                      <div>
                        <strong>{enquiry.subject}</strong>
                        <span className="enquiry-provider">
                          to {(enquiry.providers as { business_name: string })?.business_name}
                        </span>
                        <p className="enquiry-item__message">{enquiry.message}</p>
                      </div>
                      <span className={`status-badge status-badge--${enquiry.status}`}>
                        {formatStatusLabel(enquiry.status)}
                      </span>
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

            <section className="dashboard-panel" data-onboarding="customer-favorites">
              <div className="dashboard-panel__header">
                <h2><Heart size={20} /> Saved Providers</h2>
                <Button to="/browse" variant="ghost" size="sm">
                  Find more <ArrowRight size={14} />
                </Button>
              </div>
              {favorites.length > 0 ? (
                <div className="providers-grid">
                  {favorites.map((provider, index) => (
                    <ProviderCard key={provider.id} provider={provider} index={index} />
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
