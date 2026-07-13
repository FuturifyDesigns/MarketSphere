import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useSiteContent } from '../context/SiteContentContext'
import { useSiteEdit } from '../context/SiteEditContext'
import type { SiteContentKey } from '../lib/siteContentDefaults'
import { useToast } from '../context/ToastContext'
import '../components/cms/cms.css'

type FieldTarget = {
  contentKey: SiteContentKey
  path: string
  multiline: boolean
  anchor: HTMLElement
}

type CmsTextEditorContextValue = {
  openField: (target: FieldTarget) => void
  closeField: () => void
  isFieldActive: (contentKey: SiteContentKey, path: string) => boolean
}

const CmsTextEditorContext = createContext<CmsTextEditorContextValue | null>(null)

function readDisplayValue(block: Record<string, unknown>, path: string): string {
  let value: unknown = block
  for (const part of path.split('.')) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    }
  }
  return typeof value === 'string' ? value : ''
}

function panelStyleFor(anchor: HTMLElement): CSSProperties {
  const rect = anchor.getBoundingClientRect()
  const width = Math.min(Math.max(rect.width, 240), 440)

  return {
    position: 'fixed',
    top: Math.min(rect.bottom + 8, window.innerHeight - 180),
    left: Math.min(rect.left, window.innerWidth - width - 12),
    width,
    zIndex: 1400,
  }
}

export function CmsTextEditorProvider({ children }: { children: ReactNode }) {
  const { getBlock, updateField } = useSiteContent()
  const { editMode, activeSection } = useSiteEdit()
  const { showToast } = useToast()
  const [active, setActive] = useState<FieldTarget | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({})
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const activeRef = useRef<FieldTarget | null>(null)

  activeRef.current = active

  const closeField = useCallback(() => {
    setActive(null)
    setDraft('')
  }, [])

  const openField = useCallback(
    (target: FieldTarget) => {
      const value = readDisplayValue(getBlock<Record<string, unknown>>(target.contentKey), target.path)
      setDraft(value)
      setActive(target)
      setStyle(panelStyleFor(target.anchor))
    },
    [getBlock],
  )

  const isFieldActive = useCallback(
    (contentKey: SiteContentKey, path: string) =>
      active?.contentKey === contentKey && active.path === path,
    [active],
  )

  useEffect(() => {
    if (!editMode) closeField()
  }, [editMode, closeField])

  useEffect(() => {
    closeField()
  }, [activeSection, closeField])

  useEffect(() => {
    if (!active) return

    const update = () => {
      const current = activeRef.current
      if (!current) return
      setStyle(panelStyleFor(current.anchor))
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [active])

  useEffect(() => {
    if (active) inputRef.current?.focus()
  }, [active])

  const save = async () => {
    if (!active) return
    const current = readDisplayValue(getBlock<Record<string, unknown>>(active.contentKey), active.path)
    if (draft === current) {
      closeField()
      return
    }

    setSaving(true)
    try {
      await updateField(active.contentKey, active.path, draft)
      showToast('Content updated — live for all visitors.')
      closeField()
    } catch {
      showToast('Could not save changes. Try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const panel =
    active && editMode
      ? createPortal(
          <div
            className="cms-editable-toolbar cms-editable-toolbar--editing cms-text-editor-panel"
            style={style}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {active.multiline ? (
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
              <button type="button" className="cms-editable__cancel" onClick={closeField} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>,
          document.body,
        )
      : null

  const value = { openField, closeField, isFieldActive }

  return (
    <CmsTextEditorContext.Provider value={value}>
      {children}
      {panel}
    </CmsTextEditorContext.Provider>
  )
}

export function useCmsTextEditor() {
  const context = useContext(CmsTextEditorContext)
  if (!context) {
    throw new Error('useCmsTextEditor must be used within CmsTextEditorProvider')
  }
  return context
}
