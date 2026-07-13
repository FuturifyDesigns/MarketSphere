import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useSiteContent } from '../context/SiteContentContext'

type SiteEditContextValue = {
  editMode: boolean
  canEdit: boolean
  toggleEditMode: () => void
  setEditMode: (value: boolean) => void
}

const SiteEditContext = createContext<SiteEditContextValue | null>(null)

export function SiteEditProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useSiteContent()
  const [editMode, setEditMode] = useState(false)

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return
    setEditMode((current) => !current)
  }, [isAdmin])

  const value = useMemo(
    () => ({
      editMode: isAdmin && editMode,
      canEdit: isAdmin,
      toggleEditMode,
      setEditMode: (next: boolean) => {
        if (!isAdmin) return
        setEditMode(next)
      },
    }),
    [editMode, isAdmin, toggleEditMode],
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
