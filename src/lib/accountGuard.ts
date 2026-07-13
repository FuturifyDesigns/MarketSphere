const ACCOUNT_NOTICE_KEY = 'account_notice'

export function storeAccountNotice(message: string) {
  sessionStorage.setItem(ACCOUNT_NOTICE_KEY, message)
}

export function consumeAccountNotice() {
  const message = sessionStorage.getItem(ACCOUNT_NOTICE_KEY)
  if (message) sessionStorage.removeItem(ACCOUNT_NOTICE_KEY)
  return message
}

export function isProfileBanned(profile: { banned_at?: string | null } | null | undefined) {
  return Boolean(profile?.banned_at)
}

export function getBanMessage(profile: { ban_reason?: string | null } | null | undefined) {
  return profile?.ban_reason?.trim() || 'Your account has been suspended by an administrator.'
}
