import { Link } from 'react-router-dom'
import { LegalDocument } from '../components/legal/LegalDocument'
import { COMPANY } from '../lib/constants'

const LAST_UPDATED = '13 July 2025'

const TERMS_SECTIONS = [
  {
    id: 'about-platform',
    title: 'About the platform',
    content: (
      <p>
        Market Sphere Group is an online directory and enquiry platform that connects customers with
        independent service providers. We facilitate discovery and communication but are not a party
        to contracts between customers and providers unless expressly stated otherwise.
      </p>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    content: (
      <p>
        You must be at least 18 years old and capable of entering a binding agreement under Botswana
        law. By registering, you confirm that the information you provide is accurate and kept up to date.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts',
    content: (
      <ul>
        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
        <li>You must notify us promptly of any unauthorised use of your account</li>
        <li>We may suspend or terminate accounts that violate these Terms or applicable law</li>
        <li>Customers and providers must register under the appropriate account type</li>
      </ul>
    ),
  },
  {
    id: 'provider-listings',
    title: 'Provider listings',
    content: (
      <>
        <p>Service providers agree that:</p>
        <ul>
          <li>Business information, images, and descriptions are truthful and not misleading</li>
          <li>They hold any licences or permits required for their services</li>
          <li>They will respond to enquiries in a professional and timely manner</li>
          <li>We may review, approve, reject, or remove listings to protect marketplace quality</li>
        </ul>
      </>
    ),
  },
  {
    id: 'customer-use',
    title: 'Customer use',
    content: (
      <p>
        Customers may browse listings, save favourites, and submit enquiries. Any booking, payment, or
        service delivery arrangement is directly between the customer and the provider unless we state
        otherwise in writing.
      </p>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    content: (
      <p>
        Market Sphere Group does not process payments between customers and providers on the platform.
        Payment terms are agreed directly between the parties. We are not responsible for pricing
        disputes, refunds, or service quality unless required by law.
      </p>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    content: (
      <>
        <p>You must not:</p>
        <ul>
          <li>Use the platform for unlawful, fraudulent, or harmful activity</li>
          <li>Upload offensive, infringing, or malicious content</li>
          <li>Attempt to gain unauthorised access to systems or other users&apos; accounts</li>
          <li>Scrape, spam, or interfere with normal platform operation</li>
          <li>Misrepresent your identity, business, or qualifications</li>
        </ul>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    content: (
      <p>
        The Market Sphere Group brand, website design, and platform content are owned by or licensed
        to {COMPANY.name}. Providers retain ownership of content they upload but grant us a licence to
        display it on the platform for marketplace purposes.
      </p>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    content: (
      <p>
        The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While we verify
        providers before listing, we do not guarantee the quality, safety, legality, or outcome of any
        service arranged through the platform.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <p>
        To the fullest extent permitted by Botswana law, {COMPANY.name} is not liable for indirect,
        incidental, or consequential losses arising from use of the platform or dealings with other
        users. Nothing in these Terms limits liability that cannot be excluded by law.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    content: (
      <p>
        You may stop using the platform at any time. We may suspend or terminate access where these
        Terms are breached, where required by law, or to protect users and the integrity of the
        marketplace.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    content: (
      <p>
        These Terms are governed by the laws of the Republic of Botswana. Disputes shall be subject to
        the exclusive jurisdiction of the courts of Botswana, unless mandatory law provides otherwise.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    content: (
      <p>
        We may update these Terms from time to time. Continued use after changes are published
        constitutes acceptance of the revised Terms where permitted by law.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions about these Terms? Contact {COMPANY.name} at{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or through our{' '}
        <Link to="/contact">contact page</Link>.
      </p>
    ),
  },
]

export function Terms() {
  return (
    <LegalDocument
      title="Terms of Service"
      subtitle="The rules and responsibilities for using the Market Sphere Group marketplace."
      meta={`Last updated: ${LAST_UPDATED}`}
      intro={
        <p>
          These Terms govern your use of the Market Sphere Group website and marketplace operated by{' '}
          {COMPANY.name}. By creating an account or using the platform, you agree to these Terms and
          our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      }
      sections={TERMS_SECTIONS}
    />
  )
}
