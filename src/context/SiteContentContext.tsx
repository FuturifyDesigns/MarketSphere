import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  cloneDefaults,
  DEFAULT_SITE_CONTENT,
  type SiteContentKey,
} from '../lib/siteContentDefaults'
import { setAtPath } from '../lib/siteContentUtils'
import { useAuth } from './AuthContext'

type SiteContentMap = Record<string, unknown>

type SiteContentContextValue = {
  content: SiteContentMap
  loading: boolean
  isAdmin: boolean
  getBlock: <T = unknown>(key: SiteContentKey) => T
  updateBlock: (key: SiteContentKey, value: unknown) => Promise<void>
  updateField: (key: SiteContentKey, path: string, value: unknown) => Promise<void>
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null)

function mergeWithDefaults(rows: Array<{ key: string; value: unknown }>) {
  const merged = cloneDefaults()
  for (const row of rows) {
    if (row.key in merged) {
      const defaults = merged[row.key as SiteContentKey]
      const stored = row.value
      if (
        stored &&
        typeof stored === 'object' &&
        defaults &&
        typeof defaults === 'object' &&
        !Array.isArray(stored) &&
        !Array.isArray(defaults)
      ) {
        merged[row.key as SiteContentKey] = { ...defaults, ...stored }
      } else if (Array.isArray(stored) && Array.isArray(defaults) && stored.length === 0) {
        merged[row.key as SiteContentKey] = defaults
      } else if (stored != null) {
        merged[row.key as SiteContentKey] = stored
      }
    }
  }

  const faq = merged.faq as { items?: unknown[] }
  if (!faq.items?.length) {
    faq.items = (DEFAULT_SITE_CONTENT.faq as { items: unknown[] }).items
  }

  const services = merged.services as { items?: unknown[] }
  if (!services.items?.length) {
    services.items = (DEFAULT_SITE_CONTENT.services as { items: unknown[] }).items
  }

  const home = merged.home as { stats?: unknown[] }
  if (!home.stats?.length) {
    home.stats = (DEFAULT_SITE_CONTENT.home as { stats: unknown[] }).stats
  }

  const company = merged.company as { footer?: unknown }
  const defaultCompany = DEFAULT_SITE_CONTENT.company as { footer?: unknown }
  if (!company.footer && defaultCompany.footer) {
    company.footer = defaultCompany.footer
  }

  return merged
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [content, setContent] = useState<SiteContentMap>(() => cloneDefaults())
  const [loading, setLoading] = useState(true)
  const isAdmin = profile?.role === 'admin'

  const loadContent = useCallback(async () => {
    const { data, error } = await supabase.from('site_content').select('key, value')
    if (error) {
      setContent(cloneDefaults())
      setLoading(false)
      return
    }
    setContent(mergeWithDefaults(data || []))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadContent()
  }, [loadContent])

  useEffect(() => {
    const channel = supabase
      .channel('site-content-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_content' },
        () => {
          void loadContent()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadContent])

  const updateBlock = useCallback(
    async (key: SiteContentKey, value: unknown) => {
      setContent((current) => ({ ...current, [key]: value }))
      if (!isAdmin) return

      const { error } = await supabase.rpc('admin_upsert_site_content', {
        content_key: key,
        content_value: value,
      })

      if (error) {
        await loadContent()
        throw error
      }
    },
    [isAdmin, loadContent],
  )

  const updateField = useCallback(
    async (key: SiteContentKey, path: string, value: unknown) => {
      const current = content[key] ?? cloneDefaults()[key]
      const next = setAtPath(
        structuredClone(current) as Record<string, unknown>,
        path,
        value,
      )
      await updateBlock(key, next)
    },
    [content, updateBlock],
  )

  const getBlock = useCallback(
    <T,>(key: SiteContentKey): T => {
      return (content[key] ?? cloneDefaults()[key]) as T
    },
    [content],
  )

  const value = useMemo(
    () => ({
      content,
      loading,
      isAdmin,
      getBlock,
      updateBlock,
      updateField,
    }),
    [content, loading, isAdmin, getBlock, updateBlock, updateField],
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }
  return context
}
