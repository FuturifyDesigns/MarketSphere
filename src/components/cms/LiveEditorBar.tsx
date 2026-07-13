import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Pencil, PencilOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSiteEdit } from '../../context/SiteEditContext'
import './cms.css'

export function LiveEditorBar() {
  const { profile, signOut } = useAuth()
  const { canEdit, editMode, setEditMode } = useSiteEdit()
  const navigate = useNavigate()

  if (!canEdit || !editMode) return null

  const handleLogout = async () => {
    setEditMode(false)
    await signOut()
    navigate('/')
  }

  return (
    <div className="live-editor-bar" role="banner" aria-label="Live website editor">
      <div className="live-editor-bar__inner container">
        <div className="live-editor-bar__brand">
          <Pencil size={16} aria-hidden="true" />
          <strong>LIVE EDITOR</strong>
          <span className="live-editor-bar__email">{profile?.email}</span>
        </div>
        <div className="live-editor-bar__actions">
          <Link to="/dashboard/admin" state={{ tab: 'site-content' }} className="live-editor-bar__btn live-editor-bar__btn--ghost">
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <button
            type="button"
            className="live-editor-bar__btn live-editor-bar__btn--ghost"
            onClick={() => setEditMode(false)}
          >
            <PencilOff size={15} />
            Exit editor
          </button>
          <button type="button" className="live-editor-bar__btn live-editor-bar__btn--logout" onClick={() => void handleLogout()}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
      <p className="live-editor-bar__hint container">
        Click <strong>EDIT</strong> on any section, then update the highlighted fields inside it.
      </p>
    </div>
  )
}

export function LiveEditorEntry() {
  const { canEdit, editMode, setEditMode } = useSiteEdit()

  if (!canEdit || editMode) return null

  return (
    <button
      type="button"
      className="live-editor-entry"
      onClick={() => setEditMode(true)}
    >
      <Pencil size={15} />
      Edit live website
    </button>
  )
}
