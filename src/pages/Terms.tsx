import { Link } from 'react-router-dom'
import { COMPANY } from '../lib/constants'
import './Legal.css'

const LAST_UPDATED = '13 July 2025'

export function Terms() {
  return (
    <div className="page legal-page">
      <header className="legal-hero">
        <div className="container legal-hero__inner page-enter-hero">
          <span className="section-label">Legal</span>
          <h1>Terms of Service</h1>
          <p className="legal-hero__meta">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <div className="legal-body">
        <div className="container legal-body__inner">
          <section className="legal-callout">
            <p>
              These Terms govern your use of the Market Sphere Group website and marketplace operated
              by {COMPANY.name}. By creating an account or using the platform, you agree to these Terms
              and our <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2>1. About the platform</h2>
            <p>
              Market Sphere Group is an online directory and enquiry platform that connects customers
              with independent service providers. We facilitate discovery and communication but are
              not a party to contracts between customers and providers unless expressly stated otherwise.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old and capable of entering a binding agreement under
              Botswana law. By registering, you confirm that the information you provide is accurate
              and kept up to date.
            </p>
          </section>

          <section>
            <h2>3. Accounts</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
              <li>You must notify us promptly of any unauthorised use of your account</li>
              <li>We may suspend or terminate accounts that violate these Terms or applicable law</li>
              <li>Customers and providers must register under the appropriate account type</li>
            </ul>
          </section>

          <section>
            <h2>4. Provider listings</h2>
            <p>Service providers agree that:</p>
            <ul>
              <li>Business information, images, and descriptions are truthful and not misleading</li>
              <li>They hold any licences or permits required for their services</li>
              <li>They will respond to enquiries in a professional and timely manner</li>
              <li>We may review, approve, reject, or remove listings to protect marketplace quality</li>
            </ul>
          </section>

          <section>
            <h2>5. Customer use</h2>
            <p>Customers may browse listings, save favourites, and submit enquiries. Any booking, payment, or service delivery arrangement is directly between the customer and the provider unless we state otherwise in writing.</p>
          </section>

          <section>
            <h2>6. Payments</h2>
            <p>
              Market Sphere Group does not process payments between customers and providers on the
              platform. Payment terms are agreed directly between the parties. We are not responsible
              for pricing disputes, refunds, or service quality unless required by law.
            </p>
          </section>

          <section>
            <h2>7. Acceptable use</h2>
            <p>You must not:</p>
            <ul>
              <li>Use the platform for unlawful, fraudulent, or harmful activity</li>
              <li>Upload offensive, infringing, or malicious content</li>
              <li>Attempt to gain unauthorised access to systems or other users&apos; accounts</li>
              <li>Scrape, spam, or interfere with normal platform operation</li>
              <li>Misrepresent your identity, business, or qualifications</li>
            </ul>
          </section>

          <section>
            <h2>8. Intellectual property</h2>
            <p>
              The Market Sphere Group brand, website design, and platform content are owned by or
              licensed to {COMPANY.name}. Providers retain ownership of content they upload but grant
              us a licence to display it on the platform for marketplace purposes.
            </p>
          </section>

          <section>
            <h2>9. Disclaimer</h2>
            <p>
              The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While we verify
              providers before listing, we do not guarantee the quality, safety, legality, or outcome
              of any service arranged through the platform.
            </p>
          </section>

          <section>
            <h2>10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by Botswana law, {COMPANY.name} is not liable for indirect,
              incidental, or consequential losses arising from use of the platform or dealings with
              other users. Nothing in these Terms limits liability that cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2>11. Termination</h2>
            <p>
              You may stop using the platform at any time. We may suspend or terminate access where
              these Terms are breached, where required by law, or to protect users and the integrity
              of the marketplace.
            </p>
          </section>

          <section>
            <h2>12. Governing law</h2>
            <p>
              These Terms are governed by the laws of the Republic of Botswana. Disputes shall be
              subject to the exclusive jurisdiction of the courts of Botswana, unless mandatory law
              provides otherwise.
            </p>
          </section>

          <section>
            <h2>13. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use after changes are published
              constitutes acceptance of the revised Terms where permitted by law.
            </p>
          </section>

          <section>
            <h2>14. Contact</h2>
            <p>
              Questions about these Terms? Contact {COMPANY.name} at{' '}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or through our{' '}
              <Link to="/contact">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
