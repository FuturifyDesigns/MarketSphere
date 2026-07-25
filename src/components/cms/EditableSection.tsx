import {
  forwardRef,
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react'
import { Pencil, Undo2 } from 'lucide-react'
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
  const { editMode, isSectionActive, toggleSection, canUndoActiveSection, undoActiveSection } = useSiteEdit()
  const isActive = isSectionActive(id)
  const [undoing, setUndoing] = useState(false)

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const handleUndo = async () => {
    if (!canUndoActiveSection || undoing) return
    setUndoing(true)
    try {
      await undoActiveSection()
    } finally {
      setUndoing(false)
    }
  }

  return (
    <SectionEditProvider sectionId={id} isActive={isActive}>
      <Tag
        ref={setRefs}
        {...rest}
        className={`cms-section ${className} ${editMode ? 'cms-section--live' : ''} ${isActive ? 'cms-section--active' : ''}`.trim()}
        data-cms-section={id}
      >
        {editMode ? (
          <div className="cms-section__controls">
            {isActive && canUndoActiveSection ? (
              <button
                type="button"
                className="cms-section__undo"
                onClick={() => void handleUndo()}
                disabled={undoing}
                title="Undo all changes made in this section since you clicked EDIT"
              >
                <Undo2 size={14} aria-hidden="true" />
                {undoing ? 'Undoing…' : 'Undo'}
              </button>
            ) : null}
            <button
              type="button"
              className={`cms-section__edit ${isActive ? 'cms-section__edit--active' : ''}`}
              onClick={() => toggleSection(id)}
              aria-pressed={isActive}
              aria-label={
                isActive
                  ? `Exit editing ${label}. Click again to lock this section.`
                  : `Edit ${label}. Click again on this button to exit edit.`
              }
              title={
                isActive
                  ? 'Click again to exit edit for this section'
                  : 'Click to edit · click again to exit'
              }
            >
              <span className="cms-section__edit-main">
                <Pencil size={14} aria-hidden="true" />
                <span className="cms-section__edit-state">{isActive ? 'DONE' : 'EDIT'}</span>
                <span className="cms-section__edit-label">{label}</span>
              </span>
              <span className="cms-section__edit-hint">
                {isActive ? 'Click again to exit edit' : 'Click to edit · click again to exit'}
              </span>
            </button>
          </div>
        ) : null}
        {children}
      </Tag>
    </SectionEditProvider>
  )
})
