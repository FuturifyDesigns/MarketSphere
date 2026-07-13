import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { SectionEditProvider } from '../../context/SectionEditContext'
import { useSiteEdit } from '../../context/SiteEditContext'
import './cms.css'

type EditableSectionProps = {
  id: string
  label: string
  as?: ElementType
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'section'>, 'id' | 'children' | 'className'>

export const EditableSection = forwardRef<HTMLElement, EditableSectionProps>(function EditableSection(
  { id, label, as: Tag = 'section', className = '', children, ...rest },
  ref,
) {
  const { editMode, isSectionActive, toggleSection } = useSiteEdit()
  const isActive = isSectionActive(id)

  return (
    <SectionEditProvider sectionId={id} isActive={isActive}>
      <Tag
        ref={ref}
        {...rest}
        className={`cms-section ${className} ${editMode ? 'cms-section--live' : ''} ${isActive ? 'cms-section--active' : ''}`.trim()}
        data-cms-section={id}
      >
        {editMode ? (
          <button
            type="button"
            className={`cms-section__edit ${isActive ? 'cms-section__edit--active' : ''}`}
            onClick={() => toggleSection(id)}
            aria-pressed={isActive}
          >
            <Pencil size={14} aria-hidden="true" />
            EDIT
            <span className="cms-section__edit-label">{label}</span>
          </button>
        ) : null}
        {children}
      </Tag>
    </SectionEditProvider>
  )
})
