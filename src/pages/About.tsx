import { motion } from 'framer-motion'
import { COMPANY } from '../lib/constants'
import './About.css'

export function About() {
  return (
    <div className="page about-page">
      <section className="page-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow">About Us</span>
            <h1>{COMPANY.name}</h1>
            <p className="lead">{COMPANY.overview}</p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-block">
            <h2>Mission</h2>
            <p className="about-highlight">{COMPANY.mission}</p>
          </div>
          <div className="about-block">
            <h2>Vision</h2>
            <p>{COMPANY.vision}</p>
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <h2 className="section-title">Core Values</h2>
          <div className="values-grid">
            {COMPANY.coreValues.map((value) => (
              <div key={value} className="value-chip">{value}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Areas of Interest</h2>
          <ul className="interest-list">
            {COMPANY.areasOfInterest.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container about-details">
          <div className="detail-item">
            <span className="detail-label">Registration</span>
            <span>{COMPANY.registration}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Head Office</span>
            <span>{COMPANY.headOffice}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Operational Area</span>
            <span>{COMPANY.operationalArea}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Company Type</span>
            <span>{COMPANY.companyType}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Business Type</span>
            <span>{COMPANY.businessType}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
