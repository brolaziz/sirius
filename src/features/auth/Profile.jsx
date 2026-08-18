import { useLang } from '../../i18n/useLang'
import { useAuth } from '../../lib/useAuth'
import LangToggle from '../../components/LangToggle'

export default function Profile() {
  const { t } = useLang()
  const { user, profile, signOut } = useAuth()

  return (
    <div className="stack stack-5">
      <h1>{t('profile.title')}</h1>

      <div className="card stack stack-4">
        <div>
          <p className="small muted">{t('profile.account')}</p>
          <p style={{ fontWeight: 600 }}>{profile?.displayName || user?.displayName || '—'}</p>
          <p className="small muted">{user?.email}</p>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: 0 }} />

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{t('profile.language')}</span>
          <LangToggle />
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>{t('profile.targetScore')}</span>
          <span className="num">{profile?.targetScore ?? t('profile.notSet')}</span>
        </div>
      </div>

      <button type="button" className="btn btn--ghost" onClick={signOut}>
        {t('auth.signOut')}
      </button>
    </div>
  )
}
