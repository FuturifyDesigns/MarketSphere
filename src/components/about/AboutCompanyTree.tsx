import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Eye, Sparkles, Target } from 'lucide-react'
import { COMPANY } from '../../lib/constants'
import './AboutCompanyTree.css'

const base = import.meta.env.BASE_URL

export const AboutCompanyTree = forwardRef<HTMLElement>(function AboutCompanyTree(_, ref) {
  return (
    <section ref={ref} className="about-tree" aria-label="Our company story">
      <svg className="about-tree__svg" aria-hidden="true">
        <g className="about-tree__paths" />
      </svg>

      <div className="about-tree__spine" aria-hidden="true" />

      <div className="container about-tree__inner">
        <header className="about-tree__intro">
          <span className="section-label">Our Story</span>
          <h2 className="display-lg">How we grow together</h2>
          <p className="about-tree__intro-lead">
            Scroll through the branches — each node is a part of who we are and what we stand for.
          </p>
        </header>

        <div className="about-tree__steps">
          <div className="about-tree__step about-tree__step--root" data-side="center">
            <span className="about-tree__joint about-tree__joint--spine" aria-hidden="true" />
            <article className="about-tree__node about-tree__node--root bento-card">
              <img src={`${base}logo.png`} alt="" className="about-tree__logo" />
              <span className="section-label">Root</span>
              <h3 className="about-tree__node-title">{COMPANY.shortName}</h3>
              <p className="about-tree__node-subtitle">{COMPANY.name}</p>
              <p className="about-tree__node-body">{COMPANY.overview}</p>
              <dl className="about-tree__meta">
                <div>
                  <dt>Registration</dt>
                  <dd>{COMPANY.registration}</dd>
                </div>
                <div>
                  <dt>Head Office</dt>
                  <dd>{COMPANY.headOffice}</dd>
                </div>
                <div>
                  <dt>Reach</dt>
                  <dd>{COMPANY.operationalArea}</dd>
                </div>
              </dl>
            </article>
          </div>

          <div className="about-tree__step about-tree__step--left" data-side="left">
            <span className="about-tree__joint" aria-hidden="true" />
            <article className="about-tree__node bento-card">
              <div className="about-tree__node-icon" aria-hidden="true">
                <Target size={20} />
              </div>
              <span className="section-label">Mission</span>
              <p className="about-tree__quote">{COMPANY.mission}</p>
            </article>
          </div>

          <div className="about-tree__step about-tree__step--right" data-side="right">
            <span className="about-tree__joint" aria-hidden="true" />
            <article className="about-tree__node bento-card">
              <div className="about-tree__node-icon" aria-hidden="true">
                <Eye size={20} />
              </div>
              <span className="section-label">Vision</span>
              <p className="about-tree__node-body">{COMPANY.vision}</p>
            </article>
          </div>

          <div className="about-tree__step about-tree__step--center" data-side="center">
            <span className="about-tree__joint" aria-hidden="true" />
            <article className="about-tree__node about-tree__node--wide bento-card">
              <div className="about-tree__node-icon" aria-hidden="true">
                <Sparkles size={20} />
              </div>
              <span className="section-label">Core Values</span>
              <h3 className="about-tree__node-heading">What we stand for</h3>
              <div className="about-tree__cluster about-tree__cluster--values">
                {COMPANY.coreValues.map((value, i) => (
                  <div
                    key={value}
                    className={`about-tree__cluster-item ${i === 0 ? 'about-tree__cluster-item--featured' : ''}`}
                  >
                    <span className="about-tree__cluster-num">0{i + 1}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="about-tree__step about-tree__step--center" data-side="center">
            <span className="about-tree__joint" aria-hidden="true" />
            <article className="about-tree__node about-tree__node--wide bento-card">
              <span className="section-label">Areas of Interest</span>
              <h3 className="about-tree__node-heading">What we do</h3>
              <div className="about-tree__cluster about-tree__cluster--areas">
                {COMPANY.areasOfInterest.map((area) => (
                  <div key={area} className="about-tree__cluster-item about-tree__cluster-item--area">
                    <span>{area}</span>
                    <ArrowRight size={14} />
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="about-tree__step about-tree__step--center about-tree__step--last" data-side="center">
            <span className="about-tree__joint" aria-hidden="true" />
            <article className="about-tree__node bento-card">
              <div className="about-tree__node-icon" aria-hidden="true">
                <Building2 size={20} />
              </div>
              <span className="section-label">Company Details</span>
              <h3 className="about-tree__node-heading">Get in touch</h3>
              <div className="about-tree__details">
                <div>
                  <span>Type</span>
                  <strong>{COMPANY.companyType}</strong>
                </div>
                <div>
                  <span>Business</span>
                  <strong>{COMPANY.businessType}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{COMPANY.address}</strong>
                </div>
                <div>
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
    </section>
  )
})
