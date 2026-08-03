import { useEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Download, ShieldCheck, Bell, MailOpen, Smartphone } from 'lucide-react'
import { LOGO_PATH } from '../lib/constants'
import './AppDownload.css'

gsap.registerPlugin(ScrollTrigger)

const APK_HREF = '/app/market-sphere.apk'
const APP_VERSION = '1.0.0'

const STEPS = [
  {
    id: 'download',
    kicker: '01 · Download',
    title: 'Get the Android APK',
    body: 'Tap Download on this page. Your phone saves Market Sphere as an installable file.',
  },
  {
    id: 'install',
    kicker: '02 · Install',
    title: 'Allow this install',
    body: 'Android may ask to allow installs from your browser. Turn it on, then open the APK.',
  },
  {
    id: 'open',
    kicker: '03 · Open',
    title: 'Launch Market Sphere',
    body: 'Open the app. Browse showcase listings and providers — even as a guest.',
  },
  {
    id: 'email',
    kicker: '04 · Confirm email',
    title: 'Verify your account',
    body: 'After you create an account, open the confirmation email and tap Confirm — it opens the app.',
  },
  {
    id: 'notify',
    kicker: '05 · Notifications',
    title: 'Stay in the loop',
    body: 'Allow notifications so new listings, enquiries, and reminders can reach you.',
  },
  {
    id: 'ready',
    kicker: '06 · Ready',
    title: 'You’re set',
    body: 'Sign in and explore. Prefer an area in Settings so feeds prioritise where you are.',
  },
] as const

export function AppDownload() {
  const rootRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    const pin = pinRef.current
    const track = trackRef.current
    if (!root || !pin || !track) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.from('.appdl-hero__brand, .appdl-hero__title, .appdl-hero__lead, .appdl-hero__actions, .appdl-hero__meta', {
        autoAlpha: 0,
        y: 28,
        duration: reduce ? 0.01 : 0.75,
        stagger: reduce ? 0 : 0.08,
        ease: 'power3.out',
        delay: 0.05,
      })

      const cards = gsap.utils.toArray<HTMLElement>('.appdl-step', track)
      if (cards.length < 2) return

      const getScrollLength = () => Math.max(0, track.scrollWidth - pin.clientWidth + 48)

      if (reduce) {
        gsap.set(cards, { autoAlpha: 1, x: 0 })
        return
      }

      gsap.set(cards, { autoAlpha: 0.35, y: 36 })
      gsap.set(cards[0], { autoAlpha: 1, y: 0 })

      const tween = gsap.to(track, {
        x: () => -getScrollLength(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top+=72',
          end: () => `+=${getScrollLength() * 1.15}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const i = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)))
            setActive((prev) => (prev === i ? prev : i))
            cards.forEach((card, idx) => {
              const dist = Math.abs(idx - self.progress * (cards.length - 1))
              gsap.to(card, {
                autoAlpha: dist < 0.55 ? 1 : 0.38,
                y: dist < 0.55 ? 0 : 22,
                scale: dist < 0.55 ? 1 : 0.96,
                duration: 0.35,
                overwrite: 'auto',
              })
            })
          },
        },
      })

      gsap.from(cards, {
        x: 80,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: pin,
          start: 'top 80%',
          once: true,
        },
      })

      void tween
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <main className="appdl" ref={rootRef}>
      <section className="appdl-hero">
        <div className="appdl-hero__glow" aria-hidden="true" />
        <div className="container appdl-hero__inner">
          <div className="appdl-hero__copy">
            <p className="appdl-hero__brand">
              <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" width={40} height={40} />
              Market Sphere Group
            </p>
            <h1 className="appdl-hero__title">Get the Android app</h1>
            <p className="appdl-hero__lead">
              Install Market Sphere on your phone — browse showcase listings, message providers, and
              get alerts when something new lands.
            </p>
            <div className="appdl-hero__actions">
              <a className="btn btn--primary btn--lg" href={APK_HREF} download="market-sphere.apk">
                <Download size={18} aria-hidden /> Download APK
              </a>
              <a className="btn btn--secondary btn--lg" href="#setup">
                See setup steps
              </a>
            </div>
            <ul className="appdl-hero__meta">
              <li>
                <Smartphone size={16} aria-hidden /> Android
              </li>
              <li>
                <ShieldCheck size={16} aria-hidden /> Version {APP_VERSION}
              </li>
              <li>
                <Bell size={16} aria-hidden /> Push ready
              </li>
            </ul>
          </div>

          <div className="appdl-hero__device" aria-hidden="true">
            <PhoneChrome>
              <AppHomeMock />
            </PhoneChrome>
          </div>
        </div>
      </section>

      <section className="appdl-setup" id="setup">
        <div className="container appdl-setup__intro">
          <p className="appdl-setup__eyebrow">Setup guide</p>
          <h2 className="appdl-setup__heading">From download to daily use</h2>
          <p className="appdl-setup__sub">
            Scroll to walk through each step left to right — real email and phone UI, matching what
            you will see.
          </p>
          <div className="appdl-setup__progress" role="tablist" aria-label="Setup steps">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`appdl-setup__dot${active === i ? ' is-active' : ''}`}
                onClick={() => {
                  const pin = pinRef.current
                  if (!pin) return
                  const st = ScrollTrigger.getAll().find((t) => t.trigger === pin)
                  if (!st) return
                  const p = i / (STEPS.length - 1)
                  window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: 'smooth' })
                }}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="appdl-pin" ref={pinRef}>
          <div className="appdl-track" ref={trackRef}>
            {STEPS.map((step, i) => (
              <article key={step.id} className="appdl-step" data-step={step.id}>
                <div className="appdl-step__copy">
                  <p className="appdl-step__kicker">{step.kicker}</p>
                  <h3 className="appdl-step__title">{step.title}</h3>
                  <p className="appdl-step__body">{step.body}</p>
                </div>
                <div className="appdl-step__visual">{renderStepVisual(i)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="appdl-foot">
        <div className="container appdl-foot__inner">
          <div>
            <h2>Ready when you are</h2>
            <p>
              Android only for now. After install, keep the app updated from this page when we ship a
              new build.
            </p>
          </div>
          <a className="btn btn--primary btn--lg" href={APK_HREF} download="market-sphere.apk">
            <Download size={18} aria-hidden /> Download APK
          </a>
        </div>
      </section>
    </main>
  )
}

function renderStepVisual(index: number) {
  switch (index) {
    case 0:
      return (
        <BrowserCard>
          <div className="appdl-browser__page">
            <p className="appdl-browser__brand">Market Sphere Group</p>
            <h4>Get the Android app</h4>
            <span className="appdl-browser__cta">
              <Download size={14} /> Download APK
            </span>
          </div>
        </BrowserCard>
      )
    case 1:
      return (
        <PhoneChrome>
          <AndroidInstallMock />
        </PhoneChrome>
      )
    case 2:
      return (
        <PhoneChrome>
          <AppHomeMock />
        </PhoneChrome>
      )
    case 3:
      return <EmailConfirmMock />
    case 4:
      return (
        <PhoneChrome>
          <NotificationPermissionMock />
        </PhoneChrome>
      )
    default:
      return (
        <PhoneChrome>
          <VerifiedMock />
        </PhoneChrome>
      )
  }
}

function PhoneChrome({ children }: { children: ReactNode }) {
  return (
    <div className="appdl-phone">
      <div className="appdl-phone__bezel">
        <div className="appdl-phone__notch" />
        <div className="appdl-phone__screen">{children}</div>
      </div>
    </div>
  )
}

function BrowserCard({ children }: { children: ReactNode }) {
  return (
    <div className="appdl-browser">
      <div className="appdl-browser__bar">
        <span /><span /><span />
        <div className="appdl-browser__url">marketspheregroup.com/app</div>
      </div>
      {children}
    </div>
  )
}

function AppHomeMock() {
  return (
    <div className="appdl-app">
      <header className="appdl-app__bar">
        <img src={`${import.meta.env.BASE_URL}${LOGO_PATH}`} alt="" />
        <div>
          <strong>Market Sphere</strong>
          <small>Master Your Field for Relevance</small>
        </div>
      </header>
      <div className="appdl-app__hero-card">
        <span>Showcase</span>
        <p>Featured listings near you</p>
      </div>
      <div className="appdl-app__tiles">
        <div /><div /><div />
      </div>
      <nav className="appdl-app__nav">
        <span className="is-on">Home</span>
        <span>Showcase</span>
        <span>Browse</span>
        <span>Account</span>
      </nav>
    </div>
  )
}

function AndroidInstallMock() {
  return (
    <div className="appdl-android">
      <p className="appdl-android__label">Package installer</p>
      <div className="appdl-android__icon" />
      <h4>Market Sphere Group</h4>
      <p>Do you want to install this application?</p>
      <div className="appdl-android__actions">
        <span className="ghost">Cancel</span>
        <span className="ok">Install</span>
      </div>
      <div className="appdl-android__note">
        <ShieldCheck size={14} /> Source: Chrome · Allowed for this install
      </div>
    </div>
  )
}

function EmailConfirmMock() {
  return (
    <div className="appdl-email" aria-hidden="true">
      <div className="appdl-email__chrome">
        <MailOpen size={14} /> Inbox · Market Sphere Group
      </div>
      <div className="appdl-email__card">
        <div className="appdl-email__head">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={48} height={48}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}${LOGO_PATH}`
            }}
          />
          <p>Market Sphere Group</p>
          <h4>Confirm your email</h4>
        </div>
        <div className="appdl-email__body">
          <p>Hi there,</p>
          <p>
            Thanks for joining Botswana&apos;s service marketplace. Please confirm your email address
            to activate your account.
          </p>
          <span className="appdl-email__btn">Confirm email address</span>
          <p className="appdl-email__fine">This link opens the Market Sphere app on your phone.</p>
        </div>
        <div className="appdl-email__foot">Master Your Field for Relevance</div>
      </div>
    </div>
  )
}

function NotificationPermissionMock() {
  return (
    <div className="appdl-perm">
      <div className="appdl-perm__scrim" />
      <div className="appdl-perm__sheet">
        <Bell size={22} />
        <h4>Allow Market Sphere to send you notifications?</h4>
        <p>New listings, provider replies, and miss-you reminders.</p>
        <div className="appdl-perm__actions">
          <span>Don&apos;t allow</span>
          <span className="ok">Allow</span>
        </div>
      </div>
    </div>
  )
}

function VerifiedMock() {
  return (
    <div className="appdl-verified">
      <div className="appdl-verified__badge">✓</div>
      <h4>You’re verified</h4>
      <p>Your email has been confirmed. Return to the Market Sphere app and sign in.</p>
      <small>You can close this screen.</small>
    </div>
  )
}
