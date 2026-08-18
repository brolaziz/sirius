import { NavLink, Outlet } from 'react-router-dom'
import { useLang } from '../i18n/useLang'
import LangToggle from './LangToggle'
import './AppShell.css'

const TABS = [
  { to: '/app', end: true, key: 'nav.today', icon: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
  { to: '/app/practice', key: 'nav.practice', icon: 'M5 4h11l4 4v12H5zM15 4v5h5M8 13h8M8 17h5' },
  { to: '/app/universities', key: 'nav.universities', icon: 'M12 4 3 9h18zM5 11v7M10 11v7M14 11v7M19 11v7M3 20h18' },
  { to: '/app/words', key: 'nav.words', icon: 'M4 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-5a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h5z' },
  { to: '/app/profile', key: 'nav.profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
]

function TabIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

export default function AppShell() {
  const { t } = useLang()

  return (
    <div className="shell">
      <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>

      <header className="shell__header">
        <div className="shell__headerInner">
          <NavLink to="/app" className="shell__brand">
            <span className="shell__brandDot" aria-hidden="true" />
            {t('app.name')}
          </NavLink>
          <LangToggle />
        </div>
      </header>

      <div className="shell__body">
        <nav className="shell__tabs" aria-label={t('app.name')}>
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="shell__tab">
              <TabIcon d={tab.icon} />
              <span>{t(tab.key)}</span>
            </NavLink>
          ))}
        </nav>

        <main id="main" className="shell__main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
