import { Plus, Trash2 } from 'lucide-react'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import type { CmsExtraSection } from '../../lib/cmsTypes'
import { createExtraSection } from '../../lib/cmsTypes'
import { cmsAssetUrl } from '../../lib/cmsAssetUrl'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { useToast } from '../../context/ToastContext'
import { EditableText } from './EditableText'
import { EditableButton } from './EditableButton'
import { EditableImage } from './EditableImage'
import { Button } from '../ui/Button'
import './cms.css'

type CmsExtraSectionsProps = {
  contentKey: SiteContentKey
}

export function CmsExtraSections({ contentKey }: CmsExtraSectionsProps) {
  const { getBlock, updateField } = useSiteContent()
  const canEdit = useSectionFieldEdit()
  const { showToast } = useToast()
  const block = getBlock<{ extraSections?: CmsExtraSection[] }>(contentKey)
  const sections = block.extraSections ?? []

  const persist = async (next: CmsExtraSection[]) => {
    try {
      await updateField(contentKey, 'extraSections', next)
      showToast('Sections updated — live for all visitors.')
    } catch {
      showToast('Could not save sections.', 'error')
    }
  }

  return (
    <div className="cms-extra-sections">
      {sections.map((section, index) => (
        <article key={section.id} className="cms-extra-section bento-card">
          {canEdit ? (
            <div className="cms-extra-section__admin">
              <select
                className="cms-editable__input"
                value={section.type}
                onChange={(e) => {
                  const next = sections.map((row, i) =>
                    i === index ? { ...row, type: e.target.value as CmsExtraSection['type'] } : row,
                  )
                  void persist(next)
                }}
              >
                <option value="content">Content block</option>
                <option value="cta">Call to action</option>
                <option value="banner">Image banner</option>
              </select>
              <button
                type="button"
                className="cms-string-list__remove"
                onClick={() => void persist(sections.filter((row) => row.id !== section.id))}
              >
                <Trash2 size={14} />
                Remove section
              </button>
            </div>
          ) : null}

          {section.type === 'banner' && section.image ? (
            <div className="cms-extra-section__banner">
              {canEdit ? (
                <EditableImage
                  contentKey={contentKey}
                  path={`extraSections.${index}.image`}
                  src={cmsAssetUrl(section.image)}
                  alt=""
                  uploadFolder="banners"
                  className="cms-extra-section__banner-img"
                />
              ) : (
                <img src={cmsAssetUrl(section.image)} alt="" className="cms-extra-section__banner-img" />
              )}
            </div>
          ) : null}

          <div className="cms-extra-section__body">
            <EditableText contentKey={contentKey} path={`extraSections.${index}.eyebrow`} as="span" className="section-label" />
            <EditableText contentKey={contentKey} path={`extraSections.${index}.title`} as="h2" className="display-lg" />
            <EditableText contentKey={contentKey} path={`extraSections.${index}.body`} as="p" className="lead" multiline />

            {section.type === 'banner' && canEdit ? (
              <EditableImage
                contentKey={contentKey}
                path={`extraSections.${index}.image`}
                src={cmsAssetUrl(section.image)}
                alt=""
                uploadFolder="banners"
              />
            ) : null}

            {section.type === 'cta' ? (
              <div className="cta-panel__actions">
                <EditableButton
                  contentKey={contentKey}
                  labelPath={`extraSections.${index}.primaryCtaLabel`}
                  hrefPath={`extraSections.${index}.primaryCtaHref`}
                  to={section.primaryCtaHref || '/contact'}
                  size="lg"
                />
                {section.secondaryCtaLabel ? (
                  <EditableButton
                    contentKey={contentKey}
                    labelPath={`extraSections.${index}.secondaryCtaLabel`}
                    hrefPath={`extraSections.${index}.secondaryCtaHref`}
                    to={section.secondaryCtaHref || '/register'}
                    variant="secondary"
                    size="lg"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </article>
      ))}

      {canEdit ? (
        <div className="cms-extra-sections__add">
          <Button type="button" size="sm" variant="secondary" onClick={() => void persist([...sections, createExtraSection('content')])}>
            <Plus size={14} />
            Add content section
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void persist([...sections, createExtraSection('cta')])}>
            <Plus size={14} />
            Add CTA section
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => void persist([...sections, createExtraSection('banner')])}>
            <Plus size={14} />
            Add image banner
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function CmsExtraSectionsManager({ contentKey }: CmsExtraSectionsProps) {
  const { getBlock } = useSiteContent()
  const sections = getBlock<{ extraSections?: CmsExtraSection[] }>(contentKey).extraSections ?? []
  if (!sections.length) return null
  return (
    <section className="section cms-extra-sections-page">
      <div className="container">
        <CmsExtraSections contentKey={contentKey} />
      </div>
    </section>
  )
}
