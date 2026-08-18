import { useLang } from '../i18n/useLang'

/**
 * Day 1 morning shell only. Each of these is replaced by the real screen in
 * the Day 1 afternoon / Day 2 morning passes — the empty-state copy is the
 * real copy, so nothing here reads as a dead end.
 */
export default function Placeholder({ titleKey, emptyTitleKey, emptyBodyKey }) {
  const { t } = useLang()
  return (
    <div className="stack stack-5">
      <h1>{t(titleKey)}</h1>
      <div className="empty">
        <h3>{t(emptyTitleKey)}</h3>
        <p>{t(emptyBodyKey)}</p>
      </div>
    </div>
  )
}
