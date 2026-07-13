import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
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
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  const block = getBlock<Record<string, unknown>>(contentKey)
  const pathParts = path.split('.')
  let value: unknown = block
  for (const part of pathParts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    }
  }
  const display = typeof value === 'string' ? value : ''

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const startEdit = () => {
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

  if (editing) {
    return (
      <div className={`cms-editable cms-editable--active ${className}`}>
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
      </div>
    )
  }

  const lines = display.split('\n')

  return (
    <Tag className={`cms-editable ${canEditField ? 'cms-editable--active' : ''} ${className}`.trim()}>
      {children ??
        (lines.length > 1
          ? lines.map((line, index) => (
              <span key={index}>
                {line}
                {index < lines.length - 1 ? <br /> : null}
              </span>
            ))
          : display)}
      {canEditField ? (
        <button type="button" className="cms-editable__trigger" onClick={startEdit} aria-label="Edit text">
          <Pencil size={12} />
          Edit
        </button>
      ) : null}
    </Tag>
  )
}
