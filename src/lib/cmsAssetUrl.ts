/** Resolve CMS image/video paths (relative public paths or allowlisted HTTPS URLs). */
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

  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}
