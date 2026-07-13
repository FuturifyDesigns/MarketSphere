/** Build a hash-router URL for Supabase auth redirects (email links, OTP callbacks). */
export function getAuthRouteUrl(route: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = route.startsWith('/') ? route : `/${route}`
  return `${window.location.origin}${base}/#${path}`
}
