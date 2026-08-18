import { useLang } from '../i18n/useLang'
import './LangToggle.css'

export default function LangToggle() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="langtoggle" role="group" aria-label={t('lang.label')}>
      {['uz', 'en'].map((code) => (
        <button
          key={code}
          type="button"
          className="langtoggle__btn"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {t(`lang.${code}`)}
        </button>
      ))}
    </div>
  )
}
