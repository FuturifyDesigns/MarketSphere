import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { COMPANY } from '../lib/constants'
import { Button } from '../components/ui/Button'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

export function About() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = pageRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('.about-hero__content > *', {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power4.out',
      })

      gsap.utils.toArray<HTMLElement>('.about-reveal').forEach((item) => {
        gsap.from(item, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
          },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div className="page about-page" ref={pageRef}>
      <section className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__content">
            <span className="section-label">About Us</span>
            <h1 className="display-xl">
              Building Botswana's<br />
              <em className="text-gold">service marketplace</em>
            </h1>
            <p className="lead">{COMPANY.overview}</p>
            <Button to="/contact" size="lg">
              Work With Us <ArrowRight size={16} />
            </Button>
          </div>
          <div className="about-hero__card bento-card">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="about-hero__logo" />
            <h3>{COMPANY.name}</h3>
            <dl className="about-hero__meta">
              <div><dt>Registration</dt><dd>{COMPANY.registration}</dd></div>
              <div><dt>Head Office</dt><dd>{COMPANY.headOffice}</dd></div>
              <div><dt>Reach</dt><dd>{COMPANY.operationalArea}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container mission-grid">
          <article className="mission-card bento-card about-reveal">
            <span className="section-label">Mission</span>
            <p className="mission-card__text">{COMPANY.mission}</p>
          </article>
          <article className="mission-card bento-card about-reveal">
            <span className="section-label">Vision</span>
            <p className="mission-card__text mission-card__text--body">{COMPANY.vision}</p>
          </article>
        </div>
      </section>

      <section className="section section--values">
        <div className="container">
          <div className="section-header about-reveal">
            <span className="section-label">Core Values</span>
            <h2 className="display-lg">What we stand for</h2>
          </div>
          <div className="values-bento">
            {COMPANY.coreValues.map((value, i) => (
              <div key={value} className={`value-tile bento-card about-reveal ${i === 0 ? 'value-tile--featured' : ''}`}>
                <span className="value-tile__num">0{i + 1}</span>
                <span className="value-tile__name">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header about-reveal">
            <span className="section-label">Areas of Interest</span>
            <h2 className="display-lg">What we do</h2>
          </div>
          <div className="interests-grid">
            {COMPANY.areasOfInterest.map((area) => (
              <div key={area} className="interest-item bento-card about-reveal">
                <span>{area}</span>
                <ArrowRight size={16} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="details-panel bento-card about-reveal">
            <h3>Company Details</h3>
            <div className="details-grid">
              <div><span>Type</span><strong>{COMPANY.companyType}</strong></div>
              <div><span>Business</span><strong>{COMPANY.businessType}</strong></div>
              <div><span>Location</span><strong>{COMPANY.address}</strong></div>
              <div><span>Email</span><strong><Link to="/contact">{COMPANY.email}</Link></strong></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
