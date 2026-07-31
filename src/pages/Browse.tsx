import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import { ProviderCard } from '../components/ui/ProviderCard'
import {
  MarketIconCategories,
  MarketIconNetwork,
  MarketIconVerified,
} from '../components/icons/MarketIcons'
import type { Provider, Category } from '../lib/types'
import { sanitizePostgrestFilter } from '../lib/safe'
import { cachedFetch, debounceTrailing } from '../lib/queryCache'
import './Browse.css'

export function Browse() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [locationDebounced, setLocationDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  const pushSearch = useMemo(
    () => debounceTrailing((value: string) => setSearchDebounced(value), 320),
    [],
  )
  const pushLocation = useMemo(
    () => debounceTrailing((value: string) => setLocationDebounced(value), 320),
    [],
  )

  useEffect(() => {
    pushSearch(search)
    return () => pushSearch.cancel()
  }, [search, pushSearch])

  useEffect(() => {
    pushLocation(location)
    return () => pushLocation.cancel()
  }, [location, pushLocation])

  useEffect(() => {
    let cancelled = false
    void cachedFetch(
      'browse:categories:v1',
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, sort_order')
          .order('sort_order')
        if (error) throw error
        return data || []
      },
      5 * 60_000,
    )
      .then((data) => {
        if (!cancelled) setCategories(data as Category[])
      })
      .catch((error) => {
        console.error('[browse] categories', error)
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')

    const safeSearch = sanitizePostgrestFilter(searchDebounced)
    const safeLocation = sanitizePostgrestFilter(locationDebounced)
    const cacheKey = `browse:providers:v2:${safeSearch}|${safeLocation}|${category}|${reloadTick}`

    void (async () => {
      try {
        const results = await cachedFetch(
          cacheKey,
          async () => {
            let query = supabase
              .from('providers')
              .select(
                category
                  ? 'id, business_name, description, location, logo_url, cover_url, gallery_urls, contact_email, contact_phone, status, ms_approved, verified_at, provider_services!inner(id, title, categories!inner(id, name, slug))'
                  : 'id, business_name, description, location, logo_url, cover_url, gallery_urls, contact_email, contact_phone, status, ms_approved, verified_at, provider_services(id, title, categories(id, name, slug))',
              )
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(48)

            if (safeSearch) {
              query = query.or(`business_name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`)
            }
            if (safeLocation) {
              query = query.ilike('location', `%${safeLocation}%`)
            }
            if (category) {
              query = query.eq('provider_services.categories.slug', category)
            }

            const { data, error } = await query
            if (error) throw error
            return data || []
          },
          30_000,
        )

        if (cancelled) return
        setProviders(results as Provider[])
        setLoading(false)
      } catch (error) {
        console.error('[browse] providers threw', error)
        if (cancelled) return
        setProviders([])
        setLoadError('Could not load providers. Please try again.')
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchDebounced, category, locationDebounced, reloadTick])

  const hasFilters = Boolean(search || category || location)
  const categoryLabel = categories.length > 0 ? `${categories.length}+ categories` : '8+ categories'

  return (
    <div className="page browse-page">
      <section className="browse-hero">
        <div className="container browse-hero__inner page-enter-hero">
          <span className="section-label">Our Network</span>
          <h1 className="display-xl">
            Discover trusted<br />
            <em className="text-gold">service providers</em>
          </h1>
          <p className="lead browse-hero__lead">
            Browse verified professionals across Botswana — from tutors and consultants
            to youth mentors and real estate experts.
          </p>
          <div className="browse-hero__stats">
            <div className="browse-stat bento-card">
              <span className="browse-stat__icon" aria-hidden="true">
                <MarketIconVerified size={22} />
              </span>
              <div>
                <strong>Verified</strong>
                <span>Every provider reviewed</span>
              </div>
            </div>
            <div className="browse-stat bento-card">
              <span className="browse-stat__icon" aria-hidden="true">
                <MarketIconNetwork size={22} />
              </span>
              <div>
                <strong>Growing</strong>
                <span>Nationwide network</span>
              </div>
            </div>
            <div className="browse-stat bento-card">
              <span className="browse-stat__icon" aria-hidden="true">
                <MarketIconCategories size={22} />
              </span>
              <div>
                <strong>{categoryLabel}</strong>
                <span>Services for every need</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section browse-section">
        <div className="container">
          <div className="browse-filters bento-card page-reveal">
            <div className="browse-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search providers"
              />
            </div>
            <div className="browse-filters__row">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <div className="browse-location-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  placeholder="Location (e.g. Gaborone)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="browse-location"
                  aria-label="Filter by location"
                />
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="browse-chips page-reveal" role="list" aria-label="Quick category filters">
              <button
                type="button"
                className={`browse-chip ${!category ? 'browse-chip--active' : ''}`}
                onClick={() => setCategory('')}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="listitem"
                  className={`browse-chip ${category === c.slug ? 'browse-chip--active' : ''}`}
                  onClick={() => setCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="browse-results-header page-reveal">
            <p>
              {loading ? 'Searching...' : (
                <>
                  <strong>{providers.length}</strong> provider{providers.length !== 1 ? 's' : ''} found
                  {hasFilters ? ' matching your filters' : ''}
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="loading-screen"><div className="loading-spinner" /></div>
          ) : loadError ? (
            <div className="browse-empty bento-card page-reveal">
              <div className="browse-empty__icon" aria-hidden="true">
                <Search size={32} />
              </div>
              <h2>Something went wrong</h2>
              <p>{loadError}</p>
              <div className="browse-empty__actions">
                <Button variant="secondary" onClick={() => setReloadTick((n) => n + 1)}>
                  Retry
                </Button>
              </div>
            </div>
          ) : providers.length > 0 ? (
            <div className="providers-grid">
              {providers.map((p, i) => (
                <ProviderCard key={p.id} provider={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="browse-empty bento-card page-reveal">
              <div className="browse-empty__icon" aria-hidden="true">
                <Search size={32} />
              </div>
              <h2>No providers found</h2>
              <p>
                {hasFilters
                  ? 'Try adjusting your search or filters to discover more professionals in our network.'
                  : 'Our provider network is growing. Be among the first to list your business with us.'}
              </p>
              <div className="browse-empty__actions">
                {hasFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => { setSearch(''); setCategory(''); setLocation('') }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button to="/register?role=provider" size="lg">
                    Become a Provider <ArrowRight size={16} />
                  </Button>
                )}
                <Button to="/contact" variant="secondary">Contact us</Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section browse-cta">
        <div className="container">
          <div className="cta-panel bento-card page-reveal">
            <span className="section-label">List Your Business</span>
            <h2 className="display-lg">Ready to join {COMPANY.shortName}?</h2>
            <p>Reach customers across Botswana with a verified provider profile on our marketplace.</p>
            <div className="cta-panel__actions">
              <Button to="/register?role=provider" size="lg">
                Get Listed <ArrowRight size={16} />
              </Button>
              <Button to="/services" variant="secondary" size="lg">Explore Services</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
