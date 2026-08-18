import { useState } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useLang } from '../../i18n/useLang'
import { useAuth, authErrorKey } from '../../lib/useAuth'
import { isFirebaseConfigured } from '../../lib/firebase'
import LangToggle from '../../components/LangToggle'
import './Login.css'

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v7.5h12c-.2 2-1.5 5-4.4 7l6.7 5.2C42.2 36 45 30.6 45 24z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.7-5.2c-1.8 1.3-4.3 2.2-7.8 2.2-6 0-11-4-12.8-9.4l-7 5.4C7.8 40.9 15.3 46 24 46z" />
      <path fill="#FBBC05" d="M11.2 28.3A13.4 13.4 0 0 1 10.5 24c0-1.5.3-3 .7-4.3l-7-5.4A22 22 0 0 0 2 24c0 3.5.8 6.9 2.2 9.7z" />
      <path fill="#EA4335" d="M24 10.6c3.3 0 5.6 1.4 6.9 2.6l5.9-5.8C33.2 4 28.9 2 24 2 15.3 2 7.8 7.1 4.2 14.3l7 5.4C13 14.3 18 10.6 24 10.6z" />
    </svg>
  )
}

export default function Login() {
  const { t } = useLang()
  const { user, loading, signInEmail, signUpEmail, signInGoogle } = useAuth()
  const [params] = useSearchParams()
  const location = useLocation()

  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState(null)

  if (loading) {
    return (
      <div className="auth auth--center" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  if (user) return <Navigate to={location.state?.from || '/app'} replace />

  const isSignup = mode === 'signup'

  const run = async (fn) => {
    setBusy(true)
    setErrorKey(null)
    try {
      await fn()
    } catch (err) {
      setErrorKey(authErrorKey(err))
      setBusy(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email.trim() || !password || (isSignup && !name.trim())) {
      setErrorKey('auth.err.emptyFields')
      return
    }
    run(() => (isSignup
      ? signUpEmail(email.trim(), password, name.trim())
      : signInEmail(email.trim(), password)))
  }

  return (
    <div className="auth">
      <header className="auth__header">
        <Link to="/" className="auth__brand">
          <span className="shell__brandDot" aria-hidden="true" />
          {t('app.name')}
        </Link>
        <LangToggle />
      </header>

      <main className="auth__main">
        <div className="card auth__card">
          <h2>{t(isSignup ? 'auth.signUpTitle' : 'auth.signInTitle')}</h2>

          {!isFirebaseConfigured && (
            <div className="notice notice--warn">
              <strong>{t('setup.title')}</strong>
              <p style={{ marginTop: 4 }}>{t('setup.body')}</p>
            </div>
          )}

          {errorKey && (
            <div className="notice notice--error" role="alert">{t(errorKey)}</div>
          )}

          <button
            type="button"
            className="btn btn--ghost btn--block"
            disabled={busy || !isFirebaseConfigured}
            onClick={() => run(signInGoogle)}
          >
            <GoogleGlyph />
            {t('auth.google')}
          </button>

          <div className="divider">{t('auth.or')}</div>

          <form className="stack stack-4" onSubmit={onSubmit} noValidate>
            {isSignup && (
              <div className="field">
                <label htmlFor="name">{t('auth.name')}</label>
                <input
                  id="name" name="name" type="text" autoComplete="name"
                  placeholder={t('auth.namePlaceholder')}
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                inputMode="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">{t('auth.password')}</label>
              <input
                id="password" name="password" type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                aria-describedby={isSignup ? 'pw-hint' : undefined}
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              {isSignup && <span id="pw-hint" className="small muted">{t('auth.passwordHint')}</span>}
            </div>

            <button className="btn btn--block" type="submit" disabled={busy || !isFirebaseConfigured}>
              {busy ? t('auth.working') : t(isSignup ? 'auth.signUp' : 'auth.signIn')}
            </button>
          </form>

          <p className="auth__switch small">
            {t(isSignup ? 'auth.haveAccount' : 'auth.noAccount')}{' '}
            <button
              type="button"
              className="btn--quiet auth__switchBtn"
              onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setErrorKey(null) }}
            >
              {t(isSignup ? 'auth.signIn' : 'auth.signUp')}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
