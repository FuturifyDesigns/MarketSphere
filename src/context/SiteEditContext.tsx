import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '../context/SiteContentContext'

const LIVE_EDIT_STORAGE_KEY = 'msg-site-live-edit'

type SiteEditContextValue = {
  editMode: boolean
  canEdit: boolean
  activeSection: string | null
  toggleEditMode: () => void
  setEditMode: (value: boolean) => void
  setActiveSection: (sectionId: string | null) => void
  toggleSection: (sectionId: string) => void
  isSectionActive: (sectionId: string) => boolean
}

const SiteEditContext = createContext<SiteEditContextValue | null>(null)

export function SiteEditProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useSiteContent()
  const location = useLocation()
  const [editMode, setEditModeState] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(LIVE_EDIT_STORAGE_KEY) === '1'
  })
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as { liveEdit?: boolean } | null
    if (state?.liveEdit && isAdmin) {
      setEditModeState(true)
      sessionStorage.setItem(LIVE_EDIT_STORAGE_KEY, '1')
    }
  }, [location.state, isAdmin])

  useEffect(() => {
    setActiveSection(null)
  }, [location.pathname])

  const setEditMode = useCallback(
    (next: boolean) => {
      if (!isAdmin) return
      setEditModeState(next)
      if (next) {
        sessionStorage.setItem(LIVE_EDIT_STORAGE_KEY, '1')
      } else {
        sessionStorage.removeItem(LIVE_EDIT_STORAGE_KEY)
        setActiveSection(null)
      }
    },
    [isAdmin],
  )

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return
    setEditModeState((current) => {
      const next = !current
      if (next) {
        sessionStorage.setItem(LIVE_EDIT_STORAGE_KEY, '1')
      } else {
        sessionStorage.removeItem(LIVE_EDIT_STORAGE_KEY)
        setActiveSection(null)
      }
      return next
    })
  }, [isAdmin])

  const toggleSection = useCallback((sectionId: string) => {
    setActiveSection((current) => (current === sectionId ? null : sectionId))
  }, [])

  const isSectionActive = useCallback(
    (sectionId: string) => activeSection === sectionId,
    [activeSection],
  )

  const value = useMemo(
    () => ({
      editMode: isAdmin && editMode,
      canEdit: isAdmin,
      activeSection: isAdmin && editMode ? activeSection : null,
      toggleEditMode,
      setEditMode,
      setActiveSection,
      toggleSection,
      isSectionActive,
    }),
    [
      activeSection,
      editMode,
      isAdmin,
      isSectionActive,
      setEditMode,
      toggleEditMode,
      toggleSection,
    ],
  )

  return <SiteEditContext.Provider value={value}>{children}</SiteEditContext.Provider>
}

export function useSiteEdit() {
  const context = useContext(SiteEditContext)
  if (!context) {
    throw new Error('useSiteEdit must be used within SiteEditProvider')
  }
  return context
}
