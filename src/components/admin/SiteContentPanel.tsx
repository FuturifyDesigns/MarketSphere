import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Save } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSiteEdit } from '../../context/SiteEditContext'
import { SITE_CONTENT_KEYS, type SiteContentKey } from '../../lib/siteContentDefaults'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'

const CONTENT_LABELS: Record<SiteContentKey, string> = {
  company: 'Company & footer',
  faq: 'FAQ page',
  home: 'Home page',
  contact: 'Contact page',
  about: 'About page',
  services: 'Services page',
}

const PAGE_LINKS: Partial<Record<SiteContentKey, string>> = {
  home: '/',
  about: '/about',
  services: '/services',
  contact: '/contact',
  faq: '/faq',
}

export function SiteContentPanel() {
  const { content, updateBlock } = useSiteContent()
  const { setEditMode } = useSiteEdit()
  const { showToast } = useToast()
  const [activeKey, setActiveKey] = useState<SiteContentKey>('home')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    setDraft(JSON.stringify(content[activeKey], null, 2))
  }, [activeKey, content])

  const saveDraft = async () => {
    setSaving(true)
    try {
      const parsed = JSON.parse(draft) as unknown
      await updateBlock(activeKey, parsed)
      showToast(`${CONTENT_LABELS[activeKey]} saved — live for all visitors.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON or save failed.'
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-site-content">
      <section className="dashboard-panel admin-dashboard__panel admin-site-content__hero">
        <div className="dashboard-panel__header">
          <h2>Edit the live website</h2>
          <p className="admin-dashboard__live-note">
            Open the public site in live editor mode. Each section gets an <strong>EDIT</strong> button — click it, then update the text inside that section.
          </p>
        </div>
        <div className="admin-site-content__live-actions">
          <Link
            to="/"
            state={{ liveEdit: true }}
            className="admin-site-content__live-btn"
            onClick={() => setEditMode(true)}
          >
            <Pencil size={16} />
            Edit Live Website
          </Link>
          {PAGE_LINKS[activeKey] ? (
            <Link
              to={PAGE_LINKS[activeKey]!}
              state={{ liveEdit: true }}
              className="admin-site-content__live-btn admin-site-content__live-btn--secondary"
              onClick={() => setEditMode(true)}
            >
              <ExternalLink size={14} />
              Edit {CONTENT_LABELS[activeKey]}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="dashboard-panel admin-dashboard__panel">
        <div className="dashboard-panel__header">
          <h2>Advanced JSON editor</h2>
          <p className="admin-dashboard__live-note">
            For developers only. Most changes should be made on the live site with section EDIT buttons.
          </p>
        </div>

        <button
          type="button"
          className="admin-site-content__advanced-toggle"
          onClick={() => setShowAdvanced((open) => !open)}
        >
          {showAdvanced ? 'Hide JSON editor' : 'Show JSON editor'}
        </button>

        {showAdvanced ? (
          <>
            <div className="admin-site-content__keys">
              {(Object.values(SITE_CONTENT_KEYS) as SiteContentKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={activeKey === key ? 'admin-site-content__key--active' : ''}
                  onClick={() => setActiveKey(key)}
                >
                  {CONTENT_LABELS[key]}
                </button>
              ))}
            </div>

            <textarea
              className="admin-site-content__editor"
              rows={18}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />

            <Button onClick={() => void saveDraft()} disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving…' : 'Save block'}
            </Button>
          </>
        ) : null}
      </section>
    </div>
  )
}
