import { Link } from 'react-router-dom'
import { useLang } from '../../i18n/useLang'
import { useAuth } from '../../lib/useAuth'
import StarTexture from '../../components/StarTexture'
import './Dashboard.css'

export default function Dashboard() {
  const { t } = useLang()
  const { user, profile } = useAuth()

  const firstName = (profile?.displayName || user?.displayName || '').split(' ')[0]
  const predicted = profile?.predictedScore

  return (
    <div className="stack stack-5">
      <section className="hero">
        <StarTexture />
        <div className="hero__content">
          <p className="hero__label">
            {t('dash.greeting')}{firstName ? `, ${firstName}` : ''}
          </p>
          <p className="hero__score num">{predicted ?? '—'}</p>
          <p className="hero__caption">
            {predicted ? t('dash.predicted') : t('dash.noScoreYet')}
          </p>
        </div>
      </section>

      {/* TODO(scale): replaced by real next-action + streak + deadline once
          attempts and the college list exist (Day 1 afternoon / Day 2 morning). */}
      <div className="empty">
        <h3>{t('dash.empty.title')}</h3>
        <p>{t('dash.empty.body')}</p>
        <Link className="btn" to="/app/practice" style={{ marginTop: 'var(--s4)', textDecoration: 'none' }}>
          {t('dash.empty.cta')}
        </Link>
      </div>
    </div>
  )
}
