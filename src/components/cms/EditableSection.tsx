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

const HIDDEN: CSSProperties = { display: 'none' }

/**
 * EDIT controls are portaled to document.body so GSAP pin/reorder never
 * fights React's insertBefore when controls mount inside animated sections.
 */
export const EditableSection = forwardRef<HTMLElement, EditableSectionProps>(function EditableSection(
  { id, label, as: Tag = 'section', className = '', children, ...rest },
  ref,
) {
  const { editMode, isSectionActive, toggleSection, canUndoActiveSection, undoActiveSection } = useSiteEdit()
  const isActive = isSectionActive(id)
  const nodeRef = useRef<HTMLElement | null>(null)
  const [style, setStyle] = useState<CSSProperties>(HIDDEN)
  const [undoing, setUndoing] = useState(false)

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  useEffect(() => {
    if (!editMode) {
      setStyle(HIDDEN)
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
        const edgePad = 12
        const editorBar = document.querySelector('.live-editor-bar')
        const barBottom = editorBar?.getBoundingClientRect().bottom ?? 0
        const viewTop = Math.max(edgePad, barBottom + edgePad)
        const viewBottom = window.innerHeight - edgePad

        const visibleTop = Math.max(rect.top, viewTop)
        const visibleBottom = Math.min(rect.bottom, viewBottom)
        const visibleHeight = visibleBottom - visibleTop

        // Hide when the section is mostly off-screen — prevents footer
        // buttons from stacking on top of mid-page content.
        if (rect.width < 8 || visibleHeight < 56) {
          setStyle(HIDDEN)
          return
        }

        const controlHeight = isActive && canUndoActiveSection ? 108 : 72
        const top = Math.min(visibleTop + edgePad, Math.max(viewTop, visibleBottom - controlHeight))
        const desiredRight = Math.min(rect.right - edgePad, window.innerWidth - edgePad)
        const right = Math.max(edgePad, window.innerWidth - desiredRight)

        setStyle({
          position: 'fixed',
          top,
          right,
          left: 'auto',
          transform: 'none',
          zIndex: 1300,
          display: 'inline-flex',
        })
      })
    }

    update()
    window.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(section)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      ro?.disconnect()
    }
  }, [editMode, isActive, canUndoActiveSection, children])

  const handleUndo = async () => {
    if (!canUndoActiveSection || undoing) return
    setUndoing(true)
    try {
      await undoActiveSection()
    } finally {
      setUndoing(false)
    }
  }

  const controls =
    editMode && typeof document !== 'undefined'
      ? createPortal(
          <div className="cms-section__controls cms-section__controls--portal" style={style} data-cms-for={id}>
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
      {controls}
    </SectionEditProvider>
  )
})
