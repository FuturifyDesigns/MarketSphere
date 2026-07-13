import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Save } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
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
  const { showToast } = useToast()
  const [activeKey, setActiveKey] = useState<SiteContentKey>('home')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

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
      <section className="dashboard-panel admin-dashboard__panel">
        <div className="dashboard-panel__header">
          <h2>Site content</h2>
          <p className="admin-dashboard__live-note">
            Prefer visual editing? Visit any public page, click <strong>Edit this page</strong> in the toolbar, then click highlighted fields.
          </p>
        </div>

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

        {PAGE_LINKS[activeKey] ? (
          <Link to={PAGE_LINKS[activeKey]!} className="admin-site-content__preview">
            <ExternalLink size={14} />
            Preview {CONTENT_LABELS[activeKey]} on live site
          </Link>
        ) : null}

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
      </section>
    </div>
  )
}
