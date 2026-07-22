import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isCmsEditActive } from '../lib/cmsEditMode'
import { supabase } from '../lib/supabase'
import {
  clearCached,
  debounceTrailing,
  getCached,
  readSessionJson,
  setCached,
  withSingleFlight,
  writeSessionJson,
} from '../lib/queryCache'
import {
  cloneDefaults,
  DEFAULT_SITE_CONTENT,
  normalizeStringItems,
  type SiteContentKey,
} from '../lib/siteContentDefaults'
import { COMPANY } from '../lib/constants'
import type { CmsExtraSection } from '../lib/cmsTypes'
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

const SITE_CONTENT_CACHE_KEY = 'msg-site-content-v1'
const SITE_CONTENT_TTL_MS = 5 * 60_000
const SITE_CONTENT_MEMORY_KEY = 'site_content_rows'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function deepMerge<T>(defaults: T, stored: unknown): T {
  if (stored == null) return defaults
  // Blank CMS strings should fall back to defaults so editors cannot blank the site.
  if (typeof defaults === 'string' && typeof stored === 'string') {
    return (stored.trim() === '' ? defaults : stored) as T
  }
  if (Array.isArray(stored)) {
    return (stored.length ? stored : defaults) as T
  }
  if (isPlainObject(defaults) && isPlainObject(stored)) {
    const result = { ...defaults } as Record<string, unknown>
    for (const key of Object.keys(defaults)) {
      result[key] = deepMerge(defaults[key], stored[key])
    }
    for (const key of Object.keys(stored)) {
      if (!(key in defaults)) {
        result[key] = stored[key]
      }
    }
    return result as T
  }
  return stored as T
}

function normalizeBlock(key: SiteContentKey, block: unknown) {
  const defaults = DEFAULT_SITE_CONTENT[key]
  const merged = deepMerge(defaults, block)

  if (key === 'faq') {
    const faq = merged as { items?: unknown[] }
    if (!faq.items?.length) {
      faq.items = (DEFAULT_SITE_CONTENT.faq as { items: unknown[] }).items
    }
  }

  if (key === 'services') {
    const services = merged as { items?: unknown[] }
    if (!services.items?.length) {
      services.items = (DEFAULT_SITE_CONTENT.services as { items: unknown[] }).items
    }
  }

  if (key === 'home') {
    const home = merged as {
      stats?: unknown[]
      marquee?: unknown
      providersSection?: { trustBadges?: unknown }
    }
    if (!home.stats?.length) {
      home.stats = (DEFAULT_SITE_CONTENT.home as { stats: unknown[] }).stats
    }
    home.marquee = normalizeStringItems(
      home.marquee,
      (DEFAULT_SITE_CONTENT.home as { marquee: unknown }).marquee as ReturnType<typeof normalizeStringItems>,
    )
    if (home.providersSection) {
      const defaultProviders = (DEFAULT_SITE_CONTENT.home as { providersSection: { trustBadges: unknown } }).providersSection
      home.providersSection.trustBadges = normalizeStringItems(
        home.providersSection.trustBadges,
        defaultProviders.trustBadges as ReturnType<typeof normalizeStringItems>,
      )
    }
  }

  if (key === 'about') {
    const about = merged as { tree?: Record<string, unknown> }
    const defaultTree = (DEFAULT_SITE_CONTENT.about as { tree: Record<string, unknown> }).tree
    if (!about.tree) {
      about.tree = structuredClone(defaultTree)
    } else {
      about.tree.coreValues = normalizeStringItems(about.tree.coreValues, defaultTree.coreValues as never)
      about.tree.areas = normalizeStringItems(about.tree.areas, defaultTree.areas as never)
    }
  }

  if (key === 'company') {
    const company = merged as { footer?: unknown; extraSections?: CmsExtraSection[]; phones?: unknown }
    const defaultCompany = DEFAULT_SITE_CONTENT.company as {
      footer?: unknown
      extraSections?: CmsExtraSection[]
      phones?: unknown
    }
    if (!company.footer && defaultCompany.footer) {
      company.footer = defaultCompany.footer
    }
    if (!company.extraSections) {
      company.extraSections = defaultCompany.extraSections ?? []
    }
    company.phones = normalizeStringItems(
      company.phones,
      normalizeStringItems([...COMPANY.phones], []),
    )
  }

  for (const pageKey of ['home', 'about', 'services', 'contact', 'faq', 'company'] as SiteContentKey[]) {
    if (key !== pageKey) continue
    const page = merged as { extraSections?: CmsExtraSection[] }
    if (!page.extraSections) {
      page.extraSections = []
    }
  }

  return merged
}

function mergeWithDefaults(rows: Array<{ key: string; value: unknown }>) {
  const merged = cloneDefaults()
  for (const row of rows) {
    if (row.key in merged) {
      merged[row.key as SiteContentKey] = normalizeBlock(row.key as SiteContentKey, row.value)
    }
  }

  for (const key of Object.keys(merged) as SiteContentKey[]) {
    merged[key] = normalizeBlock(key, merged[key])
  }

  return merged
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [content, setContent] = useState<SiteContentMap>(() => {
    const cached =
      getCached<SiteContentMap>(SITE_CONTENT_MEMORY_KEY) ??
      readSessionJson<SiteContentMap>(SITE_CONTENT_CACHE_KEY)
    return cached ? structuredClone(cached) : cloneDefaults()
  })
  const [loading, setLoading] = useState(() => {
    const cached =
      getCached<SiteContentMap>(SITE_CONTENT_MEMORY_KEY) ??
      readSessionJson<SiteContentMap>(SITE_CONTENT_CACHE_KEY)
    return !cached
  })

  const loadContent = useCallback(async (opts?: { force?: boolean }) => {
    const force = opts?.force === true

    if (!force) {
      const memoryHit = getCached<SiteContentMap>(SITE_CONTENT_MEMORY_KEY)
      if (memoryHit) {
        setContent(structuredClone(memoryHit))
        setLoading(false)
        return
      }
      const sessionHit = readSessionJson<SiteContentMap>(SITE_CONTENT_CACHE_KEY)
      if (sessionHit) {
        setCached(SITE_CONTENT_MEMORY_KEY, sessionHit, SITE_CONTENT_TTL_MS)
        setContent(structuredClone(sessionHit))
        setLoading(false)
        return
      }
    }

    const merged = await withSingleFlight('site_content_fetch', async () => {
      const { data, error } = await supabase.from('site_content').select('key, value')
      if (error) return cloneDefaults()
      return mergeWithDefaults(data || [])
    })

    setCached(SITE_CONTENT_MEMORY_KEY, merged, SITE_CONTENT_TTL_MS)
    writeSessionJson(SITE_CONTENT_CACHE_KEY, merged, SITE_CONTENT_TTL_MS)
    setContent(structuredClone(merged))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadContent()
  }, [loadContent])

  // Public visitors: no Realtime (protects Free Tier connection budget under load).
  // Admins: debounced realtime so live CMS stays fresh without refetch storms.
  useEffect(() => {
    if (!isAdmin) return

    const refresh = debounceTrailing(() => {
      if (isCmsEditActive()) return
      clearCached(SITE_CONTENT_MEMORY_KEY)
      void loadContent({ force: true })
    }, 750)

    const channel = supabase
      .channel('site-content-live-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_content' },
        () => refresh(),
      )
      .subscribe()

    return () => {
      refresh.cancel()
      void supabase.removeChannel(channel)
    }
  }, [isAdmin, loadContent])

  // Soft refresh when a visitor returns to the tab after cache TTL.
  useEffect(() => {
    if (isAdmin) return

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (getCached<SiteContentMap>(SITE_CONTENT_MEMORY_KEY)) return
      void loadContent({ force: true })
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isAdmin, loadContent])

  const updateBlock = useCallback(
    async (key: SiteContentKey, value: unknown) => {
      const normalized = normalizeBlock(key, value)
      setContent((current) => {
        const next = { ...current, [key]: normalized }
        setCached(SITE_CONTENT_MEMORY_KEY, next, SITE_CONTENT_TTL_MS)
        writeSessionJson(SITE_CONTENT_CACHE_KEY, next, SITE_CONTENT_TTL_MS)
        return next
      })
      if (!isAdmin) return

      const { error } = await supabase.rpc('admin_upsert_site_content', {
        content_key: key,
        content_value: normalized,
      })

      if (error) {
        clearCached(SITE_CONTENT_MEMORY_KEY)
        await loadContent({ force: true })
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
      return normalizeBlock(key, content[key] ?? cloneDefaults()[key]) as T
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
