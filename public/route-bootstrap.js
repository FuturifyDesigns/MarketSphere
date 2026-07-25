/**
 * Legacy hash-route migration.
 *
 * The app used a hash router (/#/about); it now uses real paths (/about).
 * Old bookmarks, shared links and search results still point at /#/… so
 * rewrite them to the real path before React boots.
 *
 * Supabase implicit-flow responses arrive as #access_token=… — those do not
 * start with "#/" and are deliberately left untouched.
 *
 * External file so CSP can allow script-src 'self' without 'unsafe-inline'.
 */
;(function () {
  var hash = window.location.hash
  if (!hash || hash.charAt(1) !== '/') return

  var raw = hash.slice(1)
  var queryAt = raw.indexOf('?')
  var path = queryAt === -1 ? raw : raw.slice(0, queryAt)
  var hashQuery = queryAt === -1 ? '' : raw.slice(queryAt + 1)
  var search = window.location.search.replace(/^\?/, '')

  var merged = [search, hashQuery]
    .filter(function (part) {
      return part
    })
    .join('&')

  window.location.replace(path + (merged ? '?' + merged : ''))
})()
