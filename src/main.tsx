import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { preloadCriticalAssets } from './lib/preloadCriticalAssets'
import { preloadAllImages } from './lib/imagePreload'
import { initCookieConsent } from './lib/cookieConsent'
import './index.css'

preloadCriticalAssets()
preloadAllImages()
initCookieConsent()

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary label="root">
    <App />
  </ErrorBoundary>,
)
