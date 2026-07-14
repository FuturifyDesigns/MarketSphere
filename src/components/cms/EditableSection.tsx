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

const HIDDEN_BUTTON_STYLE: CSSProperties = { display: 'none' }

export const EditableSection = forwardRef<HTMLElement, EditableSectionProps>(function EditableSection(
  { id, label, as: Tag = 'section', className = '', children, ...rest },
  ref,
) {
  const { editMode, isSectionActive, toggleSection } = useSiteEdit()
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
          top: rect.top + 12,
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
  }, [editMode, isActive, children])

  const editButton =
    editMode && typeof document !== 'undefined'
      ? createPortal(
          <button
            type="button"
            style={editBtnStyle}
            className={`cms-section__edit cms-section__edit--portal ${isActive ? 'cms-section__edit--active' : ''}`}
            onClick={() => toggleSection(id)}
            aria-pressed={isActive}
          >
            <Pencil size={14} aria-hidden="true" />
            EDIT
            <span className="cms-section__edit-label">{label}</span>
          </button>,
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
