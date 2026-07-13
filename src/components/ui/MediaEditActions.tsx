import { Pencil, Trash2 } from 'lucide-react'
import './MediaEditActions.css'

interface MediaEditActionsProps {
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
  compact?: boolean
}

export function MediaEditActions({ onEdit, onDelete, disabled = false, compact = false }: MediaEditActionsProps) {
  return (
    <div className={`media-edit-actions${compact ? ' media-edit-actions--compact' : ''}`}>
      <button type="button" className="media-edit-actions__btn" onClick={onEdit} disabled={disabled}>
        <Pencil size={14} aria-hidden="true" />
        Edit
      </button>
      <button type="button" className="media-edit-actions__btn media-edit-actions__btn--danger" onClick={onDelete} disabled={disabled}>
        <Trash2 size={14} aria-hidden="true" />
        Delete
      </button>
    </div>
  )
}
