import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useToast } from './ToastContext'
import {
  initCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentRecord,
  type CookiePreference,
} from '../lib/cookieConsent'

interface CookieConsentContextType {
  consent: CookieConsentRecord | null
  bannerOpen: boolean
  acceptCookies: () => void
  declineCookies: () => void
  openCookieSettings: () => void
  closeCookieBanner: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [consent, setConsent] = useState<CookieConsentRecord | null>(() => readCookieConsent())
  const [bannerOpen, setBannerOpen] = useState(() => !readCookieConsent())

  useEffect(() => {
    initCookieConsent()
  }, [])

  const persistChoice = useCallback((preference: CookiePreference, message: string) => {
    const record = writeCookieConsent(preference)
    setConsent(record)
    setBannerOpen(false)
    showToast(message, preference === 'accepted' ? 'success' : 'info')
  }, [showToast])

  const acceptCookies = useCallback(() => {
    persistChoice(
      'accepted',
      'Cookie preferences saved. Optional cookies are now enabled where applicable.',
    )
  }, [persistChoice])

  const declineCookies = useCallback(() => {
    persistChoice(
      'declined',
      'Cookie preferences saved. Only essential cookies will be used.',
    )
  }, [persistChoice])

  const openCookieSettings = useCallback(() => {
    setBannerOpen(true)
  }, [])

  const closeCookieBanner = useCallback(() => {
    if (consent) setBannerOpen(false)
  }, [consent])

  const value = useMemo(
    () => ({
      consent,
      bannerOpen,
      acceptCookies,
      declineCookies,
      openCookieSettings,
      closeCookieBanner,
    }),
    [acceptCookies, bannerOpen, closeCookieBanner, consent, declineCookies, openCookieSettings],
  )

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return ctx
}
