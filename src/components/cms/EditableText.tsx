import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Pencil } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { useToast } from '../../context/ToastContext'
import './cms.css'

type EditableTextProps = {
  contentKey: SiteContentKey
  path: string
  as?: ElementType
  className?: string
  multiline?: boolean
  children?: ReactNode
}

function readDisplayValue(block: Record<string, unknown>, path: string): string {
  let value: unknown = block
  for (const part of path.split('.')) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    }
  }
  return typeof value === 'string' ? value : ''
}

export function EditableText({
  contentKey,
  path,
  as: Tag = 'span',
  className = '',
  multiline = false,
  children,
}: EditableTextProps) {
  const { getBlock, updateField } = useSiteContent()
  const canEditField = useSectionFieldEdit()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [toolbarStyle, setToolbarStyle] = useState<CSSProperties>({})
  const anchorRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  const display = readDisplayValue(getBlock<Record<string, unknown>>(contentKey), path)

  const updateToolbarPosition = () => {
    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const width = Math.min(Math.max(rect.width, 220), 420)

    setToolbarStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - width - 12),
      width,
      zIndex: 1300,
    })
  }

  useEffect(() => {
    if (!canEditField && !editing) return

    updateToolbarPosition()
    const handle = () => updateToolbarPosition()

    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)

    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [canEditField, editing, display])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const startEdit = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDraft(display)
    setEditing(true)
  }

  const cancel = () => {
    setEditing(false)
    setDraft('')
  }

  const save = async () => {
    if (draft === display) {
      cancel()
      return
    }
    setSaving(true)
    try {
      await updateField(contentKey, path, draft)
      showToast('Content updated — live for all visitors.')
      cancel()
    } catch {
      showToast('Could not save changes. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const lines = display.split('\n')
  const content =
    children ??
    (lines.length > 1
      ? lines.map((line, index) => (
          <span key={index}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))
      : display)

  const toolbar =
    canEditField || editing
      ? createPortal(
          <div
            className={`cms-editable-toolbar ${editing ? 'cms-editable-toolbar--editing' : ''}`}
            style={toolbarStyle}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {editing ? (
              <>
                {multiline ? (
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className="cms-editable__input"
                    rows={4}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                ) : (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    className="cms-editable__input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                )}
                <div className="cms-editable__actions">
                  <button type="button" className="cms-editable__save" onClick={() => void save()} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" className="cms-editable__cancel" onClick={cancel} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="cms-editable__trigger cms-editable__trigger--floating" onClick={startEdit}>
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <Tag
        ref={anchorRef}
        className={`cms-editable ${canEditField ? 'cms-editable--active' : ''} ${className}`.trim()}
        onClick={canEditField ? (event: MouseEvent<HTMLElement>) => event.stopPropagation() : undefined}
        onMouseDown={canEditField ? (event: MouseEvent<HTMLElement>) => event.stopPropagation() : undefined}
      >
        {content}
      </Tag>
      {toolbar}
    </>
  )
}
