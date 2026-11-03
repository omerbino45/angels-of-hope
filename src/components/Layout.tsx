import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom'
import { useI18n } from '../i18n'
import logo from '../assets/logo.jpeg'

export function Layout() {
  const { t, lang, toggle } = useI18n()
  return (
    <>
      <header className="nav no-print">
        <Link to="/" className="nav-brand">
          <img src={logo} alt="" />
          <span>{t('מלאכים של תקווה', 'Angels of Hope')}</span>
        </Link>
        <nav className="nav-links" aria-label={t('ניווט ראשי', 'Main navigation')}>
          <NavLink to="/" end className="nav-link">
            {t('בית', 'Home')}
          </NavLink>
          <NavLink to="/write" className="nav-link">
            {t('כתבו מכתב', 'Write a Letter')}
          </NavLink>
        </nav>
        <button className="lang-btn" onClick={toggle} lang={lang === 'he' ? 'en' : 'he'}>
          {t('English', 'עברית')}
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="no-print">
        <img className="footer-logo" src={logo} alt="" />
        <p className="footer-name">
          <strong>מלאכים של תקווה | Angels of Hope</strong>
        </p>
        <p>{t('נותנים יותר ממתנה, נותנים חיבוק של קהילה', "Giving more than a gift, giving a community's embrace")}</p>
        <p className="footer-copy">© 2025 מלאכים של תקווה</p>
        <p className="footer-admin">
          <Link to="/admin">{t('ניהול', 'Admin')}</Link>
        </p>
      </footer>
      <ScrollRestoration />
    </>
  )
}
