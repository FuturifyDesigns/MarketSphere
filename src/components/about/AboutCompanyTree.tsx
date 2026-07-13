import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LOGO_PATH } from '../../lib/constants'
import { useSiteContent } from '../../context/SiteContentContext'
import type { CmsStringItem } from '../../lib/cmsTypes'
import { EditableText } from '../cms/EditableText'
import { CmsStringList } from '../cms/CmsStringList'
import {
  ABOUT_TREE_SECTION_ICONS,
  AREA_ICONS,
  CORE_VALUE_ICONS,
  DETAIL_ICONS,
  ROOT_META_ICONS,
  TreeIcon,
} from './aboutTreeIcons'
import './AboutCompanyTree.css'

const base = import.meta.env.BASE_URL

type AboutTreeBlock = {
  introEyebrow: string
  introTitle: string
  introLead: string
  rootTitle: string
  rootSubtitle: string
  rootBody: string
  missionLabel: string
  mission: string
  visionLabel: string
  vision: string
  valuesLabel: string
  valuesHeading: string
  coreValues: CmsStringItem[]
  areasLabel: string
  areasHeading: string
  areas: CmsStringItem[]
  detailsLabel: string
  detailsHeading: string
  companyType: string
  businessType: string
}

function valueIcon(value: string): LucideIcon {
  const icons = CORE_VALUE_ICONS as Record<string, LucideIcon>
  return icons[value] ?? ABOUT_TREE_SECTION_ICONS.values
}

function areaIcon(area: string): LucideIcon {
  const icons = AREA_ICONS as Record<string, LucideIcon>
  return icons[area] ?? ABOUT_TREE_SECTION_ICONS.areas
}

export const AboutCompanyTree = forwardRef<HTMLElement>(function AboutCompanyTree(_, ref) {
  const { getBlock } = useSiteContent()
  const about = getBlock<{ tree: AboutTreeBlock }>('about')
  const tree = about.tree

  return (
    <section ref={ref} className="about-tree" aria-label="Our company story">
      <div className="container">
        <header className="about-tree__intro">
          <EditableText contentKey="about" path="tree.introEyebrow" as="span" className="section-label" />
          <EditableText contentKey="about" path="tree.introTitle" as="h2" className="display-lg" />
          <EditableText contentKey="about" path="tree.introLead" as="p" className="about-tree__intro-lead" multiline />
        </header>
      </div>

      <div className="about-tree__stage">
        <div className="about-tree__pin">
          <div className="about-tree__canvas container">
            <svg className="about-tree__svg" aria-hidden="true">
              <g className="about-tree__paths" />
            </svg>

            <div className="about-tree__spine-hub" aria-hidden="true" />

            <div className="about-tree__steps">
              <div className="about-tree__step about-tree__step--right" data-side="right" data-step-index="0">
                <article className="about-tree__node about-tree__node--root">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__card-head">
                      <img src={`${base}${LOGO_PATH}`} alt="" className="about-tree__logo about-tree__reveal-item" loading="eager" decoding="sync" />
                      <span className="about-tree__step-label about-tree__reveal-item">Root</span>
                      <EditableText contentKey="about" path="tree.rootTitle" as="h3" className="about-tree__node-title about-tree__reveal-item" />
                      <EditableText contentKey="about" path="tree.rootSubtitle" as="p" className="about-tree__node-subtitle about-tree__reveal-item" />
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <EditableText contentKey="about" path="tree.rootBody" as="p" className="about-tree__node-body" multiline />
                      <dl className="about-tree__meta">
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.registration} size={14} />
                            Registration
                          </dt>
                          <dd><EditableText contentKey="company" path="registration" as="span" /></dd>
                        </div>
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.headOffice} size={14} />
                            Head Office
                          </dt>
                          <dd><EditableText contentKey="company" path="headOffice" as="span" multiline /></dd>
                        </div>
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.reach} size={14} />
                            Reach
                          </dt>
                          <dd><EditableText contentKey="company" path="operationalArea" as="span" /></dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left" data-side="left" data-step-index="1">
                <article className="about-tree__node">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                      <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.mission} />
                    </div>
                    <EditableText contentKey="about" path="tree.missionLabel" as="span" className="about-tree__step-label about-tree__reveal-item" />
                    <EditableText contentKey="about" path="tree.mission" as="p" className="about-tree__quote about-tree__reveal-item" multiline />
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--right" data-side="right" data-step-index="2">
                <article className="about-tree__node">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                      <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.vision} />
                    </div>
                    <EditableText contentKey="about" path="tree.visionLabel" as="span" className="about-tree__step-label about-tree__reveal-item" />
                    <EditableText contentKey="about" path="tree.vision" as="p" className="about-tree__node-body about-tree__reveal-item" multiline />
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left" data-side="left" data-step-index="3">
                <article className="about-tree__node about-tree__node--wide">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__card-head">
                      <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                        <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.values} />
                      </div>
                      <EditableText contentKey="about" path="tree.valuesLabel" as="span" className="about-tree__step-label about-tree__reveal-item" />
                      <EditableText contentKey="about" path="tree.valuesHeading" as="h3" className="about-tree__node-heading about-tree__reveal-item" />
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <div className="about-tree__cluster about-tree__cluster--values">
                        {(tree.coreValues || []).map((value, i) => {
                          const ValueIcon = valueIcon(value.text)
                          return (
                            <div
                              key={value.id}
                              className={`about-tree__cluster-item ${i === 0 ? 'about-tree__cluster-item--featured' : ''}`}
                            >
                              <span className="about-tree__cluster-icon" aria-hidden="true">
                                <TreeIcon icon={ValueIcon} size={18} />
                              </span>
                              <div className="about-tree__cluster-copy">
                                <span className="about-tree__cluster-num">0{i + 1}</span>
                                <EditableText contentKey="about" path={`tree.coreValues.${i}.text`} as="span" className="about-tree__cluster-label" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <CmsStringList contentKey="about" path="tree.coreValues" items={tree.coreValues || []} placeholder="Core value" />
                    </div>
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--right" data-side="right" data-step-index="4">
                <article className="about-tree__node about-tree__node--wide">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__card-head">
                      <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                        <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.areas} />
                      </div>
                      <EditableText contentKey="about" path="tree.areasLabel" as="span" className="about-tree__step-label about-tree__reveal-item" />
                      <EditableText contentKey="about" path="tree.areasHeading" as="h3" className="about-tree__node-heading about-tree__reveal-item" />
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <div className="about-tree__cluster about-tree__cluster--areas">
                        {(tree.areas || []).map((area, areaIndex) => {
                          const AreaIcon = areaIcon(area.text)
                          return (
                            <div key={area.id} className="about-tree__cluster-item about-tree__cluster-item--area">
                              <span className="about-tree__cluster-icon about-tree__cluster-icon--area" aria-hidden="true">
                                <TreeIcon icon={AreaIcon} size={16} />
                              </span>
                              <EditableText contentKey="about" path={`tree.areas.${areaIndex}.text`} as="span" className="about-tree__cluster-label" />
                            </div>
                          )
                        })}
                      </div>
                      <CmsStringList contentKey="about" path="tree.areas" items={tree.areas || []} placeholder="Area of interest" />
                    </div>
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left about-tree__step--last" data-side="left" data-step-index="5">
                <article className="about-tree__node">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                      <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.details} />
                    </div>
                    <EditableText contentKey="about" path="tree.detailsLabel" as="span" className="about-tree__step-label about-tree__reveal-item" />
                    <EditableText contentKey="about" path="tree.detailsHeading" as="h3" className="about-tree__node-heading about-tree__reveal-item" />
                    <div className="about-tree__details">
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.type} size={14} />
                          Type
                        </span>
                        <strong><EditableText contentKey="about" path="tree.companyType" as="span" /></strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.business} size={14} />
                          Business
                        </span>
                        <strong><EditableText contentKey="about" path="tree.businessType" as="span" /></strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.location} size={14} />
                          Location
                        </span>
                        <strong><EditableText contentKey="company" path="address" as="span" multiline /></strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.email} size={14} />
                          Email
                        </span>
                        <strong>
                          <Link to="/contact"><EditableText contentKey="company" path="email" as="span" /></Link>
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
