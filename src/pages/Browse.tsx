import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ProviderCard } from '../components/ui/ProviderCard'
import type { Provider, Category } from '../lib/types'
import './Browse.css'

export function Browse() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase
      .from('providers')
      .select('*, provider_services(*, categories(*))')
      .eq('status', 'approved')

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    query.then(({ data }) => {
      let results = data || []
      if (category) {
        results = results.filter((p) =>
          p.provider_services?.some((s: { categories?: { slug: string } }) => s.categories?.slug === category)
        )
      }
      setProviders(results)
      setLoading(false)
    })
  }, [search, category, location])

  return (
    <div className="page browse-page">
      <section className="page-hero">
        <div className="container page-enter-hero">
          <span className="eyebrow">Find Providers</span>
          <h1>Search verified service providers</h1>
          <p className="lead">
            Browse professionals across Botswana by category, location, or keyword.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="browse-filters">
            <div className="browse-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search providers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Location (e.g. Gaborone)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="browse-location"
            />
          </div>

          {loading ? (
            <div className="loading-screen"><div className="loading-spinner" /></div>
          ) : providers.length > 0 ? (
            <div className="providers-grid">
              {providers.map((p, i) => (
                <ProviderCard key={p.id} provider={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No providers found matching your criteria.</p>
              <p>Try adjusting your filters or check back soon as our network grows.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
