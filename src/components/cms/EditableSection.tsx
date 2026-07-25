import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
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

const HIDDEN_BUTTON_STYLE: CSSProperties = { display: 'none' }

export const EditableSection = forwardRef<HTMLElement, EditableSectionProps>(function EditableSection(
  { id, label, as: Tag = 'section', className = '', children, ...rest },
  ref,
) {
  const { editMode, isSectionActive, toggleSection, canUndoActiveSection, undoActiveSection } = useSiteEdit()
  const isActive = isSectionActive(id)
  const nodeRef = useRef<HTMLElement | null>(null)
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const [editBtnStyle, setEditBtnStyle] = useState<CSSProperties>(HIDDEN_BUTTON_STYLE)
  const [undoing, setUndoing] = useState(false)

  useEffect(() => {
    if (!editMode) {
      setEditBtnStyle(HIDDEN_BUTTON_STYLE)
      return
    }

    const section = nodeRef.current
    if (!section) return

    let frame = 0
    const update = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const rect = section.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) {
          setEditBtnStyle(HIDDEN_BUTTON_STYLE)
          return
        }

        setEditBtnStyle({
          position: 'fixed',
          top: Math.max(12, rect.top + 12),
          left: Math.min(Math.max(12, rect.right - 12), window.innerWidth - 12),
          transform: 'translateX(-100%)',
          zIndex: 1300,
          display: 'inline-flex',
        })
      })
    }

    update()
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [editMode, isActive, children, canUndoActiveSection])

  const handleUndo = async () => {
    if (!canUndoActiveSection || undoing) return
    setUndoing(true)
    try {
      await undoActiveSection()
    } finally {
      setUndoing(false)
    }
  }

  const editButton =
    editMode && typeof document !== 'undefined'
      ? createPortal(
          <div className="cms-section__controls" style={editBtnStyle}>
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
              className={`cms-section__edit cms-section__edit--portal ${isActive ? 'cms-section__edit--active' : ''}`}
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
          </div>,
          document.body,
        )
      : null

  return (
    <SectionEditProvider sectionId={id} isActive={isActive}>
      <Tag
        ref={setRefs}
        {...rest}
        className={`cms-section ${className} ${editMode ? 'cms-section--live' : ''} ${isActive ? 'cms-section--active' : ''}`.trim()}
        data-cms-section={id}
      >
        {children}
      </Tag>
      {editButton}
    </SectionEditProvider>
  )
})
