import { Link } from 'react-router-dom'
import { LegalDocument } from '../components/legal/LegalDocument'
import { COMPANY } from '../lib/constants'
import { COOKIE_POLICY_VERSION } from '../lib/cookieConsent'

const LAST_UPDATED = '13 July 2025'

const PRIVACY_SECTIONS = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          {COMPANY.name} operates the Market Sphere Group online marketplace connecting customers
          with verified service providers in Botswana and the wider SADC region.
        </p>
        <p>
          <strong>Registered address:</strong> {COMPANY.address}
          <br />
          <strong>Registration:</strong> {COMPANY.registration}
          <br />
          <strong>Email:</strong> <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'Personal data we collect',
    content: (
      <>
        <p>Depending on how you use the platform, we may process:</p>
        <ul>
          <li>Identity and contact details (name, email, phone number)</li>
          <li>Account credentials and profile information</li>
          <li>Provider business details, descriptions, logos, gallery images, and cover photos</li>
          <li>Enquiries, messages, and contact form submissions</li>
          <li>Technical data such as browser type, device information, and security logs</li>
          <li>Cookie and consent preferences stored on your device</li>
        </ul>
      </>
    ),
  },
  {
    id: 'legal-bases',
    title: 'Legal bases for processing',
    content: (
      <>
        <p>We process personal data only where a lawful basis applies under the Data Protection Act, including:</p>
        <ul>
          <li><strong>Consent</strong> — for optional cookies and where you explicitly agree during registration</li>
          <li><strong>Contract</strong> — to create and manage your account and provide platform services</li>
          <li><strong>Legal obligation</strong> — where required by applicable law</li>
          <li><strong>Legitimate interests</strong> — to secure the platform and improve services, balanced against your rights</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-data',
    title: 'How we use personal data',
    content: (
      <ul>
        <li>Creating and administering user accounts</li>
        <li>Displaying provider listings and enabling customer enquiries</li>
        <li>Reviewing provider applications and maintaining marketplace quality</li>
        <li>Responding to support and contact requests</li>
        <li>Protecting users, preventing fraud, and maintaining platform security</li>
        <li>Complying with legal and regulatory requirements</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <>
        <h3>Essential cookies</h3>
        <p>
          Required for authentication, session management, security, and remembering your cookie
          preference. These are always active because the site cannot function properly without them.
        </p>
        <h3>Optional cookies</h3>
        <p>
          Used only for analytics, performance measurement, or similar improvements. Optional cookies
          are not activated until you opt in through our cookie banner. You may withdraw consent at
          any time via <strong>Cookie Settings</strong> in the footer.
        </p>
        <p>We maintain a record of your consent choice and the date it was given.</p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Data sharing and processors',
    content: (
      <>
        <p>We may share personal data with trusted service providers who process data on our behalf, including:</p>
        <ul>
          <li>Cloud hosting and database services (including Supabase for authentication and data storage)</li>
          <li>Email delivery providers for account verification and notifications</li>
        </ul>
        <p>These processors are engaged under appropriate contractual safeguards. We do not sell your personal data.</p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    content: (
      <>
        <p>
          Some service providers may store or process data outside Botswana. Where personal data is
          transferred internationally, we take steps required under the Data Protection Act, 2024 —
          including obtaining your explicit consent where required and ensuring appropriate safeguards.
        </p>
        <p>Where the law requires it, we also maintain accessible copies of personal data within Botswana.</p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'Retention',
    content: (
      <>
        <p>We retain personal data only for as long as necessary, including:</p>
        <ul>
          <li>Account data — while your account is active and for a reasonable period after closure</li>
          <li>Provider listings — while published and as needed for legal or dispute purposes</li>
          <li>Contact and enquiry records — typically up to 24 months unless a longer period is required</li>
          <li>Consent logs — retained to demonstrate compliance with cookie and privacy requirements</li>
        </ul>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    content: (
      <>
        <p>Under the Data Protection Act, 2024, you have rights including:</p>
        <ul>
          <li>Right to be informed about how your data is processed</li>
          <li>Right of access to your personal data</li>
          <li>Right to correction of inaccurate or incomplete data</li>
          <li>Right to erasure in certain circumstances</li>
          <li>Right to object to certain processing</li>
          <li>Right to withdraw consent at any time</li>
          <li>Right to lodge a complaint with the Information and Data Protection Commission</li>
        </ul>
        <p>
          To exercise your rights, contact us at{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <p>
        We implement appropriate technical and organisational measures to protect personal data against
        unauthorised access, loss, misuse, or alteration. We encourage you to use a strong password
        and keep your login details confidential.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        Our platform is not directed at children under 18. If you believe we have collected personal
        data from a child without appropriate consent, please contact us so we can take prompt action.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected on
        this page with an updated date. Where required, we will seek renewed consent.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          For privacy or data protection enquiries, contact {COMPANY.name} at{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or via our{' '}
          <Link to="/contact">contact page</Link>.
        </p>
        <p>You may also contact the Information and Data Protection Commission if you are not satisfied with our response.</p>
      </>
    ),
  },
]

export function Privacy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      subtitle="How Market Sphere Group collects, uses, and protects your personal data under Botswana law."
      meta={`Last updated: ${LAST_UPDATED} · Policy version ${COOKIE_POLICY_VERSION}`}
      showCookieAction
      intro={
        <p>
          {COMPANY.name} (&quot;Market Sphere Group&quot;, &quot;we&quot;, &quot;us&quot;) processes personal
          data in accordance with the <strong>Data Protection Act, 2024</strong> of Botswana and
          regulations issued by the Information and Data Protection Commission (IDPC).
        </p>
      }
      sections={PRIVACY_SECTIONS}
    />
  )
}
