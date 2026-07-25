import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteContent } from '../context/SiteContentContext'
import { prepareDomForCmsEdit, releaseDomAfterCmsEdit } from '../lib/cmsEditMode'
import { useToast } from './ToastContext'

const LIVE_EDIT_STORAGE_KEY = 'msg-site-live-edit'

type SiteContentMap = Record<string, unknown>

type SiteEditContextValue = {
  editMode: boolean
  canEdit: boolean
  activeSection: string | null
  canUndoActiveSection: boolean
  undoActiveSection: () => Promise<void>
  toggleEditMode: () => void
  setEditMode: (value: boolean) => void
  setActiveSection: (sectionId: string | null) => void
  toggleSection: (sectionId: string) => void
  isSectionActive: (sectionId: string) => boolean
}

const SiteEditContext = createContext<SiteEditContextValue | null>(null)

function snapshotsEqual(a: SiteContentMap | null, b: SiteContentMap) {
  if (!a) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function SiteEditProvider({ children }: { children: ReactNode }) {
  const { isAdmin, content, getContentSnapshot, restoreContentSnapshot } = useSiteContent()
  const { showToast } = useToast()
  const location = useLocation()
  const [editMode, setEditModeState] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(LIVE_EDIT_STORAGE_KEY) === '1'
  })
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sectionSnapshot, setSectionSnapshot] = useState<SiteContentMap | null>(null)
  const undoingRef = useRef(false)

  useEffect(() => {
    if (editMode && isAdmin) {
      prepareDomForCmsEdit()
    } else {
      releaseDomAfterCmsEdit()
    }
  }, [editMode, isAdmin])

  useEffect(() => {
    const state = location.state as { liveEdit?: boolean } | null
    if (state?.liveEdit && isAdmin) {
      setEditModeState(true)
      sessionStorage.setItem(LIVE_EDIT_STORAGE_KEY, '1')
    }
  }, [location.state, isAdmin])

  useEffect(() => {
    setActiveSection(null)
    setSectionSnapshot(null)
  }, [location.pathname])

  useEffect(() => {
    return () => {
      releaseDomAfterCmsEdit()
    }
  }, [])

  const setEditMode = useCallback(
    (next: boolean) => {
      if (!isAdmin) return
      setEditModeState(next)
      if (next) {
        sessionStorage.setItem(LIVE_EDIT_STORAGE_KEY, '1')
      } else {
        sessionStorage.removeItem(LIVE_EDIT_STORAGE_KEY)
        setActiveSection(null)
        setSectionSnapshot(null)
      }
    },
    [isAdmin],
  )

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return
    setEditMode(!editMode)
  }, [editMode, isAdmin, setEditMode])

  const toggleSection = useCallback(
    (sectionId: string) => {
      setActiveSection((current) => {
        if (current === sectionId) {
          setSectionSnapshot(null)
          return null
        }
        setSectionSnapshot(getContentSnapshot())
        return sectionId
      })
    },
    [getContentSnapshot],
  )

  const isSectionActive = useCallback(
    (sectionId: string) => activeSection === sectionId,
    [activeSection],
  )

  const canUndoActiveSection = Boolean(
    activeSection && sectionSnapshot && !snapshotsEqual(sectionSnapshot, content),
  )

  const undoActiveSection = useCallback(async () => {
    if (!activeSection || !sectionSnapshot || undoingRef.current) return
    undoingRef.current = true
    try {
      await restoreContentSnapshot(sectionSnapshot)
      showToast('Section changes undone.')
    } catch {
      showToast('Could not undo section changes.', 'error')
    } finally {
      undoingRef.current = false
    }
  }, [activeSection, restoreContentSnapshot, sectionSnapshot, showToast])

  const value = useMemo(
    () => ({
      editMode: isAdmin && editMode,
      canEdit: isAdmin,
      activeSection: isAdmin && editMode ? activeSection : null,
      canUndoActiveSection: isAdmin && editMode ? canUndoActiveSection : false,
      undoActiveSection,
      toggleEditMode,
      setEditMode,
      setActiveSection,
      toggleSection,
      isSectionActive,
    }),
    [
      activeSection,
      canUndoActiveSection,
      editMode,
      isAdmin,
      isSectionActive,
      setEditMode,
      toggleEditMode,
      toggleSection,
      undoActiveSection,
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
