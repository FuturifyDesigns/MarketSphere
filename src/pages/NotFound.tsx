import { Link } from 'react-router-dom'
import { ArrowLeft, Home, Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import './NotFound.css'

export function NotFound() {
  return (
    <div className="page not-found-page">
      <section className="not-found-hero">
        <div className="not-found-hero__glow" aria-hidden="true" />
        <div className="container not-found-hero__inner">
          <div className="not-found-hero__content page-enter-hero">
            <span className="section-label">404</span>
            <h1 className="display-xl">
              Page not<br />
              <em className="text-gold">found</em>
            </h1>
            <p className="lead">
              The page you are looking for does not exist, may have moved, or the link might be incorrect.
            </p>
            <div className="not-found-hero__actions">
              <Button to="/" variant="primary" size="lg">
                <Home size={18} aria-hidden="true" />
                Back to home
              </Button>
              <Button to="/browse" variant="secondary" size="lg">
                <Search size={18} aria-hidden="true" />
                Browse providers
              </Button>
            </div>
            <Link to="/contact" className="not-found-hero__link">
              <ArrowLeft size={16} aria-hidden="true" />
              Need help? Contact us
            </Link>
          </div>
          <p className="not-found-hero__code" aria-hidden="true">
            404
          </p>
        </div>
      </section>
    </div>
  )
}
