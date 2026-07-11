import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Eye, Sparkles, Target } from 'lucide-react'
import { COMPANY } from '../../lib/constants'
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

            <div className="about-tree__spine" aria-hidden="true" />

            <div className="about-tree__steps">
              <div className="about-tree__step about-tree__step--root" data-side="center">
                <span className="about-tree__joint about-tree__joint--spine" aria-hidden="true" />
                <article className="about-tree__node about-tree__node--root bento-card">
                  <img src={`${base}logo.png`} alt="" className="about-tree__logo" />
                  <span className="section-label">Root</span>
                  <h3 className="about-tree__node-title">{COMPANY.shortName}</h3>
                  <p className="about-tree__node-subtitle">{COMPANY.name}</p>
                  <p className="about-tree__node-body about-tree__reveal-item">{COMPANY.overview}</p>
                  <dl className="about-tree__meta">
                    <div className="about-tree__reveal-item">
                      <dt>Registration</dt>
                      <dd>{COMPANY.registration}</dd>
                    </div>
                    <div className="about-tree__reveal-item">
                      <dt>Head Office</dt>
                      <dd>{COMPANY.headOffice}</dd>
                    </div>
                    <div className="about-tree__reveal-item">
                      <dt>Reach</dt>
                      <dd>{COMPANY.operationalArea}</dd>
                    </div>
                  </dl>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left" data-side="left">
                <span className="about-tree__joint" aria-hidden="true" />
                <article className="about-tree__node bento-card">
                  <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                    <Target size={20} />
                  </div>
                  <span className="section-label about-tree__reveal-item">Mission</span>
                  <p className="about-tree__quote about-tree__reveal-item">{COMPANY.mission}</p>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--right" data-side="right">
                <span className="about-tree__joint" aria-hidden="true" />
                <article className="about-tree__node bento-card">
                  <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                    <Eye size={20} />
                  </div>
                  <span className="section-label about-tree__reveal-item">Vision</span>
                  <p className="about-tree__node-body about-tree__reveal-item">{COMPANY.vision}</p>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left" data-side="left">
                <span className="about-tree__joint" aria-hidden="true" />
                <article className="about-tree__node about-tree__node--wide bento-card">
                  <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                    <Sparkles size={20} />
                  </div>
                  <span className="section-label about-tree__reveal-item">Core Values</span>
                  <h3 className="about-tree__node-heading about-tree__reveal-item">What we stand for</h3>
                  <div className="about-tree__cluster about-tree__cluster--values">
                    {COMPANY.coreValues.map((value, i) => (
                      <div
                        key={value}
                        className={`about-tree__cluster-item about-tree__reveal-item ${i === 0 ? 'about-tree__cluster-item--featured' : ''}`}
                      >
                        <span className="about-tree__cluster-num">0{i + 1}</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--right" data-side="right">
                <span className="about-tree__joint" aria-hidden="true" />
                <article className="about-tree__node about-tree__node--wide bento-card">
                  <span className="section-label about-tree__reveal-item">Areas of Interest</span>
                  <h3 className="about-tree__node-heading about-tree__reveal-item">What we do</h3>
                  <div className="about-tree__cluster about-tree__cluster--areas">
                    {COMPANY.areasOfInterest.map((area) => (
                      <div key={area} className="about-tree__cluster-item about-tree__cluster-item--area about-tree__reveal-item">
                        <span>{area}</span>
                        <ArrowRight size={14} />
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="about-tree__step about-tree__step--left about-tree__step--last" data-side="left">
                <span className="about-tree__joint" aria-hidden="true" />
                <article className="about-tree__node bento-card">
                  <div className="about-tree__node-icon about-tree__reveal-item" aria-hidden="true">
                    <Building2 size={20} />
                  </div>
                  <span className="section-label about-tree__reveal-item">Company Details</span>
                  <h3 className="about-tree__node-heading about-tree__reveal-item">Get in touch</h3>
                  <div className="about-tree__details">
                    <div className="about-tree__reveal-item">
                      <span>Type</span>
                      <strong>{COMPANY.companyType}</strong>
                    </div>
                    <div className="about-tree__reveal-item">
                      <span>Business</span>
                      <strong>{COMPANY.businessType}</strong>
                    </div>
                    <div className="about-tree__reveal-item">
                      <span>Location</span>
                      <strong>{COMPANY.address}</strong>
                    </div>
                    <div className="about-tree__reveal-item">
                      <span>Email</span>
                      <strong>
                        <Link to="/contact">{COMPANY.email}</Link>
                      </strong>
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
