/** Resolve CMS image/video paths (relative public paths or allowlisted HTTPS URLs). */

/** Old CMS / content paths that 404 after asset renames. */
const LEGACY_ASSET_PATHS: Record<string, string> = {
  'images/services/youth.jpg': 'services/youth-empowerment.webp',
  '/images/services/youth.jpg': 'services/youth-empowerment.webp',
  'services/youth.jpg': 'services/youth-empowerment.webp',
  'images/services/youth.webp': 'services/youth-empowerment.webp',
  'services/youth.webp': 'services/youth-empowerment.webp',
}

function normalizeAssetPath(path: string): string {
  const trimmed = path.trim()
  const withoutQuery = trimmed.split('?')[0] ?? trimmed
  const key = withoutQuery.replace(/^\.\//, '')
  const mapped = LEGACY_ASSET_PATHS[key] ?? LEGACY_ASSET_PATHS[key.replace(/^\//, '')]
  if (mapped) return mapped

  // Strip a mistaken leading "images/" for files that live under /services, /staff, etc.
  if (/^\/?images\/(services|staff|showcase)\//i.test(key)) {
    return key.replace(/^\/?images\//i, '')
  }

  return key.replace(/^\//, '')
}

export function cmsAssetUrl(path: string | undefined | null): string {
  if (!path) return ''

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      const host = url.hostname.toLowerCase()
      const allowed =
        url.protocol === 'https:' &&
        (host === 'marketspheregroup.com' ||
          host === 'www.marketspheregroup.com' ||
          host.endsWith('.supabase.co'))
      return allowed ? url.toString() : ''
    } catch {
      return ''
    }
  }

  const normalized = normalizeAssetPath(path)
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${normalized.replace(/^\//, '')}`
}
