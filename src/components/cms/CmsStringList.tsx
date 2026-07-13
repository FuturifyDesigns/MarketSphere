import { Plus, Trash2 } from 'lucide-react'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import type { CmsStringItem } from '../../lib/cmsTypes'
import { createStringItem } from '../../lib/cmsTypes'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import './cms.css'

type CmsStringListProps = {
  contentKey: SiteContentKey
  path: string
  items: CmsStringItem[]
  placeholder?: string
}

export function CmsStringList({
  contentKey,
  path,
  items,
  placeholder = 'Item text',
}: CmsStringListProps) {
  const { updateField } = useSiteContent()
  const canEdit = useSectionFieldEdit()
  const { showToast } = useToast()

  const persist = async (next: CmsStringItem[]) => {
    try {
      await updateField(contentKey, path, next)
      showToast('List updated — live for all visitors.')
    } catch {
      showToast('Could not save list changes.', 'error')
    }
  }

  if (!canEdit) {
    return null
  }

  return (
    <div className="cms-string-list">
      {items.map((item, index) => (
        <div key={item.id} className="cms-string-list__row">
          <input
            className="cms-editable__input"
            value={item.text}
            placeholder={placeholder}
            onChange={(e) => {
              const next = items.map((row, i) =>
                i === index ? { ...row, text: e.target.value } : row,
              )
              void persist(next)
            }}
          />
          <button
            type="button"
            className="cms-string-list__remove"
            onClick={() => void persist(items.filter((row) => row.id !== item.id))}
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => void persist([...items, createStringItem()])}
      >
        <Plus size={14} />
        Add item
      </Button>
    </div>
  )
}

export function cmsStringTexts(items: CmsStringItem[]): string[] {
  return items.map((item) => item.text).filter(Boolean)
}
