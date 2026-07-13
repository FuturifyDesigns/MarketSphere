import { createContext, useContext, type ReactNode } from 'react'
import { useSiteEdit } from './SiteEditContext'

type SectionEditContextValue = {
  sectionId: string
  isActive: boolean
}

const SectionEditContext = createContext<SectionEditContextValue | null>(null)

export function SectionEditProvider({
  sectionId,
  isActive,
  children,
}: {
  sectionId: string
  isActive: boolean
  children: ReactNode
}) {
  return (
    <SectionEditContext.Provider value={{ sectionId, isActive }}>
      {children}
    </SectionEditContext.Provider>
  )
}

export function useSectionEdit() {
  return useContext(SectionEditContext)
}

export function useSectionFieldEdit() {
  const { editMode } = useSiteEdit()
  const section = useSectionEdit()
  if (!editMode || !section) return false
  return section.isActive
}
