import { createRoot } from 'react-dom/client'
import App from './App'
import { preloadCriticalAssets } from './lib/preloadCriticalAssets'
import './index.css'

preloadCriticalAssets()

createRoot(document.getElementById('root')!).render(<App />)
