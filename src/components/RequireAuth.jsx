import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { useLang } from '../i18n/useLang'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const { t } = useLang()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth auth--center" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
