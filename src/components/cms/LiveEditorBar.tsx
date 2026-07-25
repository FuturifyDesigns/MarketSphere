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
          <span className="live-editor-bar__badge" aria-hidden="true">
            <Pencil size={15} />
          </span>
          <div className="live-editor-bar__brand-copy">
            <strong>Live editor</strong>
            <span className="live-editor-bar__email">{profile?.email}</span>
          </div>
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
      <div className="live-editor-bar__guide container" aria-label="How to edit">
        <div className="live-editor-bar__step">
          <span className="live-editor-bar__step-num">1</span>
          <p>
            Click <strong>EDIT</strong> on a section to unlock it
          </p>
        </div>
        <div className="live-editor-bar__step">
          <span className="live-editor-bar__step-num">2</span>
          <p>
            Change text, photos, or use <strong>Add</strong> buttons
          </p>
        </div>
        <div className="live-editor-bar__step">
          <span className="live-editor-bar__step-num">3</span>
          <p>
            Click <strong>DONE</strong> on that section — or Exit editor above
          </p>
        </div>
      </div>
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
      title="Opens live editing. Use EDIT on each section, then click the same button again to exit that section."
    >
      <Pencil size={15} />
      <span className="live-editor-entry__copy">
        <strong>Edit live website</strong>
        <span className="live-editor-entry__hint">Click section EDIT · click again to exit</span>
      </span>
    </button>
  )
}
