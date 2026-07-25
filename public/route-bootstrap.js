/**
 * Path → hash bootstrap for SPA deep links on static hosts.
 * External file so CSP can allow script-src 'self' without 'unsafe-inline'.
 * Preserves ?code=&state= query params (required for OAuth callbacks).
 */
;(function () {
  var path = window.location.pathname
  if (path === '/' || /\/(index|404)\.html\/?$/.test(path)) return
  if (window.location.hash && window.location.hash.length > 1) return
  window.location.replace(
    '/#/' +
      path.replace(/^\/+/, '').replace(/\/$/, '') +
      window.location.search +
      window.location.hash,
  )
})()
