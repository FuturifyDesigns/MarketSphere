import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, PencilOff } from 'lucide-react'
import { useSiteEdit } from '../../context/SiteEditContext'
import './cms.css'

export function SiteEditToolbar() {
  const { canEdit, editMode, toggleEditMode } = useSiteEdit()

  if (!canEdit) return null

  return (
    <div className="cms-toolbar" role="toolbar" aria-label="Site editing controls">
      <span className="cms-toolbar__label">Admin CMS</span>
      <button
        type="button"
        className={`cms-toolbar__toggle ${editMode ? 'cms-toolbar__toggle--on' : 'cms-toolbar__toggle--off'}`}
        onClick={toggleEditMode}
        aria-pressed={editMode}
      >
        {editMode ? <PencilOff size={15} /> : <Pencil size={15} />}
        {editMode ? 'Exit edit mode' : 'Edit this page'}
      </button>
      <Link to="/dashboard/admin" state={{ tab: 'site-content' }} className="cms-toolbar__link">
        <ExternalLink size={14} />
        Admin panel
      </Link>
      {editMode ? (
        <span className="cms-toolbar__status">Click any highlighted field to edit</span>
      ) : null}
    </div>
  )
}
