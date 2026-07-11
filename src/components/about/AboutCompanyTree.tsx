import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { COMPANY } from '../../lib/constants'
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

export const AboutCompanyTree = forwardRef<HTMLElement>(function AboutCompanyTree(_, ref) {
  return (
    <section ref={ref} className="about-tree" aria-label="Our company story">
      <div className="container">
        <header className="about-tree__intro">
          <span className="section-label">Our Story</span>
          <h2 className="display-lg">How we grow together</h2>
          <p className="about-tree__intro-lead">
            Scroll to grow each branch — every node opens fully before the next one appears.
          </p>
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
                      <img src={`${base}logo.png`} alt="" className="about-tree__logo about-tree__reveal-item" />
                      <span className="about-tree__step-label about-tree__reveal-item">Root</span>
                      <h3 className="about-tree__node-title about-tree__reveal-item">{COMPANY.shortName}</h3>
                      <p className="about-tree__node-subtitle about-tree__reveal-item">{COMPANY.name}</p>
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <p className="about-tree__node-body">{COMPANY.overview}</p>
                      <dl className="about-tree__meta">
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.registration} size={14} />
                            Registration
                          </dt>
                          <dd>{COMPANY.registration}</dd>
                        </div>
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.headOffice} size={14} />
                            Head Office
                          </dt>
                          <dd>{COMPANY.headOffice}</dd>
                        </div>
                        <div>
                          <dt>
                            <TreeIcon icon={ROOT_META_ICONS.reach} size={14} />
                            Reach
                          </dt>
                          <dd>{COMPANY.operationalArea}</dd>
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
                    <span className="about-tree__step-label about-tree__reveal-item">Mission</span>
                    <p className="about-tree__quote about-tree__reveal-item">{COMPANY.mission}</p>
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--right" data-side="right" data-step-index="2">
                <article className="about-tree__node">
                  <div className="about-tree__card bento-card">
                    <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                      <TreeIcon icon={ABOUT_TREE_SECTION_ICONS.vision} />
                    </div>
                    <span className="about-tree__step-label about-tree__reveal-item">Vision</span>
                    <p className="about-tree__node-body about-tree__reveal-item">{COMPANY.vision}</p>
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
                      <span className="about-tree__step-label about-tree__reveal-item">Core Values</span>
                      <h3 className="about-tree__node-heading about-tree__reveal-item">What we stand for</h3>
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <div className="about-tree__cluster about-tree__cluster--values">
                        {COMPANY.coreValues.map((value, i) => {
                          const ValueIcon = CORE_VALUE_ICONS[value]
                          return (
                            <div
                              key={value}
                              className={`about-tree__cluster-item ${i === 0 ? 'about-tree__cluster-item--featured' : ''}`}
                            >
                              <span className="about-tree__cluster-icon" aria-hidden="true">
                                <TreeIcon icon={ValueIcon} size={18} />
                              </span>
                              <div className="about-tree__cluster-copy">
                                <span className="about-tree__cluster-num">0{i + 1}</span>
                                <span className="about-tree__cluster-label">{value}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
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
                      <span className="about-tree__step-label about-tree__reveal-item">Areas of Interest</span>
                      <h3 className="about-tree__node-heading about-tree__reveal-item">What we do</h3>
                    </div>
                    <div className="about-tree__card-scroll" data-lenis-prevent>
                      <div className="about-tree__cluster about-tree__cluster--areas">
                        {COMPANY.areasOfInterest.map((area) => {
                          const AreaIcon = AREA_ICONS[area]
                          return (
                            <div key={area} className="about-tree__cluster-item about-tree__cluster-item--area">
                              <span className="about-tree__cluster-icon about-tree__cluster-icon--area" aria-hidden="true">
                                <TreeIcon icon={AreaIcon} size={16} />
                              </span>
                              <span className="about-tree__cluster-label">{area}</span>
                            </div>
                          )
                        })}
                      </div>
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
                    <span className="about-tree__step-label about-tree__reveal-item">Company Details</span>
                    <h3 className="about-tree__node-heading about-tree__reveal-item">Get in touch</h3>
                    <div className="about-tree__details">
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.type} size={14} />
                          Type
                        </span>
                        <strong>{COMPANY.companyType}</strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.business} size={14} />
                          Business
                        </span>
                        <strong>{COMPANY.businessType}</strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.location} size={14} />
                          Location
                        </span>
                        <strong>{COMPANY.address}</strong>
                      </div>
                      <div className="about-tree__detail-tile">
                        <span>
                          <TreeIcon icon={DETAIL_ICONS.email} size={14} />
                          Email
                        </span>
                        <strong>
                          <Link to="/contact">{COMPANY.email}</Link>
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
