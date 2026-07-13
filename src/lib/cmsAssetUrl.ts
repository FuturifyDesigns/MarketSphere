/** Resolve CMS image/video paths (relative public paths or full URLs). */
export function cmsAssetUrl(path: string | undefined | null): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}
