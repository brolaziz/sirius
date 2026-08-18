import { Link } from 'react-router-dom'
import { useLang } from '../../i18n/useLang'
import LangToggle from '../../components/LangToggle'
import './Landing.css'

export default function Landing() {
  const { t } = useLang()
  const features = ['f1', 'f2', 'f3']

  return (
    <div className="landing">
      <header className="landing__header">
        <span className="landing__brand">
          <span className="shell__brandDot" aria-hidden="true" />
          {t('app.name')}
        </span>
        <LangToggle />
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <p className="landing__eyebrow num">DIGITAL SAT · UZ / EN</p>
          <h1>{t('landing.headline')}</h1>
          <p className="landing__body">{t('landing.body')}</p>
          <div className="landing__actions">
            <Link className="btn" to="/login?mode=signup">{t('landing.cta')}</Link>
            <Link className="btn btn--ghost" to="/login">{t('landing.hasAccount')}</Link>
          </div>
        </section>

        <section className="landing__features">
          {features.map((f) => (
            <div className="card landing__feature" key={f}>
              <h3>{t(`landing.${f}.title`)}</h3>
              <p className="muted">{t(`landing.${f}.body`)}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
