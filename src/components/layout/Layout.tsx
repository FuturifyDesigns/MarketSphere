import { useEffect } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { PageTransition } from './PageTransition'
import { AccountNoticeListener } from '../auth/AccountNoticeListener'
import { ExitIntentModal } from '../marketing/ExitIntentModal'
import { LiveEditorBar, LiveEditorEntry } from '../cms/LiveEditorBar'
import { useLenis } from '../../hooks/useLenis'
import { usePageTheme } from '../../hooks/usePageTheme'
import { useSiteEdit } from '../../context/SiteEditContext'
import { prepareDomForCmsEdit } from '../../lib/cmsEditMode'
import { resetIntroActiveClass } from '../../lib/intro'

export function Layout() {
  useLenis()
  usePageTheme()
  const { editMode } = useSiteEdit()

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    document.documentElement.setAttribute('data-theme', 'day')
    resetIntroActiveClass()
  }, [])

  useEffect(() => {
    if (!editMode) return

    prepareDomForCmsEdit()
    const lateCleanup = window.setTimeout(prepareDomForCmsEdit, 250)

    return () => {
      window.clearTimeout(lateCleanup)
    }
  }, [editMode])

  return (
    <div className={`layout ${editMode ? 'layout--live-edit' : ''}`}>
      <AccountNoticeListener />
      <Navbar />
      <LiveEditorBar />
      <main className="main">
        <PageTransition />
      </main>
      <Footer />
      <ExitIntentModal />
      <LiveEditorEntry />
    </div>
  )
}
