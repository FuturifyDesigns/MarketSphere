import { createRoot } from 'react-dom/client'
import App from './App'
import { preloadCriticalAssets } from './lib/preloadCriticalAssets'
import { preloadAllImages } from './lib/imagePreload'
import './index.css'

preloadCriticalAssets()
preloadAllImages()

createRoot(document.getElementById('root')!).render(<App />)
