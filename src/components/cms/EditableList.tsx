import { Plus, Trash2 } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSiteEdit } from '../../context/SiteEditContext'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import './cms.css'

type EditableListProps<T extends { id: string }> = {
  contentKey: SiteContentKey
  path: string
  items: T[]
  createItem: () => T
  renderItem: (item: T, index: number) => React.ReactNode
  emptyLabel?: string
}

export function EditableList<T extends { id: string }>({
  contentKey,
  path,
  items,
  createItem,
  renderItem,
  emptyLabel = 'No items yet.',
}: EditableListProps<T>) {
  const { updateField } = useSiteContent()
  const { editMode } = useSiteEdit()
  const { showToast } = useToast()

  const persist = async (next: T[]) => {
    try {
      await updateField(contentKey, path, next)
      showToast('List updated — live for all visitors.')
    } catch {
      showToast('Could not save list changes.', 'error')
    }
  }

  const addItem = () => void persist([...items, createItem()])

  const removeItem = (id: string) => void persist(items.filter((item) => item.id !== id))

  if (!items.length && !editMode) {
    return <p>{emptyLabel}</p>
  }

  return (
    <div className="cms-list-edit">
      {items.map((item, index) => (
        <div key={item.id} className="cms-list-edit__item">
          {renderItem(item, index)}
          {editMode ? (
            <button
              type="button"
              className="cms-editable__trigger"
              style={{ position: 'static', marginTop: 8 }}
              onClick={() => void removeItem(item.id)}
              aria-label="Remove item"
            >
              <Trash2 size={12} />
              Remove
            </button>
          ) : null}
        </div>
      ))}
      {editMode ? (
        <div className="cms-list-edit__add">
          <Button type="button" size="sm" variant="secondary" onClick={addItem}>
            <Plus size={14} />
            Add item
          </Button>
        </div>
      ) : null}
    </div>
  )
}
